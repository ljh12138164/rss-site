#!/usr/bin/python3
"""Production source acceptance must precede every timer enable operation."""
import importlib.util
import json
import tempfile
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path
from unittest.mock import patch

SPEC = importlib.util.spec_from_file_location('timers', Path(__file__).with_name('install-business-timers.py'))
TIMERS = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(TIMERS)


class TimerTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.root = Path(self.directory.name)
        self.jobs = self.root / 'jobs.json'
        self.jobs.write_text(json.dumps([
            {'source': 'openai', 'path': '/cron/signals/openai', 'schedule': '0 */2 * * *'},
            {'source': 'github', 'path': '/cron/signals/github', 'schedule': '30 0,6,12,18 * * *'},
            {'source': 'retention', 'path': '/cron/maintenance/retention', 'schedule': '30 5 * * *'},
        ]))
        self.output = self.root / 'units'
        self.evidence = self.root / 'evidence.json'
        self.valid = {'database_major': 18, 'old_writers_disabled': True,
                      'verified_jobs': ['openai', 'github'],
                      'verified_at': datetime.now(timezone.utc).isoformat()}

    def enable(self, **changes):
        self.evidence.write_text(json.dumps(self.valid | changes))
        TIMERS.install(self.jobs, self.output, self.evidence)

    def test_generation_never_enables_timers(self):
        with patch.object(TIMERS.subprocess, 'run') as run:
            TIMERS.install(self.jobs, self.output)
        run.assert_not_called()
        self.assertEqual(len(list(self.output.glob('*.timer'))), 3)
        self.assertIn('OnCalendar=*-*-* 0/2:0:00 UTC', (self.output / 'rss-site-business-openai.timer').read_text())

    def test_subset_evidence_cannot_enable_any_job(self):
        with patch.object(TIMERS.subprocess, 'run') as run:
            with self.assertRaisesRegex(ValueError, 'All configured sources'):
                self.enable(verified_jobs=['openai'])
        run.assert_not_called()
        self.assertFalse(self.output.exists())

    def test_old_writer_freeze_is_required(self):
        with self.assertRaisesRegex(ValueError, 'old writers'):
            self.enable(old_writers_disabled=False)
        self.assertFalse(self.output.exists())

    def test_wrong_database_major_is_rejected(self):
        with self.assertRaises(ValueError):
            self.enable(database_major=17)

    def test_expired_acceptance_is_rejected(self):
        with self.assertRaisesRegex(ValueError, 'expired'):
            self.enable(verified_at=(datetime.now(timezone.utc) - timedelta(hours=3)).isoformat())

    def test_unknown_job_cannot_be_enabled(self):
        with self.assertRaises(ValueError):
            self.enable(verified_jobs=['openai', 'github', 'unknown'])

    def test_complete_evidence_enables_only_verified_units(self):
        with patch.object(Path, 'resolve', return_value=Path('/etc/systemd/system')), \
                patch.object(TIMERS.subprocess, 'run') as run:
            self.enable()
        self.assertEqual(run.call_args_list[0].args[0], ['systemctl', 'daemon-reload'])
        self.assertEqual(run.call_args_list[1].args[0], ['systemctl', 'enable', '--now',
            'rss-site-business-openai.timer', 'rss-site-business-github.timer'])

    def test_cron_is_interpreted_in_utc(self):
        self.assertEqual(TIMERS.calendar('0 20 * * *'), '*-*-* 20:0:00 UTC')
        self.assertEqual(TIMERS.calendar('*/5 * * * *'), '*-*-* *:0/5:00 UTC')


if __name__ == '__main__':
    unittest.main()
