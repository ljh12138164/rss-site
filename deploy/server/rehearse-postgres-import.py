#!/usr/bin/python3
"""Import only into the empty migration target and compare snapshot row counts."""
import json
import subprocess
from pathlib import Path

ROOT = Path('/opt/stacks/rss-site/migration')


def psql(query):
    return subprocess.check_output([
        'docker', 'exec', '-i', 'rss-site-postgres18', 'psql', '-U', 'postgres', '-d', 'rss_site',
        '-v', 'ON_ERROR_STOP=1', '-At', '--single-transaction',
    ], input=query.encode()).decode().strip()


def rehearse():
    existing = psql("select count(*) from pg_tables where schemaname in ('public','private')")
    if existing != '0':
        raise RuntimeError('Target is not empty; refusing to overwrite data')
    psql((ROOT / 'baseline.sql').read_text())
    subprocess.run(['docker', 'cp', str(ROOT / 'source.dump'), 'rss-site-postgres18:/tmp/source.dump'], check=True)
    subprocess.run(['docker', 'exec', 'rss-site-postgres18', 'pg_restore', '-U', 'postgres',
                    '-d', 'rss_site', '--data-only', '--disable-triggers', '--exit-on-error',
                    '--no-owner', '--no-acl', '--single-transaction', '/tmp/source.dump'], check=True)
    process = subprocess.Popen([
        'docker', 'run', '--rm', '-v', str(ROOT) + ':/backup', 'postgres:18-alpine',
        'pg_restore', '--data-only', '--no-owner', '--no-acl', '--file=-', '/backup/source.dump',
    ], stdout=subprocess.PIPE, text=True)
    counts = {}
    table = None
    for line in process.stdout:
        if line.startswith('COPY public.'):
            table = line.split()[1]
            counts[table] = 0
        elif line.strip() == '\\.':
            table = None
        elif table:
            counts[table] += 1
    if process.wait():
        raise RuntimeError('Snapshot count extraction failed')
    result = {}
    for name, expected in counts.items():
        # Identifiers are parsed from our own pg_dump, not user-provided SQL.
        actual = int(psql('select count(*) from ' + name))
        if actual != expected:
            raise RuntimeError('Snapshot row count mismatch: ' + name)
        result[name] = actual
    psql('analyze')
    (ROOT / 'rehearsal-counts-18.json').write_text(json.dumps(result, indent=2))
    print(json.dumps({'matched_tables': len(result), 'row_counts': result}))


if __name__ == '__main__':
    rehearse()
