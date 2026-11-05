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
                         'deploy/server/rss-site-deploy-gate', 'deploy/server/rss-site-deploy.sudoers']:
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
        self.assertEqual(images, ['rss-site-web:sha-' + 'a' * 40, 'redis:7.4-alpine', 'postgres:18-alpine'])

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


if __name__ == '__main__':
    unittest.main()
