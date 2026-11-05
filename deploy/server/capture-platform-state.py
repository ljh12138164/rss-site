#!/usr/bin/python3
"""Capture non-secret scheduling metadata and encrypt the existing Cookie state in transit."""
import base64
import json
import os
import subprocess
from pathlib import Path
from urllib.parse import unquote, urlsplit
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

ROOT = Path('/opt/stacks/rss-site/migration')


def source_query(query):
    settings = dict(line.split('=', 1) for line in (ROOT / 'source.env').read_text(encoding='utf-8-sig').splitlines() if '=' in line and not line.startswith('#'))
    url = urlsplit(settings['DATABASE_URL'].strip().strip('\"\''))
    env = dict(os.environ, PGHOST=url.hostname, PGPORT=str(url.port or 5432),
               PGUSER=unquote(url.username), PGPASSWORD=unquote(url.password),
               PGDATABASE=url.path.lstrip('/'), PGSSLMODE='require')
    return subprocess.check_output(['docker', 'run', '--rm', '-i', '--network', 'host',
        '--env', 'PGHOST', '--env', 'PGPORT', '--env', 'PGUSER', '--env', 'PGPASSWORD',
        '--env', 'PGDATABASE', '--env', 'PGSSLMODE', 'postgres:18-alpine',
        'psql', '-At', '-v', 'ON_ERROR_STOP=1'], input=query.encode(), env=env).decode().strip()


def capture():
    os.umask(0o077)
    jobs = json.loads(source_query("select coalesce(json_agg(row_to_json(j)),'[]') from (select jobid,jobname,schedule,active from cron.job order by jobname) j"))
    (ROOT / 'source-jobs.json').write_text(json.dumps(jobs, indent=2))
    target = ROOT / 'cookie-state18.sql'
    if target.exists():
        raise RuntimeError('Encrypted state already captured; inspect before refreshing')
    state = json.loads(source_query("select decrypted_secret from vault.decrypted_secrets where name='zhihu_cookie_refresh_state'"))
    key = AESGCM.generate_key(bit_length=256)
    iv = os.urandom(12)
    encrypted = AESGCM(key).encrypt(iv, json.dumps(state).encode(), None)
    # Match Node crypto: nonce, authentication tag, ciphertext.
    value = base64.b64encode(iv + encrypted[-16:] + encrypted[:-16]).decode()
    (ROOT / 'maintenance18.env').write_text('MAINTENANCE_ENCRYPTION_KEY=' + base64.b64encode(key).decode() + '\n')
    target.write_text("insert into private.maintenance_state(name,value) values ('zhihu_cookie_refresh_state',jsonb_build_object('encrypted','" + value + "'));\n")
    subprocess.run(['docker', 'exec', '-i', 'rss-site-postgres18', 'psql', '-U', 'postgres',
                    '-d', 'rss_site', '-q', '-v', 'ON_ERROR_STOP=1'], input=target.read_bytes(),
                   stdout=subprocess.DEVNULL, check=True)
    print(json.dumps({'cron_jobs': len(jobs), 'active_jobs': sum(j['active'] for j in jobs),
                      'cookie_state_imported_encrypted': True, 'publish_pending': bool(state.get('publishPending'))}))


if __name__ == '__main__':
    capture()
