#!/usr/bin/python3
"""Prepare an isolated target and a source snapshot; never switch live traffic."""
import os
import secrets
import subprocess
import sys
import time
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path('/opt/stacks/rss-site/migration')


def run(*args, **kwargs):
    return subprocess.run(args, check=True, **kwargs)


def export_source():
    settings = {}
    for line in (ROOT / 'source.env').read_text(encoding='utf-8-sig').splitlines():
        name, separator, value = line.partition('=')
        if separator:
            settings[name] = value.strip().strip('\"\'')
    url = urlsplit(settings['DATABASE_URL'])
    env = dict(os.environ, PGHOST=url.hostname, PGPORT=str(url.port or 5432),
               PGUSER=unquote(url.username), PGPASSWORD=unquote(url.password),
               PGDATABASE=url.path.lstrip('/'), PGSSLMODE='require')
    run('docker', 'run', '--rm', '--network', 'host',
        '--env', 'PGHOST', '--env', 'PGPORT', '--env', 'PGUSER', '--env', 'PGPASSWORD',
        '--env', 'PGDATABASE', '--env', 'PGSSLMODE',
        '-v', str(ROOT) + ':/backup', 'postgres:18-alpine',
        'pg_dump', '--format=custom', '--no-owner', '--no-acl', '--schema=public',
        '--schema=private', '--file=/backup/source.dump', env=env)
    with (ROOT / 'source-schema.sql').open('wb') as output:
        run('docker', 'run', '--rm', '-v', str(ROOT) + ':/backup', 'postgres:18-alpine',
            'pg_restore', '--schema-only', '--no-owner', '--no-acl', '--file=-', '/backup/source.dump', stdout=output)


def prepare():
    os.umask(0o077)
    ROOT.mkdir(mode=0o700, parents=True, exist_ok=True)
    source = ROOT / 'source.env'
    source.chmod(0o600)
    if (ROOT / 'target18.env').exists():
        raise RuntimeError('Target configuration already exists; inspect before retrying')
    password = secrets.token_urlsafe(32)
    (ROOT / 'target18.env').write_text('POSTGRES_PASSWORD=' + password + '\nPOSTGRES_DB=rss_site\n')
    if subprocess.run(['docker', 'network', 'inspect', 'rss-site-database'],
                      stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL).returncode:
        run('docker', 'network', 'create', '--internal', 'rss-site-database')
    run('docker', 'volume', 'create', 'rss-site-postgres18-data')
    run('docker', 'run', '-d', '--name', 'rss-site-postgres18', '--restart', 'unless-stopped',
        '--network', 'rss-site-database', '--memory', '256m', '--env-file', str(ROOT / 'target18.env'),
        '-v', 'rss-site-postgres18-data:/var/lib/postgresql',
        '--health-cmd', 'pg_isready -U postgres -d rss_site', '--health-interval', '5s',
        '--health-timeout', '3s', '--health-retries', '12', 'postgres:18-alpine',
        '-c', 'shared_buffers=32MB', '-c', 'max_connections=20', '-c', 'work_mem=2MB',
        '-c', 'maintenance_work_mem=32MB', stdout=subprocess.DEVNULL)
    for _ in range(30):
        ready = subprocess.run(['docker', 'exec', 'rss-site-postgres18', 'pg_isready',
                                '-U', 'postgres', '-d', 'rss_site'],
                               stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        if ready.returncode == 0:
            break
        time.sleep(2)
    else:
        raise RuntimeError('PostgreSQL did not become ready')
    # Source connection stays inside a root-only env file and container environment.
    if '--target-only' not in sys.argv:
        export_source()
    print('Isolated PostgreSQL created; live writes unchanged')


if __name__ == '__main__':
    try:
        if '--export-only' in sys.argv:
            export_source()
        else:
            prepare()
    except subprocess.CalledProcessError:
        raise SystemExit('Preparation failed; inspect target state before retrying')
