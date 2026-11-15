"""Execute the CI packaging step with a controlled Docker CLI."""

import os
from pathlib import Path
import re
import subprocess
import tarfile
import tempfile
import unittest


ROOT = Path(__file__).resolve().parents[2]
WORKFLOW = ROOT / '.github/workflows/ci-deploy.yml'


class ReleasePackagingTest(unittest.TestCase):
    def run_packaging(self, fail_pull=False):
        workflow = WORKFLOW.read_text()
        block = re.search(
            r'      - name: Package release image\n        run: \|\n(.*?)(?=      - name:)',
            workflow,
            re.S,
        ).group(1)
        script = '\n'.join(line[10:] for line in block.splitlines())
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            binary = root / 'bin'
            binary.mkdir()
            docker = binary / 'docker'
            docker.write_text('''#!/bin/sh
set -eu
case "$1" in
  pull)
    test "${FAIL_PULL:-0}" = 0 || exit 1
    touch redis-loaded
    ;;
  save)
    shift
    output=''
    images=''
    while [ "$#" -gt 0 ]; do
      if [ "$1" = -o ]; then
        output=$2; shift 2
      else
        images="$images$1\n"; shift
      fi
    done
    printf '%b' "$images" > "$output"
    ;;
  *) exit 2 ;;
esac
''')
            docker.chmod(0o755)
            for name in ['compose.yaml', 'deploy/server/deploy-rss-site',
                         'deploy/server/rss-site-deploy-gate', 'deploy/server/rss-site-deploy.sudoers',
                         'deploy/server/sync-business-cron']:
                destination = root / name
                destination.parent.mkdir(parents=True, exist_ok=True)
                destination.write_text('fixture')
            env = {**os.environ, 'PATH': f'{binary}:{os.environ["PATH"]}',
                   'GITHUB_SHA': 'a' * 40, 'FAIL_PULL': str(int(fail_pull))}
            result = subprocess.run(['bash', '-e', '-c', script], cwd=root, env=env,
                                    capture_output=True, text=True)
            images = []
            if (root / 'release.tar.gz').exists():
                with tarfile.open(root / 'release.tar.gz') as archive:
                    images = archive.extractfile('image.tar').read().decode().splitlines()
            return result.returncode, images, (root / 'redis-loaded').exists()

    def test_existing_loader_receives_web_and_databases(self):
        status, images, pulled = self.run_packaging()
        self.assertEqual(status, 0)
        self.assertTrue(pulled)
        self.assertEqual(images, ['rss-site-web:sha-' + 'a' * 40,
                                 'rss-site-postgres:18-cron-v1', 'redis:7.4-alpine'])

    def test_pull_failure_stops_packaging(self):
        status, images, _ = self.run_packaging(fail_pull=True)
        self.assertNotEqual(status, 0)
        self.assertEqual(images, [])

    def test_prewarm_failure_does_not_roll_back_a_healthy_release(self):
        deploy = (ROOT / 'deploy/server/deploy-rss-site').read_text()
        tail = deploy[deploy.rindex('trap - ERR'):]
        script = '''set -eE
STACK=/unused
TAG=test-release
docker() { return 7; }
trap 'echo unexpected-rollback; exit 9' ERR
''' + tail
        result = subprocess.run(['bash', '-c', script], capture_output=True, text=True)
        self.assertEqual(result.returncode, 0)
        self.assertIn('Deployment healthy: test-release', result.stdout)
        self.assertIn('list cache prewarm incomplete', result.stderr)
        self.assertNotIn('unexpected-rollback', result.stdout)

    def test_unverified_activation_failure_does_not_roll_back_a_healthy_release(self):
        deploy = (ROOT / 'deploy/server/deploy-rss-site').read_text()
        tail = deploy[deploy.rindex('trap - ERR'):]
        with tempfile.TemporaryDirectory() as directory:
            temp_dir = Path(directory)
            sync_script = temp_dir / 'deploy/server/sync-business-cron'
            sync_script.parent.mkdir(parents=True)
            sync_script.write_text(
                '#!/usr/bin/env bash\necho "sync-arg:${1:-none}"\nexit 7\n',
                newline='\n',
            )
            script = f'''set -eE
STACK=/unused
TAG=test-release
TEMP={temp_dir.as_posix()}
docker() {{ return 0; }}
trap 'echo unexpected-rollback; exit 9' ERR
''' + tail
            result = subprocess.run(['bash', '-c', script], capture_output=True, text=True)
        self.assertEqual(result.returncode, 0)
        self.assertIn('sync-arg:--activate-unverified', result.stdout)
        self.assertIn('Deployment healthy: test-release', result.stdout)
        self.assertIn('unverified Cron job activation incomplete', result.stderr)
        self.assertNotIn('unexpected-rollback', result.stdout)

    def run_sync_activate(self, unverified_csv, cli_report, psql_summary='0\t\tf', active_timers=''):
        sync_script = ROOT / 'deploy/server/sync-business-cron'
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            binary = root / 'bin'
            binary.mkdir()
            calls_log = root / 'calls.log'
            fake_docker = binary / 'docker'
            fake_docker.write_text('''#!/usr/bin/env bash
set -euo pipefail
printf '%s\n' "$*" >> "$CALLS_LOG"
case "$*" in
  *" psql "*"not verified"*)
    printf '%s\n' "$UNVERIFIED_CSV"
    ;;
  *" bun server/api/src/setup/cli.mjs "*)
    printf '%s\n' "$CLI_REPORT"
    ;;
  *" psql "*"-v report="*)
    sql=$(cat)
    printf '%s\n' "$sql" >> "$CALLS_LOG"
    printf '%s\n' "$PSQL_SUMMARY"
    ;;
  *)
    echo "Unexpected docker call: $*" >&2
    exit 99
    ;;
esac
''', newline='\n')
            fake_docker.chmod(0o755)
            fake_systemctl = binary / 'systemctl'
            fake_systemctl.write_text('''#!/usr/bin/env bash
printf '%s' "$ACTIVE_TIMERS"
''', newline='\n')
            fake_systemctl.chmod(0o755)
            env = {
                **os.environ,
                'PATH': f'{binary.as_posix()}:{os.environ["PATH"]}',
                'STACK': '/unused',
                'CALLS_LOG': calls_log.as_posix(),
                'UNVERIFIED_CSV': unverified_csv,
                'CLI_REPORT': cli_report,
                'PSQL_SUMMARY': psql_summary,
                'ACTIVE_TIMERS': active_timers,
            }
            result = subprocess.run(
                ['bash', str(sync_script.relative_to(ROOT)).replace('\\', '/'), '--activate-unverified'],
                cwd=ROOT,
                env=env,
                capture_output=True,
                text=True,
            )
            calls = calls_log.read_text() if calls_log.exists() else ''
            return result.returncode, result.stdout, result.stderr, calls

    def test_sync_activate_skips_http_when_no_unverified_jobs_exist(self):
        code, stdout, stderr, calls = self.run_sync_activate('', '')
        self.assertEqual(code, 0)
        self.assertIn('No unverified PostgreSQL Cron jobs to activate', stdout)
        self.assertEqual(stderr, '')
        self.assertNotIn('cli.mjs', calls)

    def test_sync_activate_isolates_partial_success_and_surfaces_failures(self):
        code, stdout, stderr, calls = self.run_sync_activate(
            'cohere,minimax',
            '{"verified":["minimax"],"failed":[{"source":"cohere","reason":"upstream timeout"}]}',
            '1\tcohere (upstream timeout)\tt',
            'rss-site-postgres-backup.timer loaded active waiting\n',
        )
        self.assertEqual(code, 1)
        self.assertIn('--loopback --json --sources cohere,minimax', calls)
        self.assertIn('private.activate_verified_business_jobs', calls)
        self.assertIn('Automatically verified and activated 1 PostgreSQL Cron job(s)', stdout)
        self.assertIn('Failed to auto-verify/activate PostgreSQL Cron job(s): cohere (upstream timeout)', stderr)

    def test_sync_activate_enables_all_verified_jobs_and_exits_zero(self):
        code, stdout, stderr, calls = self.run_sync_activate(
            'minimax',
            '{"verified":["minimax"],"failed":[]}',
            '1\t\tt',
            'rss-site-supabase-keepalive.timer loaded active waiting\n',
        )
        self.assertEqual(code, 0)
        self.assertIn('--loopback --json --sources minimax', calls)
        self.assertIn('private.activate_verified_business_jobs', calls)
        self.assertIn('Automatically verified and activated 1 PostgreSQL Cron job(s)', stdout)
        self.assertEqual(stderr, '')

    def test_sync_activate_refuses_activation_when_stray_legacy_timer_is_active(self):
        code, stdout, stderr, calls = self.run_sync_activate(
            'minimax',
            '{"verified":["minimax"],"failed":[]}',
            '1\t\tt',
            'rss-site-legacy-ingest.timer loaded active waiting\n',
        )
        self.assertEqual(code, 1)
        self.assertEqual(stdout, '')
        self.assertIn('Unexpected active legacy timer(s)', stderr)
        self.assertNotIn('cli.mjs', calls)


if __name__ == '__main__':
    unittest.main()
