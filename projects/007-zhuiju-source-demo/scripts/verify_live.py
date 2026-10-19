"""Verify the running application and two real episodes without saving video files."""
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
from urllib.parse import urljoin, urlsplit

import requests

ROOT = Path(__file__).resolve().parents[1]
BASE = "http://127.0.0.1:8767"


def main():
    checks = []
    def get(path, **params):
        response = requests.get(BASE + path, params=params, timeout=30)
        response.raise_for_status()
        return response.json()
    source = get("/api/status")["source"]
    fixture = source["fixture"]
    search = get("/api/search", q=fixture["query"])
    assert any(item["id"] == fixture["id"] for item in search["items"])
    checks.append({"name": "search", "ok": True, "query": fixture["query"], "count": len(search["items"]), "upstream": source["api"]})
    detail = get("/api/detail", id=fixture["id"])
    assert len(detail["lines"][0]["episodes"]) == fixture["episode_count"]
    checks.append({"name": "detail", "ok": True, "id": fixture["id"], "title": detail["title"], "episodes": fixture["episode_count"]})
    for episode in (0, 1):
        info = get("/api/play", id=fixture["id"], episode=episode)
        assert info["format"] == "hls" and urlsplit(info["url"]).hostname in source["allowed_hosts"]
        response = requests.get(info["url"], timeout=20)
        response.raise_for_status()
        assert response.text.startswith("#EXTM3U")
        urls = [urljoin(response.url, x.strip()) for x in response.text.splitlines() if x.strip() and not x.startswith("#")]
        samples = []
        for index in (0, min(12, len(urls)-1)):
            with requests.get(urls[index], stream=True, timeout=20) as segment:
                segment.raise_for_status()
                chunk = next(segment.iter_content(65536))
                assert chunk and chunk[0] == 0x47, "Expected MPEG-TS sync byte"
                samples.append({"index": index, "status": segment.status_code, "bytes": len(chunk), "sha256_sample": hashlib.sha256(chunk).hexdigest(), "cors": segment.headers.get("Access-Control-Allow-Origin")})
        checks.append({"name": "playback", "ok": True, "episode": info["episode"], "manifest": info["url"], "manifest_http": response.status_code,
                       "manifest_cors": response.headers.get("Access-Control-Allow-Origin"), "segment_count": len(urls), "samples": samples})
    for path, expected in (("/api/search?q=", 400), ("/api/detail?id=invalid", 400), ("/api/play?id=168380&episode=-1", 400), ("/media/unknown/resource", 404)):
        response = requests.get(BASE + path, timeout=10)
        assert response.status_code == expected
        checks.append({"name": "input-boundary", "path": path, "status": response.status_code, "ok": True})
    response = requests.get(BASE + "/api/status", headers={"Origin": "https://unrelated.example"}, timeout=10)
    assert response.status_code == 403
    checks.append({"name": "cross-origin-block", "status": 403, "ok": True})
    (ROOT / "assets/verification-search.json").write_text(json.dumps(search, ensure_ascii=False, indent=2), encoding="utf-8")
    (ROOT / "assets/verification-detail.json").write_text(json.dumps(detail, ensure_ascii=False, indent=2), encoding="utf-8")
    report = {"verified_at": datetime.now(timezone.utc).isoformat(), "base_url": BASE, "source": source, "checks": checks,
              "scope": "Live search/detail plus HLS and two segment samples per episode; browser decoding is recorded separately."}
    (ROOT / "assets/live-verification.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({"passed": len(checks), "source": source["name"], "movie_id": fixture["id"], "episodes": fixture["episode_count"]}, ensure_ascii=True))


if __name__ == "__main__":
    main()
