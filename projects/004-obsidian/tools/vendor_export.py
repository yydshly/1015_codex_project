"""Restore the pinned, unmodified MIT WebM muxer from its verified npm archive."""
import base64
import hashlib
import io
import json
from pathlib import Path
import tarfile
from urllib.request import urlopen

ROOT = Path(__file__).resolve().parents[1]


def main():
    lock = json.loads((ROOT / 'references/export-dependency.json').read_text())
    archive = urlopen(lock['tarball'], timeout=60).read()
    assert 'sha512-' + base64.b64encode(hashlib.sha512(archive).digest()).decode() == lock['integrity']
    target = ROOT / 'web/vendor/webm-muxer'
    target.mkdir(parents=True, exist_ok=True)
    with tarfile.open(fileobj=io.BytesIO(archive)) as package:
        for name, sha256 in lock['sha256'].items():
            source = 'build/' + name if name.endswith('.mjs') else name
            data = package.extractfile('package/' + source).read()
            assert hashlib.sha256(data).hexdigest() == sha256
            (target / name).write_bytes(data)
    print('Verified and restored webm-muxer ' + lock['version'])


if __name__ == '__main__':
    main()
