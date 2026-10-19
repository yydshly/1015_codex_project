"""Check a local or deployed static research release; never contacts BOSS."""
import argparse
import hashlib
from html.parser import HTMLParser
import json
from pathlib import Path
from urllib.parse import urljoin
from urllib.request import Request, urlopen

ROOT=Path(__file__).resolve().parents[1]


class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.images=[]
        self.headings=[]
        self._in_heading=False

    def handle_starttag(self,tag,attrs):
        attrs=dict(attrs)
        if tag=='img':self.images.append(attrs.get('src',''))
        if tag in ('h1','h2'):self._in_heading=True

    def handle_endtag(self,tag):
        if tag in ('h1','h2'):self._in_heading=False

    def handle_data(self,data):
        if self._in_heading:self.headings.append(data)


def normal(data):
    return data.decode('utf-8-sig').replace('\r\n','\n').encode('utf-8')


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--base',required=True,help='Site root, including repository base path when needed')
    parser.add_argument('--output',default='references/release-verification.json')
    args=parser.parse_args()
    base=args.base.rstrip('/')+'/'
    project=f'projects/{ROOT.name}/'
    records=[]

    def get(relative,local=None,binary=False,contains=()):
        url=urljoin(base,relative)
        request=Request(url,headers={'User-Agent':'Research-Release-Verification/1.0','Cache-Control':'no-cache'})
        with urlopen(request,timeout=40) as response:
            data=response.read()
            assert response.status==200,(url,response.status)
        if local is not None:
            expected=local.read_bytes()
            assert (data==expected if binary else normal(data)==normal(expected)),f'Content differs: {url}'
        for term in contains:
            assert term in data.decode('utf-8'),(relative,term)
        records.append({'path':relative,'status':200,'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest(),'source_match':local is not None})
        return data

    guide=ROOT/'assets/boss-agent-panorama.png'
    navigation=get('',contains=(ROOT.name,'浏览器 fetch','boss-agent-panorama.png'))
    nav=Page();nav.feed(navigation.decode('utf-8'))
    cover=f'assets/{ROOT.name}/boss-agent-panorama.png'
    assert cover in nav.images
    get(cover,guide,binary=True)
    html=get(project,ROOT/'web/index.html',contains=('我们的理解','HTTP','fetch','网络监听','风险','合成','guide-dialog'))
    page=Page();page.feed(html.decode('utf-8'))
    assert page.images.count('assets/boss-agent-panorama.png')==2
    for relative in ['styles.css','app.js','assets/model.mjs','assets/boss-agent-panorama.png','assets/boss-agent-panorama.svg','assets/welfare-evidence.json','assets/career-samples.json','assets/sources.json','assets/boss-agent-cli-MIT.txt','assets/standalone.html']:
        binary=relative.endswith('.png')
        get(project+relative,ROOT/'web'/relative,binary=binary)
    for relative in ['architecture.md','extensions.md','THIRD_PARTY.md','notes.md','references/sources.json','references/model-checks.json','references/panorama-render.json']:
        get(project+relative)
    original=ROOT.parent/'008-boss-agent-cli'
    for relative in ['', 'app.js','styles.css','assets/lab.mjs','assets/evidence.json','assets/core-tests.json','assets/boss-agent-cli-MIT.txt']:
        path='index.html' if not relative else relative
        get('projects/008-boss-agent-cli/'+relative,original/'web'/path)
    for relative in ['capabilities.md','architecture.md','THIRD_PARTY.md','references/replay.json','references/core-tests.json']:
        get('projects/008-boss-agent-cli/'+relative)
    report={'date':'2026-10-20','base_url':base,'project_url':urljoin(base,project),'checks':records,
            'guide_sha256':hashlib.sha256(guide.read_bytes()).hexdigest(),
            'guide_is_original':True,'navigation_uses_original':True,'hero_and_dialog_use_original':True,
            'live_boss_requests':0,'llm_requests':0,'summary':{'http_checks':len(records),'failed':0}}
    target=ROOT/args.output
    target.parent.mkdir(parents=True,exist_ok=True)
    target.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(report['summary'],ensure_ascii=False))


if __name__=='__main__':main()
