"""Bounded live search/detail/HLS checks for HTTP sites discovered in source-scan."""
import concurrent.futures
from datetime import datetime, timezone
import json
from pathlib import Path
import time
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit, urljoin

import requests

ROOT = Path(__file__).resolve().parents[1]


def api_url(base, **params):
    parts = urlsplit(base)
    query = dict(parse_qsl(parts.query))
    query.update(params)
    return urlunsplit(parts._replace(query=urlencode(query)))


def probe(site):
    started = time.monotonic()
    result = dict(site)
    try:
        search_url = api_url(site["api"], ac="detail", wd="西游记")
        response = requests.get(search_url, timeout=(5, 12))
        response.raise_for_status()
        data = response.json()
        items = data.get("list", [])
        result.update(search_url=response.url, search_http=response.status_code,
                      search_count=len(items), cors=response.headers.get("Access-Control-Allow-Origin"))
        result["sample"] = [{"id": x.get("vod_id"), "name": x.get("vod_name"), "type": x.get("type_name")} for x in items[:5]]
        candidates = [x for x in items if x.get("vod_name") in ("西游记", "西游记后传", "西游记1986")]
        chosen = (candidates or items)[0]
        detail_url = api_url(site["api"], ac="detail", ids=chosen["vod_id"])
        detail_response = requests.get(detail_url, timeout=(5, 12))
        detail_response.raise_for_status()
        detail = detail_response.json()["list"][0]
        result.update(detail_url=detail_response.url, detail_http=detail_response.status_code,
                      selected={"id": detail["vod_id"], "name": detail["vod_name"], "type": detail.get("type_name")})
        lines = []
        for label, values in zip(detail.get("vod_play_from", "").split("$$$"), detail.get("vod_play_url", "").split("$$$")):
            episodes = []
            for value in values.split("#"):
                if "$" in value:
                    name, url = value.split("$", 1)
                    episodes.append({"name": name, "url": url})
            if episodes:
                lines.append({"name": label, "episode_count": len(episodes), "first": episodes[0]})
        result["lines"] = lines
        hls = next((line["first"]["url"] for line in lines if ".m3u8" in line["first"]["url"]), None)
        if not hls:
            raise ValueError("No direct HLS episode in the sampled item")
        playlists = []
        current = hls
        for depth in range(3):
            manifest = requests.get(current, timeout=(5, 12))
            manifest.raise_for_status()
            text = manifest.content.decode("utf-8-sig")
            if not text.startswith("#EXTM3U"):
                raise ValueError("Playback URL is not an HLS manifest")
            playlists.append({"url": manifest.url, "http_status": manifest.status_code,
                              "cors": manifest.headers.get("Access-Control-Allow-Origin"), "preview": text[:500]})
            entries = [x.strip() for x in text.splitlines() if x.strip() and not x.startswith("#")]
            if "#EXT-X-STREAM-INF" in text:
                current = urljoin(manifest.url, entries[0])
            else:
                segment_url = urljoin(manifest.url, entries[0])
                with requests.get(segment_url, headers={"Range": "bytes=0-65535"}, stream=True, timeout=(5, 12)) as segment:
                    segment.raise_for_status()
                    chunk = next(segment.iter_content(65536))
                    result["segment"] = {"url": segment.url, "http_status": segment.status_code,
                                         "sample_bytes": len(chunk), "first_16_hex": chunk[:16].hex(),
                                         "content_type": segment.headers.get("Content-Type"),
                                         "cors": segment.headers.get("Access-Control-Allow-Origin")}
                break
        result["playlists"] = playlists
        result["ok"] = True
        result["detail_response"] = detail
    except Exception as error:
        result["error"] = str(error)[:350]
        result["ok"] = False
    result["elapsed_ms"] = round((time.monotonic() - started) * 1000)
    return result


def main():
    scan = json.loads((ROOT / "assets/source-scan.json").read_text(encoding="utf-8"))
    prior = json.loads((ROOT / "assets/api-probes.json").read_text(encoding="utf-8")) if (ROOT / "assets/api-probes.json").exists() else {"results": []}
    tested = {x["api"] for x in prior["results"]}
    selected = []
    seen = set()
    for config in scan["results"]:
        for site in config.get("http_sites", []):
            host = urlsplit(site["api"]).hostname
            if site["type"] == 1 and site["api"] not in tested and host not in seen:
                seen.add(host)
                selected.append(site)
    selected = selected[:14]
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
        results = list(pool.map(probe, selected))
    (ROOT / "assets/api-probes.json").write_text(json.dumps({"checked_at": datetime.now(timezone.utc).isoformat(), "results": prior["results"] + results}, ensure_ascii=False, indent=2), encoding="utf-8")
    for result in results:
        print(json.dumps({k: v for k, v in result.items() if k not in ("detail_response", "playlists")}, ensure_ascii=True), flush=True)


if __name__ == "__main__":
    main()
