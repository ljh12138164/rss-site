#!/usr/bin/python3
"""Generate ECS timers; enable only jobs covered by target-database acceptance evidence."""
import argparse
import json
import re
import subprocess
from datetime import datetime, timezone
from pathlib import Path


def calendar(schedule):
    minute, hour, day, month, weekday = schedule.split()
    if (day, month, weekday) != ('*', '*', '*'):
        raise ValueError('Unsupported daily schedule')

    def field(value, maximum):
        if value == '*':
            return '*'
        if value.startswith('*/') and value[2:].isdigit() and 0 < int(value[2:]) <= maximum:
            return '0/' + value[2:]
        if re.fullmatch(r'\d+(,\d+)*', value) and all(int(n) <= maximum for n in value.split(',')):
            return value
        raise ValueError('Invalid schedule field')

    return '*-*-* ' + field(hour, 23) + ':' + field(minute, 59) + ':00 UTC'


def install(jobs_path, output, evidence_path=None):
    jobs = json.loads(jobs_path.read_text())
    verified = []
    if evidence_path:
        evidence = json.loads(evidence_path.read_text())
        if evidence.get('database_major') != 18 or evidence.get('old_writers_disabled') is not True:
            raise ValueError('Cutover evidence required; old writers must be disabled')
        verified = evidence.get('verified_jobs', [])
        configured = {job['source'] for job in jobs}
        sources = {job['source'] for job in jobs if job['path'].startswith('/cron/signals/')}
        if (not isinstance(verified, list) or not verified
                or not set(verified) <= configured or not sources <= set(verified)):
            raise ValueError('All configured sources must pass before any timer is enabled')
        verified_at = datetime.fromisoformat(evidence['verified_at'].replace('Z', '+00:00'))
        age = (datetime.now(timezone.utc) - verified_at).total_seconds()
        if not -300 <= age <= 7200:
            raise ValueError('Source acceptance evidence expired')
        if output.resolve() != Path('/etc/systemd/system'):
            raise ValueError('Enable only installed system units')
    output.mkdir(parents=True, exist_ok=True)
    for job in jobs:
        name = job['source']
        if not re.fullmatch(r'[a-z0-9-]+', name):
            raise ValueError('Invalid job identifier')
        (output / f'rss-site-business-{name}.timer').write_text(f'''[Unit]
Description=RSS site {name} schedule

[Timer]
OnCalendar={calendar(job['schedule'])}
Persistent=true
AccuracySec=1s
Unit=rss-site-business@{name}.service

[Install]
WantedBy=timers.target
''')
    (output / 'rss-site-business@.service').write_text('''[Unit]
Description=RSS site business job %i
After=docker.service network-online.target
Wants=network-online.target

[Service]
Type=oneshot
User=root
ExecStart=/usr/bin/python3 /usr/local/sbin/rss-site-business-job.py %i
TimeoutStartSec=1800
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
''')
    if evidence_path:
        subprocess.run(['systemctl', 'daemon-reload'], check=True)
        subprocess.run(['systemctl', 'enable', '--now',
                        *[f'rss-site-business-{name}.timer' for name in verified]], check=True)
    print(f'Generated {len(jobs)} timers; ' + ('verified timers enabled' if evidence_path else 'no timers enabled'))


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--jobs', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--enable-with-evidence', type=Path)
    args = parser.parse_args()
    install(args.jobs, args.output, args.enable_with_evidence)
