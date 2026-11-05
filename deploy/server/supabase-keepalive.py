#!/usr/bin/python3
"""Read one public metadata row without writing data or execution logs."""

import json
import sys
import time
from pathlib import Path
from urllib.request import Request, urlopen


def check():
    settings = {}
    for line in Path('/opt/stacks/rss-site/runtime.env').read_text().splitlines():
        name, separator, value = line.partition('=')
        if separator and name in (
            'NEXT_PUBLIC_SUPABASE_URL',
            'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
        ):
            settings[name] = value.strip().strip('\"\'')
    base = settings['NEXT_PUBLIC_SUPABASE_URL'].rstrip('/')
    if not base.startswith('https://'):
        raise ValueError('HTTPS required')
    request = Request(
        base + '/rest/v1/source_status?select=source&limit=1',
        headers={
            'apikey': settings['NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'],
            'Cache-Control': 'no-cache',
        },
    )
    with urlopen(request, timeout=10) as response:
        data = json.loads(response.read(4096))
        if response.status != 200 or not isinstance(data, list):
            raise ValueError('Invalid response')


if __name__ == '__main__':
    for attempt in range(3):
        try:
            check()
            sys.exit(0)
        except Exception:
            if attempt < 2:
                time.sleep((2, 5)[attempt])
    sys.exit(1)
