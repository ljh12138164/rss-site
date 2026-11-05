#!/usr/bin/python3
"""Archive encryption, integrity, retention, and failure-boundary regression tests."""
import hashlib
import importlib.util
import io
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from cryptography.exceptions import InvalidTag

SPEC = importlib.util.spec_from_file_location('backup', Path(__file__).with_name('postgres-backup.py'))
BACKUP = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(BACKUP)


class MemoryStorage:
    def __init__(self):
        self.objects = {}
        self.writes = []

    def ensure_private(self):
        pass

    def put(self, name, value):
        if name in self.objects:
            raise ValueError('Refuse overwrite')
        self.objects[name] = value
        self.writes.append(name)

    def get(self, name):
        return self.objects[name]

    def delete(self, names):
        for name in names:
            del self.objects[name]

    def list(self, prefix):
        return [{'name': name} for name in sorted({name[len(prefix):].split('/')[0]
                 for name in self.objects if name.startswith(prefix)})]


class Process:
    def __init__(self, data, code=0):
        self.stdout = io.BytesIO(data)
        self.code = code

    def wait(self):
        return self.code

    def kill(self):
        pass


class BackupTests(unittest.TestCase):
    def setUp(self):
        self.storage = MemoryStorage()
        self.key = BACKUP.AESGCM.generate_key(bit_length=256)
        self.payload = b'PGDMP' + bytes(range(256))

    def archive(self, code=0):
        with patch.object(BACKUP, 'CHUNK_SIZE', 64), \
                patch.object(BACKUP.subprocess, 'check_output', return_value=b'180000\n'), \
                patch.object(BACKUP.subprocess, 'Popen', return_value=Process(self.payload, code)):
            BACKUP.backup(self.storage, self.key, 'test-postgres')
        return self.storage.writes[-1].split('/')[0]

    def restore(self, snapshot, output):
        with patch.object(BACKUP, 'CHUNK_SIZE', 64):
            BACKUP.restore(self.storage, self.key, snapshot, output)

    def test_round_trip_multipart_archive_and_manifest_published_last(self):
        snapshot = self.archive()
        self.assertTrue(self.storage.writes[-1].endswith('/manifest.json'))
        self.assertEqual(len(self.storage.objects), 6)
        self.assertNotIn(self.payload, self.storage.objects.values())
        with tempfile.TemporaryDirectory() as folder:
            output = Path(folder) / 'restored.dump'
            self.restore(snapshot, output)
            self.assertEqual(output.read_bytes(), self.payload)

    def test_corrupt_ciphertext_does_not_leave_partial_plaintext(self):
        snapshot = self.archive()
        name = snapshot + '/part-00001.aesgcm'
        self.storage.objects[name] = b'corrupt'
        with tempfile.TemporaryDirectory() as folder:
            output = Path(folder) / 'restored.dump'
            with self.assertRaisesRegex(ValueError, 'checksum'):
                self.restore(snapshot, output)
            self.assertFalse(output.exists())

    def test_forged_checksum_cannot_bypass_gcm_authentication(self):
        snapshot = self.archive()
        name = snapshot + '/part-00000.aesgcm'
        part = bytearray(self.storage.objects[name])
        part[-1] ^= 1
        self.storage.objects[name] = bytes(part)
        manifest_name = snapshot + '/manifest.json'
        manifest = json.loads(self.storage.objects[manifest_name])
        manifest['parts'][0]['sha256'] = hashlib.sha256(part).hexdigest()
        self.storage.objects[manifest_name] = json.dumps(manifest).encode()
        with tempfile.TemporaryDirectory() as folder:
            output = Path(folder) / 'restored.dump'
            with self.assertRaises(InvalidTag):
                self.restore(snapshot, output)
            self.assertFalse(output.exists())

    def test_existing_output_is_preserved(self):
        snapshot = self.archive()
        with tempfile.TemporaryDirectory() as folder:
            output = Path(folder) / 'existing.dump'
            output.write_bytes(b'existing')
            with self.assertRaises(FileExistsError):
                self.restore(snapshot, output)
            self.assertEqual(output.read_bytes(), b'existing')

    def test_failed_dump_removes_partial_upload_and_preserves_prior_backup(self):
        self.archive()
        before = dict(self.storage.objects)
        with self.assertRaisesRegex(RuntimeError, 'pg_dump'):
            self.archive(code=1)
        self.assertEqual(self.storage.objects, before)

    def test_retention_keeps_five_complete_archives(self):
        for _ in range(7):
            self.archive()
        with patch.object(BACKUP, 'CHUNK_SIZE', 64):
            self.assertEqual(len(BACKUP.existing_backups(self.storage)), 5)

    def test_storage_budget_failure_preserves_existing_archive(self):
        self.archive()
        before = dict(self.storage.objects)
        with patch.object(BACKUP, 'MAX_STORAGE', 1):
            with self.assertRaisesRegex(RuntimeError, 'budget'):
                self.archive()
        self.assertEqual(self.storage.objects, before)


if __name__ == '__main__':
    unittest.main()
