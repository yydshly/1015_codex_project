"""Vendor a pinned, verified Mediabunny bundle and its corresponding source files."""
import base64
import hashlib
import io
import json
from pathlib import Path
import tarfile
from urllib.request import urlopen

ROOT = Path(__file__).resolve().parents[1]
VERSION = '1.61.4'
INTEGRITY = 'sha512-gZPBi40ldiZGeU2DJxT/Q3hlNiaxfpwNYTfmi0Maq3SoBJT64+W+ySc0Z7t+2JUGxNbkXnLFrDkSS2OQuweOhA=='


def main():
    url = f'https://registry.npmjs.org/mediabunny/-/mediabunny-{VERSION}.tgz'
    archive = urlopen(url, timeout=60).read()
    assert 'sha512-' + base64.b64encode(hashlib.sha512(archive).digest()).decode() == INTEGRITY
    hashes = {}
    destination = ROOT / 'web/vendor/mediabunny'
    with tarfile.open(fileobj=io.BytesIO(archive)) as package:
        for member in package:
            name = member.name.removeprefix('package/')
            if name not in ['dist/bundles/mediabunny.mjs', 'LICENSE', 'README.md', 'package.json'] and not name.startswith('src/'):
                continue
            if not member.isfile():
                continue
            data = package.extractfile(member).read()
            path = destination / name
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(data)
            hashes[name] = hashlib.sha256(data).hexdigest()
    lock = {'name': 'mediabunny', 'version': VERSION, 'source': 'https://github.com/Vanilagy/mediabunny',
            'license': 'MPL-2.0', 'tarball': url, 'integrity': INTEGRITY, 'sha256': hashes}
    (ROOT / 'references/media-dependency.json').write_text(json.dumps(lock, indent=2) + '\n', encoding='utf-8')
    print(f'Vendored Mediabunny {VERSION}: {len(hashes)} verified files with original sources and license.')


if __name__ == '__main__':
    main()
