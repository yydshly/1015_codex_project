"""Execute the isolated business source before/after the retained threshold diff."""
import argparse
import json
from pathlib import Path
import subprocess

parser = argparse.ArgumentParser()
parser.add_argument("--node", required=True)
parser.add_argument("--lab", required=True)
args = parser.parse_args()
project = Path(__file__).resolve().parents[1]
fixture = Path(args.lab).resolve() / "checkout-lab"
shipping = fixture / "services/shipping.ts"
original = shipping.read_bytes()
assert b"subtotal >= 10000" in original
assert not subprocess.run(["git", "diff", "--name-only"], cwd=fixture, capture_output=True, text=True, check=True).stdout.strip()
program = '''import { estimateOrder } from "./services/estimate.ts";
const scenarios = [
  {id:"local-60",label:"本地 · 商品 60 元",subtotal:6000,region:"local"},
  {id:"local-100",label:"本地 · 商品 100 元",subtotal:10000,region:"local"},
  {id:"local-110",label:"本地 · 商品 110 元",subtotal:11000,region:"local"},
  {id:"local-120",label:"本地 · 商品 120 元",subtotal:12000,region:"local"},
  {id:"remote-110",label:"远程 · 商品 110 元",subtotal:11000,region:"remote"},
];
console.log(JSON.stringify(scenarios.map(s=>({...s,quote:estimateOrder({customer:{id:"probe",region:s.region},items:[{sku:"DESK",quantity:1,unitPrice:s.subtotal,weight:3}],coupon:"SAVE10"})})),null,2));'''


def execute(name):
    result = subprocess.run([args.node, "--experimental-strip-types", "--input-type=module", "-e", program], cwd=fixture, capture_output=True, text=True, encoding="utf-8", check=True)
    value = json.loads(result.stdout)
    (project / f"references/atlas-business-{name}.json").write_text(json.dumps(value, ensure_ascii=False, indent=2), encoding="utf-8")
    return value


try:
    before = execute("before")
    shipping.write_bytes(original.replace(b"subtotal >= 10000", b"subtotal >= 12000"))
    after = execute("after")
finally:
    shipping.write_bytes(original)
cases = [dict(id=a["id"], label=a["label"], input={"subtotal":a["subtotal"], "region":a["region"], "weight":3,"coupon":"SAVE10"}, before=a["quote"], after=b["quote"]) for a,b in zip(before,after)]
assert cases[2]["before"]["shipping"] == 0 and cases[2]["after"]["shipping"] == 900
data = {"status":"verified", "method":"Executed original fixture via Node24 before/after one threshold edit; no GitNexus prediction or LLM", "fixtureRestored":True, "cases":cases}
(project / "web/assets/business-probes.json").write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
print("5 real business probes before/after; 110-yuan local cart shipping changes from 0 to 9 yuan; fixture restored")
