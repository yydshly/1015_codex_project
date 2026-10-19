"""Read public configuration as data; never download or execute Spider plugins."""
import concurrent.futures
import hashlib
import json
from pathlib import Path
import re
import time
from datetime import datetime, timezone
from urllib.parse import urljoin

import requests

ROOT = Path(__file__).resolve().parents[1]
CATALOG = "https://raw.githubusercontent.com/laoma528/awesome-zhuiju-free/main/resources/resources.json"


def parse_config(text):
    text = text.lstrip("\ufeff")
    text = re.sub(r'("(?:\\.|[^"\\])*")|//[^\r\n]*|/\*[\s\S]*?\*/',
                  lambda m: m.group(1) or "", text)
    text = re.sub(r",\s*([}\]])", r"\1", text)
    return json.loads(text)


def inspect(resource):
    started = time.monotonic()
    result = {"name": resource["name"], "config_url": resource["url"]}
    try:
        response = requests.get(resource["url"], timeout=(6, 12), headers={"User-Agent": "Mozilla/5.0"})
        result.update(http_status=response.status_code, final_url=response.url)
        response.raise_for_status()
        content = response.content
        if len(content) > 2_000_000:
            raise ValueError("Configuration larger than 2 MB")
        data = parse_config(content.decode("utf-8-sig"))
        result["sha256"] = hashlib.sha256(content).hexdigest()
        result["site_count"] = len(data.get("sites", []))
        result["types"] = {}
        for site in data.get("sites", []):
            key = str(site.get("type", 0))
            result["types"][key] = result["types"].get(key, 0) + 1
        result["http_sites"] = [
            {"name": s.get("name"), "key": s.get("key"), "type": s.get("type", 0),
             "api": urljoin(response.url, s.get("api", "")), "ext": s.get("ext"),
             "config_url": resource["url"], "config_name": resource["name"]}
            for s in data.get("sites", [])
            if s.get("type", 0) in (0, 1, 4) and str(s.get("api", "")).startswith(("http://", "https://"))
        ]
        result["depots"] = data.get("urls", [])
    except Exception as error:
        result["error"] = str(error)[:240]
    result["elapsed_ms"] = round((time.monotonic() - started) * 1000)
    return result


def main():
    response = requests.get(CATALOG, timeout=20)
    response.raise_for_status()
    catalog = response.json()
    configs = [r for r in catalog["resources"] if r["category"] == "tvbox_config" and r["id"] != "xiao-he-zi"]
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
        results = list(pool.map(inspect, configs))
    depots = []
    seen = {c["url"] for c in configs}
    for result in results:
        for depot in result.get("depots", [])[:2]:
            url = urljoin(result.get("final_url", result["config_url"]), depot.get("url", ""))
            if url.startswith(("http://", "https://")) and url not in seen:
                seen.add(url)
                depots.append({"name": depot.get("name", "depot"), "url": url})
    if depots:
        with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
            results.extend(pool.map(inspect, depots[:8]))
    report = {"checked_at": datetime.now(timezone.utc).isoformat(), "catalog_url": CATALOG,
              "catalog_sha256": hashlib.sha256(response.content).hexdigest(), "results": results}
    (ROOT / "assets" / "source-scan.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    for result in results:
        print(json.dumps({k: v for k, v in result.items() if k not in ("depots",)}, ensure_ascii=True), flush=True)


if __name__ == "__main__":
    main()
