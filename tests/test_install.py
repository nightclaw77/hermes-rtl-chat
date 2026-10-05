"""Installer behavior against an isolated fake Hermes home."""
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

class InstallTests(unittest.TestCase):
    def test_install_is_idempotent_and_leaves_other_files_alone(self):
        with tempfile.TemporaryDirectory(prefix='hermes-rtl-test-') as folder:
            home = Path(folder)
            sentinel = home / 'config.yaml'
            sentinel.write_text('untouched: true\n')
            command = [sys.executable, str(ROOT / 'install.py'), '--home', str(home)]
            for _ in range(2):
                result = subprocess.run(command, capture_output=True, text=True)
                self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
                self.assertEqual((home / 'desktop-plugins/hermes-rtl-chat/plugin.js').read_bytes(), (ROOT / 'plugin.js').read_bytes())
                self.assertEqual(sentinel.read_text(), 'untouched: true\n')

    def test_modified_install_is_not_overwritten(self):
        with tempfile.TemporaryDirectory(prefix='hermes-rtl-test-') as folder:
            home = Path(folder)
            target = home / 'desktop-plugins/hermes-rtl-chat/plugin.js'
            target.parent.mkdir(parents=True)
            target.write_text('// local modification\n')
            result = subprocess.run([sys.executable, str(ROOT / 'install.py'), '--home', str(home)], capture_output=True, text=True)
            self.assertNotEqual(result.returncode, 0)
            self.assertEqual(target.read_text(), '// local modification\n')

    def test_symlink_target_is_refused(self):
        with tempfile.TemporaryDirectory(prefix='hermes-rtl-test-') as folder:
            home = Path(folder)
            outside = home / 'outside.js'
            outside.write_text('// leave me alone\n')
            target = home / 'desktop-plugins/hermes-rtl-chat/plugin.js'
            target.parent.mkdir(parents=True)
            try:
                target.symlink_to(outside)
            except OSError:
                self.skipTest('symlinks unavailable')
            result = subprocess.run([sys.executable, str(ROOT / 'install.py'), '--home', str(home), '--replace'], capture_output=True, text=True)
            self.assertNotEqual(result.returncode, 0)
            self.assertTrue(target.is_symlink())
            self.assertEqual(outside.read_text(), '// leave me alone\n')

    def test_replace_keeps_a_backup(self):
        with tempfile.TemporaryDirectory(prefix='hermes-rtl-test-') as folder:
            home = Path(folder)
            target = home / 'desktop-plugins/hermes-rtl-chat/plugin.js'
            target.parent.mkdir(parents=True)
            target.write_bytes(b'// old version\n')
            result = subprocess.run([sys.executable, str(ROOT / 'install.py'), '--home', str(home), '--replace'], capture_output=True, text=True)
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertEqual(target.read_bytes(), (ROOT / 'plugin.js').read_bytes())
            backups = list((home / 'backups/hermes-rtl-chat').glob('*.js'))
            self.assertEqual(len(backups), 1)
            self.assertEqual(backups[0].read_bytes(), b'// old version\n')

if __name__ == '__main__':
    unittest.main()
