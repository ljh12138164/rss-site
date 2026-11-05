#!/usr/bin/python3
"""Call one registered Next job over loopback; never expose the Cron token."""
import json
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

STACK = Path('/opt/stacks/rss-site')


def run(source):
    jobs = json.loads((STACK / 'business-jobs.json').read_text())
    job = next((job for job in jobs if job['source'] == source), None)
    if job is None:
        raise RuntimeError('Unknown job')
    settings = {}
    for line in (STACK / 'runtime.env').read_text().splitlines():
        key, sep, value = line.partition('=')
        if sep:
            settings[key] = value.strip().strip('\"\'')
    secret = settings.get('CRON_SECRET')
    if not secret:
        raise RuntimeError('Cron configuration missing')
    for attempt in range(8):
        request = urllib.request.Request('http://127.0.0.1:18104' + job['path'], data=b'{}',
                                         headers={'Authorization': 'Bearer ' + secret,
                                                  'Content-Type': 'application/json'})
        with urllib.request.urlopen(request, timeout=180) as response:
            result = json.load(response)
            if response.status != 202:
                return result
        if attempt < 7:
            time.sleep(30)
    raise RuntimeError('Maintenance publication still pending')


if __name__ == '__main__':
    try:
        if len(sys.argv) != 2:
            raise RuntimeError('Expected one registered job')
        run(sys.argv[1])
    except Exception:
        raise SystemExit('Business job failed') from None
