#!/usr/bin/env python3
"""Install a reviewed local plugin; never download or alter Hermes source."""
import argparse
import hashlib
import os
import sys
import tempfile
from pathlib import Path

ID = 'hermes-rtl-chat'

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--home', type=Path, default=Path(os.environ.get('HERMES_HOME') or Path.home() / '.hermes'), help='Hermes app-level home; default: HERMES_HOME or ~/.hermes')
    parser.add_argument('--replace', action='store_true', help='Replace a different existing file after saving a persistent backup')
    args = parser.parse_args()
    source = Path(__file__).resolve().with_name('plugin.js')
    target = args.home.expanduser().absolute() / 'desktop-plugins' / ID / 'plugin.js'
    payload = source.read_bytes()
    for entry in (target, *target.parents):
        if entry.is_symlink():
            raise ValueError(f'Symlink destination refused: {entry}')
    target.parent.mkdir(parents=True, exist_ok=True)
    if target.exists() and target.read_bytes() == payload:
        print(f'Already installed: {target}')
        return 0
    if target.exists():
        if not args.replace:
            raise ValueError('Different existing plugin found; review it first. Use --replace to back it up and replace it.')
        old = target.read_bytes()
        backup_dir = args.home.expanduser().absolute() / 'backups' / ID
        backup_dir.mkdir(parents=True, exist_ok=True)
        backup = backup_dir / (hashlib.sha256(old).hexdigest() + '.js')
        if backup.exists():
            if backup.read_bytes() != old:
                raise ValueError('Backup conflict; refusing to overwrite')
        else:
            with backup.open('xb') as stream:
                stream.write(old)
        print(f'Backup: {backup}')
    with tempfile.NamedTemporaryFile(dir=target.parent, prefix='.plugin-', delete=False) as stream:
        temp = Path(stream.name)
        stream.write(payload)
    try:
        os.replace(temp, target)
    finally:
        temp.unlink(missing_ok=True)
    print(f'Installed: {target}')
    print(f'SHA256: {hashlib.sha256(payload).hexdigest()}')
    print('The running app normally hot-loads it. If needed: Reload desktop plugins in the command palette.')
    return 0

if __name__ == '__main__':
    try:
        sys.exit(main())
    except (OSError, ValueError) as error:
        print(f'ERROR: {error}', file=sys.stderr)
        sys.exit(1)
