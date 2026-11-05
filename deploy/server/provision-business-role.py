#!/usr/bin/python3
"""Provision a non-owner application role on the isolated PostgreSQL 18 target."""
import os
import secrets
import subprocess
from pathlib import Path

ROOT = Path('/opt/stacks/rss-site/migration')


def provision():
    os.umask(0o077)
    target = ROOT / 'application18.env'
    if target.exists():
        raise RuntimeError('Application credentials exist; refusing to rotate silently')
    password = secrets.token_hex(32)
    query = f"""
begin;
create role rss_site_app login password '{password}' nosuperuser nocreatedb nocreaterole noreplication connection limit 10;
revoke create on schema public from public;
grant connect on database rss_site to rss_site_app;
grant usage on schema public,private to rss_site_app;
grant select,insert,update,delete on all tables in schema public,private to rss_site_app;
grant usage,select on all sequences in schema public,private to rss_site_app;
grant execute on function public.article_has_indexable_content(text,text,text), public.get_ingestion_health() to rss_site_app;
commit;
"""
    subprocess.run(['docker', 'exec', '-i', 'rss-site-postgres18', 'psql', '-U', 'postgres',
                    '-d', 'rss_site', '-v', 'ON_ERROR_STOP=1', '-q'],
                   input=query.encode(), stdout=subprocess.DEVNULL, check=True)
    target.write_text('DATABASE_URL=postgresql://rss_site_app:' + password + '@rss-site-postgres18:5432/rss_site\n')
    print('Application role provisioned; credentials saved to protected file')


if __name__ == '__main__':
    provision()
