#!/usr/bin/python3
"""Encrypted PostgreSQL archives in a private Supabase Storage bucket.

Uses cryptography AESGCM. Configuration and encryption key stay on the host.
"""
import argparse
import base64
import hashlib
import json
import os
import re
import subprocess
import sys
import uuid
from datetime import datetime, timezone
from pathlib import Path
from urllib.error import HTTPError
from urllib.parse import quote, urlsplit
from urllib.request import Request, urlopen

from cryptography.hazmat.primitives.ciphers.aead import AESGCM

CHUNK_SIZE = 20 * 1024 * 1024
MAX_STORAGE = 800 * 1024 * 1024
KEEP = 5


def protected_file(path):
    if path.stat().st_mode & 0o077:
        raise ValueError('Configuration and key files must have mode 600')
    return path.read_text().strip()


class Storage:
    def __init__(self, config):
        self.url = config['NEXT_PUBLIC_SUPABASE_URL'].rstrip('/') + '/storage/v1'
        if urlsplit(self.url).scheme != 'https':
            raise ValueError('Storage requires HTTPS')
        self.key = config['SUPABASE_STORAGE_KEY']
        self.bucket = 'postgres-backups'

    def request(self, method, path, data=None, content_type='application/json'):
        request = Request(self.url + path, data=data, method=method, headers={
            'apikey': self.key, 'Authorization': 'Bearer ' + self.key,
            'Content-Type': content_type,
        })
        try:
            with urlopen(request, timeout=120) as response:
                return response.read()
        except HTTPError as error:
            # Never include response bodies, headers, or credential-bearing requests.
            raise RuntimeError(f'Storage operation failed: HTTP {error.code}') from None

    def ensure_private(self):
        bucket = json.loads(self.request('GET', '/bucket/' + self.bucket))
        if bucket.get('public') is not False:
            raise ValueError('Backup bucket must be private')

    def put(self, name, data):
        self.request('POST', '/object/' + self.bucket + '/' + quote(name),
                     data, 'application/octet-stream')

    def get(self, name):
        return self.request('GET', '/object/authenticated/' + self.bucket + '/' + quote(name))

    def delete(self, names):
        if names:
            self.request('DELETE', '/object/' + self.bucket,
                         json.dumps({'prefixes': names}).encode())

    def list(self, prefix):
        result = []
        while True:
            page = json.loads(self.request('POST', '/object/list/' + self.bucket,
                json.dumps({'prefix': prefix, 'limit': 100, 'offset': len(result),
                            'sortBy': {'column': 'name', 'order': 'asc'}}).encode()))
            result.extend(page)
            if len(page) < 100:
                return result


def valid_snapshot(value):
    if not re.fullmatch(r'\d{8}T\d{6}Z-[a-f0-9]{12}', value):
        raise ValueError('Invalid snapshot identifier')
    return value


def manifest_parts(manifest, snapshot):
    if (manifest.get('version') != 1 or manifest.get('snapshot') != snapshot
            or manifest.get('postgres_major') != 18 or not manifest.get('parts')):
        raise ValueError('Invalid backup manifest')
    for index, part in enumerate(manifest['parts']):
        if (part.get('name') != f'{snapshot}/part-{index:05d}.aesgcm'
                or not isinstance(part.get('size'), int)
                or not 28 < part['size'] <= CHUNK_SIZE + 28
                or not re.fullmatch(r'[a-f0-9]{64}', part.get('sha256', ''))):
            raise ValueError('Invalid backup part')
    return manifest['parts']


def existing_backups(storage):
    backups = []
    for item in storage.list(''):
        snapshot = item['name']
        if not re.fullmatch(r'\d{8}T\d{6}Z-[a-f0-9]{12}', snapshot):
            continue
        # Incomplete archives are never considered restorable or retention candidates.
        files = storage.list(snapshot + '/')
        if any(file['name'] == 'manifest.json' for file in files):
            manifest = json.loads(storage.get(snapshot + '/manifest.json'))
            parts = manifest_parts(manifest, snapshot)
            backups.append((snapshot, sum(part['size'] for part in parts)))
    return sorted(backups)


