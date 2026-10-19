"""Inspect a small, explicit sample from repository-discovered APIs."""
import concurrent.futures
from datetime import datetime, timezone
import json
from pathlib import Path
from urllib.parse import urljoin
import requests
from probe_api import api_url

ROOT = Path(__file__).resolve().parents[1]


def check(candidate):
    result = dict(candidate)
    try:
        current = candidate["url"]
        result["manifests"] = []
        for _ in range(3):
            response = requests.get(current, timeout=(4, 7))
            response.raise_for_status()
            text = response.content.decode("utf-8-sig")
            if not text.startswith("#EXTM3U"):
                raise ValueError("Not an HLS manifest")
            result["manifests"].append({"url": response.url, "status": response.status_code,
                                        "cors": response.headers.get("Access-Control-Allow-Origin"), "text": text})
            entries = [s.strip() for s in text.splitlines() if s.strip() and not s.startswith("#")]
            if "#EXT-X-STREAM-INF" in text:
                current = urljoin(response.url, entries[0])
                continue
            result["encrypted"] = "#EXT-X-KEY" in text
            segment_url = urljoin(response.url, entries[0])
            with requests.get(segment_url, stream=True, timeout=(4, 7)) as segment:
                segment.raise_for_status()
                chunk = next(segment.iter_content(65536))
                if not chunk or chunk.startswith((b"<!DOCTYPE", b"<html")):
                    raise ValueError("Empty or HTML segment")
                result["segment"] = {"url": segment.url, "status": segment.status_code, "sample_bytes": len(chunk),
                                     "hex": chunk[:16].hex(), "content_type": segment.headers.get("Content-Type"),
                                     "cors": segment.headers.get("Access-Control-Allow-Origin")}
            result["ok"] = True
            return result
        raise ValueError("Playlist nesting too deep")
    except Exception as error:
        result["ok"] = False
        result["error"] = str(error)[:240]
        return result


def discover(spec):
    base, keyword = spec
    results = []
    try:
        response = requests.get(api_url(base, ac="detail", **({"wd": keyword} if keyword else {})), timeout=(4, 10))
        response.raise_for_status()
        data = response.json()
        for item in data.get("list", [])[:3]:
            lines = item.get("vod_play_url", "").split("$$$")
            for values in lines:
                for episode in values.split("#")[:1]:
                    if "$" in episode:
                        label, url = episode.split("$", 1)
                        if ".m3u8" in url:
                            results.append({"api": base, "keyword": keyword, "id": item["vod_id"],
                                            "title": item["vod_name"], "episode": label, "url": url})
        return results
    except Exception as error:
        print(json.dumps({"api": base, "keyword": keyword, "error": str(error)[:160]}, ensure_ascii=True), flush=True)
        return []


def main():
    specs = [(base, word) for base in (
        "https://bfzyapi.com/api.php/provide/vod/", "https://cj.lziapi.com/api.php/provide/vod/",
        "https://www.huyaapi.com/api.php/provide/vod/from/hym3u8") for word in ("葫芦兄弟", "大闹天宫", "")]
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
        candidates = [item for batch in pool.map(discover, specs) for item in batch]
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
        results = list(pool.map(check, candidates))
    (ROOT / "assets/playback-samples.json").write_text(json.dumps({"checked_at": datetime.now(timezone.utc).isoformat(), "results": results}, ensure_ascii=False, indent=2), encoding="utf-8")
    for result in results:
        print(json.dumps({k: v for k, v in result.items() if k != "manifests"}, ensure_ascii=True), flush=True)


if __name__ == "__main__":
    main()
