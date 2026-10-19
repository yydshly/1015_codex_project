"""Read-only verification of the public static deployment and original guide."""
from concurrent.futures import ThreadPoolExecutor
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin, urlsplit
from urllib.request import Request, urlopen
import hashlib
import json

ROOT=Path(__file__).resolve().parents[1]
BASE='https://yydshly.github.io/1015_codex_project/projects/012-smart-excalidraw-next/'
GUIDE='smart-excalidraw-understanding-20261020.png'

def read(url):
    with urlopen(Request(url,headers={'User-Agent':'Research-012-deployment-check'}),timeout=45) as response:
        return response.status,response.read()

class Links(HTMLParser):
    def __init__(self):super().__init__();self.paths=set()
    def handle_starttag(self,tag,attrs):
        for key,value in attrs:
            if key in ('src','href') and value and not value.startswith(('#','http:','https:','data:')):
                self.paths.add(value)

if __name__=='__main__':
    status,html=read(BASE)
    assert status==200
    parser=Links();parser.feed(html.decode())
    local_paths={p for p in parser.paths if not p.startswith('../')}
    local_paths.update(['extensions.md','notes.md','references/sources.json','vendor/THIRD_PARTY_LICENSES.txt'])
    manifest=json.loads((ROOT/'references/sources.json').read_text(encoding='utf-8'))
    local_paths.update('references/upstream/'+x['path'] for x in manifest['files'])
    def verify(relative):
        code,data=read(urljoin(BASE,relative));assert code==200,relative
        local=ROOT/'web'/relative
        if relative.startswith('references/') or relative in ['extensions.md','notes.md','capabilities.md','THIRD_PARTY.md']:
            local=ROOT/relative
        normalized=False
        if local.is_file():
            expected=local.read_bytes()
            if relative in ['extensions.md','notes.md','capabilities.md','THIRD_PARTY.md']:
                expected=expected.replace(b'web/vendor/',b'vendor/').replace(b'web/assets/',b'assets/')
            if data!=expected:
                assert data.replace(b'\r\n',b'\n')==expected.replace(b'\r\n',b'\n'),relative
                normalized=True
        return {'path':relative,'status':code,'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest(),'line_endings_normalized':normalized}
    with ThreadPoolExecutor(max_workers=6) as pool:checks=list(pool.map(verify,sorted(local_paths)))
    root_url=urljoin(BASE,'../../');code,navigation=read(root_url)
    assert code==200 and '012-smart-excalidraw-next/'.encode() in navigation
    cover_url=urljoin(root_url,'assets/012-smart-excalidraw-next/'+GUIDE)
    code,cover=read(cover_url)
    original=(ROOT/'assets'/GUIDE).read_bytes()
    assert code==200 and cover==original
    assert (ROOT/'web/assets'/GUIDE).read_bytes()==original
    record={'date':'2026-10-20','url':BASE,'navigation_url':root_url,'checks':checks,
            'guide_sha256':hashlib.sha256(original).hexdigest(),'navigation_cover_same_original':True,
            'scope':'Public static research page; no model or backend execution'}
    (ROOT/'references/deployed-verification.json').write_text(json.dumps(record,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(f'Public deployment verified: {len(checks)+3} HTTP/content checks, original PNG parity and navigation.')