def backup(storage, key, container):
    storage.ensure_private()
    version = subprocess.check_output(['docker', 'exec', container, 'psql', '-U', 'postgres',
        '-d', 'rss_site', '-Atc', 'show server_version_num']).decode().strip()
    if not version.isdigit() or int(version) // 10000 != 18:
        raise ValueError('Refuse to back up an unexpected PostgreSQL version')
    existing = existing_backups(storage)
    snapshot = datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ') + '-' + uuid.uuid4().hex[:12]
    parts = []
    uploaded = []
    total = sum(size for _, size in existing)
    process = subprocess.Popen(['docker', 'exec', container, 'pg_dump', '-U', 'postgres',
        '-d', 'rss_site', '--format=custom', '--no-owner', '--no-acl',
        '--schema=public', '--schema=private'], stdout=subprocess.PIPE)
    try:
        while True:
            plaintext = process.stdout.read(CHUNK_SIZE)
            if not plaintext:
                break
            name = f'{snapshot}/part-{len(parts):05d}.aesgcm'
            nonce = os.urandom(12)
            ciphertext = nonce + AESGCM(key).encrypt(nonce, plaintext, name.encode())
            del plaintext
            total += len(ciphertext)
            if total > MAX_STORAGE:
                raise RuntimeError('Backup storage budget exceeded; existing backups retained')
            storage.put(name, ciphertext)
            uploaded.append(name)
            parts.append({'name': name, 'size': len(ciphertext),
                          'sha256': hashlib.sha256(ciphertext).hexdigest()})
        if process.wait() != 0 or not parts:
            raise RuntimeError('pg_dump did not produce a complete archive')
        manifest = {'version': 1, 'snapshot': snapshot, 'postgres_major': 18, 'parts': parts}
        manifest_name = snapshot + '/manifest.json'
        storage.put(manifest_name, json.dumps(manifest).encode())
        uploaded.append(manifest_name)
        if json.loads(storage.get(manifest_name)) != manifest:
            raise RuntimeError('Uploaded manifest verification failed')
    except BaseException:
        process.kill()
        process.wait()
        storage.delete(uploaded)
        raise
    # Publish manifest last; prune only after the new archive is complete.
    for old_snapshot, _ in existing[:max(0, len(existing) + 1 - KEEP)]:
        old = json.loads(storage.get(old_snapshot + '/manifest.json'))
        storage.delete([p['name'] for p in manifest_parts(old, old_snapshot)]
                       + [old_snapshot + '/manifest.json'])
    print(json.dumps({'snapshot': snapshot, 'parts': len(parts),
                      'encrypted_bytes': sum(part['size'] for part in parts)}))


def restore(storage, key, snapshot, output):
    valid_snapshot(snapshot)
    storage.ensure_private()
    manifest = json.loads(storage.get(snapshot + '/manifest.json'))
    parts = manifest_parts(manifest, snapshot)
    # Refuse overwrite. Only an authenticated, checksum-verified part reaches disk.
    try:
        with output.open('xb') as target:
            for part in parts:
                ciphertext = storage.get(part['name'])
                if (len(ciphertext) != part['size']
                        or hashlib.sha256(ciphertext).hexdigest() != part['sha256']):
                    raise ValueError('Downloaded backup checksum mismatch')
                target.write(AESGCM(key).decrypt(ciphertext[:12], ciphertext[12:],
                                                part['name'].encode()))
    except FileExistsError:
        raise
    except BaseException:
        output.unlink(missing_ok=True)
        raise
    print(json.dumps({'snapshot': snapshot, 'downloaded_and_decrypted': True}))


def main():
    os.umask(0o077)
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--config', type=Path, default=Path('/etc/rss-site/postgres-backup.env'))
    parser.add_argument('--key', type=Path, default=Path('/etc/rss-site/postgres-backup.key'))
    parser.add_argument('--container', default='rss-site-postgres-1')
    parser.add_argument('--restore', metavar='SNAPSHOT')
    parser.add_argument('--output', type=Path)
    args = parser.parse_args()
    config = dict(line.split('=', 1) for line in protected_file(args.config).splitlines()
                  if line and not line.startswith('#'))
    runtime = dict(line.split('=', 1) for line in protected_file(
        Path('/opt/stacks/rss-site/runtime.env')).splitlines()
        if line and not line.startswith('#') and '=' in line)
    config['NEXT_PUBLIC_SUPABASE_URL'] = runtime['NEXT_PUBLIC_SUPABASE_URL'].strip().strip('\"\'')
    key = base64.b64decode(protected_file(args.key), validate=True)
    if len(key) != 32:
        raise ValueError('Backup key must contain 32 random bytes encoded as base64')
    storage = Storage(config)
    if args.restore:
        if not args.output:
            parser.error('--restore requires --output')
        restore(storage, key, args.restore, args.output)
    else:
        backup(storage, key, args.container)


if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        # Print the type only: unexpected library errors can contain configuration.
        print('PostgreSQL backup failed: ' + type(error).__name__, file=sys.stderr)
        sys.exit(1)
