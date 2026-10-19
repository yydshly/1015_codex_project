"""Loopback-only live catalog adapter and bounded HLS relay for the demo."""
import argparse
from collections import OrderedDict
from datetime import datetime, timezone
import hashlib
import html
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import ipaddress
import json
from pathlib import Path
import re
import secrets
import socket
import threading
import time
from urllib.parse import parse_qs, parse_qsl, urlencode, urljoin, urlsplit, urlunsplit

import requests

ROOT = Path(__file__).resolve().parent
WEB = ROOT / "web"
SOURCE = json.loads((ROOT / "source.json").read_text(encoding="utf-8"))
TOKENS = OrderedDict()
CACHE = {}
DETAIL_CACHE = {}
LOCK = threading.RLock()
SECRET = secrets.token_bytes(32)
MEDIA_SLOTS = threading.BoundedSemaphore(10)


def public_url(url):
    parts = urlsplit(url)
    if parts.scheme not in ("http", "https") or not parts.hostname or parts.username or parts.password:
        raise ValueError("媒体地址格式无效")
    if parts.port not in (None, 80, 443):
        raise ValueError("此 Demo 仅接入标准 HTTP/HTTPS 端口")
    if parts.hostname.lower() not in SOURCE["allowed_hosts"]:
        raise ValueError("此媒体域名尚未通过验证，请先登记来源再接入")
    addresses = socket.getaddrinfo(parts.hostname, parts.port or (443 if parts.scheme == "https" else 80), type=socket.SOCK_STREAM)
    # The user's DNS proxy uses benchmark networks for public-domain routing.
    # Permit these synthetic answers only for the exact audited host allowlist.
    synthetic = (ipaddress.ip_network("198.18.0.0/15"), ipaddress.ip_network("2001:2::/48"))
    def acceptable(address):
        ip = ipaddress.ip_address(address)
        return ip.is_global or any(ip.version == network.version and ip in network for network in synthetic)
    if not addresses or any(not acceptable(item[4][0]) for item in addresses):
        raise ValueError("上游地址必须指向公网，不能访问本机或内网")
    return url


def remote_get(url, **kwargs):
    """Check every redirect; TLS verification stays enabled."""
    headers = {"User-Agent": "ZhuijuSourceDemo/1.0", "Accept-Encoding": "identity"}
    headers.update(kwargs.pop("headers", {}))
    for _ in range(6):
        public_url(url)
        response = requests.get(url, headers=headers, allow_redirects=False, timeout=(6, 18), **kwargs)
        if response.is_redirect:
            location = response.headers.get("Location")
            response.close()
            if not location:
                raise ValueError("上游返回了无效跳转")
            url = urljoin(url, location)
            continue
        response.raise_for_status()
        return response
    raise ValueError("上游跳转次数过多")


def api_url(**params):
    parts = urlsplit(SOURCE["api"])
    query = dict(parse_qsl(parts.query))
    query.update(params)
    return urlunsplit(parts._replace(query=urlencode(query)))


def api_get(**params):
    url = api_url(**params)
    with LOCK:
        cached = CACHE.get(url)
        if cached and time.monotonic() - cached[0] < 45:
            return cached[1]
    with remote_get(url, stream=True) as response:
        chunks, size = [], 0
        for chunk in response.iter_content(65536):
            size += len(chunk)
            if size > 4_000_000:
                raise ValueError("上游响应过大")
            chunks.append(chunk)
        data = json.loads(b"".join(chunks).decode("utf-8-sig"))
    if not isinstance(data, dict) or not isinstance(data.get("list"), list):
        raise ValueError("上游没有返回有效的影片列表")
    with LOCK:
        if len(CACHE) > 128:
            CACHE.clear()
        CACHE[url] = (time.monotonic(), data)
        # ac=detail searches already contain complete item data. Reuse these live
        # records so choosing an episode does not depend on redundant API calls.
        for item in data["list"]:
            if isinstance(item, dict) and "vod_id" in item and "vod_play_url" in item:
                DETAIL_CACHE[str(item["vod_id"])] = (time.monotonic(), item)
        if len(DETAIL_CACHE) > 400:
            cutoff = time.monotonic() - 300
            for key in list(DETAIL_CACHE):
                if DETAIL_CACHE[key][0] < cutoff:
                    del DETAIL_CACHE[key]
    return data


def plain(value):
    return html.unescape(re.sub(r"<[^>]*>", "", str(value or ""))).strip()


def normalize(item):
    return {"id": str(item["vod_id"]), "title": plain(item.get("vod_name")),
            "poster": item.get("vod_pic", ""), "type": plain(item.get("type_name")),
            "year": plain(item.get("vod_year")), "area": plain(item.get("vod_area")),
            "remarks": plain(item.get("vod_remarks")), "description": plain(item.get("vod_content"))[:2400],
            "actors": plain(item.get("vod_actor"))[:300]}


def playback_lines(item):
    names = str(item.get("vod_play_from", "")).split("$$$")
    groups = str(item.get("vod_play_url", "")).split("$$$")
    lines = []
    for index, group in enumerate(groups):
        episodes = []
        for entry in group.split("#"):
            if "$" not in entry:
                continue
            name, url = entry.split("$", 1)
            path = urlsplit(url).path.lower()
            if url.startswith(("https://", "http://")) and path.endswith((".m3u8", ".mp4")):
                episodes.append({"name": plain(name), "url": url})
        if episodes:
            lines.append({"name": names[index] if index < len(names) else f"线路 {index + 1}", "episodes": episodes})
    return lines


def get_detail(movie_id):
    if not re.fullmatch(r"[0-9]{1,12}", movie_id):
        raise ValueError("影片 ID 无效")
    with LOCK:
        cached = DETAIL_CACHE.get(movie_id)
        if cached and time.monotonic() - cached[0] < 300:
            return cached[1]
    data = api_get(ac="detail", ids=movie_id)
    item = next((x for x in data["list"] if str(x.get("vod_id")) == movie_id), None)
    if item is None:
        raise LookupError("没有找到这部影片")
    return item


def register_media(url):
    parts = urlsplit(url)
    if parts.scheme not in ("http", "https") or not parts.hostname or parts.username or parts.password:
        raise ValueError("无效的媒体依赖地址")
    if parts.hostname.lower() not in SOURCE["allowed_hosts"]:
        raise ValueError("此媒体域名尚未通过验证，请先登记来源再接入")
    token = hashlib.sha256(SECRET + url.encode()).hexdigest()[:32]
    with LOCK:
        TOKENS[token] = url
        TOKENS.move_to_end(token)
        while len(TOKENS) > 6000:
            TOKENS.popitem(last=False)
    suffix = "/index.m3u8" if parts.path.lower().endswith(".m3u8") else "/resource"
    return f"/media/{token}{suffix}"


def rewrite_playlist(text, base):
    output = []
    for line in text.splitlines():
        if line.startswith("#"):
            line = re.sub(r'URI="([^"]+)"', lambda m: f'URI="{register_media(urljoin(base, m.group(1)))}"', line)
        elif line.strip():
            line = register_media(urljoin(base, line.strip()))
        output.append(line)
    return "\n".join(output) + "\n"


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(WEB), **kwargs)

    def reply(self, status, value):
        body = json.dumps(value, ensure_ascii=False).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.end_headers()
        self.wfile.write(body)

    def valid_origin(self):
        host = self.headers.get("Host", "").split(":")[0]
        origin = self.headers.get("Origin")
        return host in ("127.0.0.1", "localhost") and (not origin or origin == f"http://{self.headers.get('Host')}")

    def do_GET(self):
        if not self.valid_origin() or self.headers.get("Sec-Fetch-Site") == "cross-site":
            self.reply(403, {"error": "Demo 仅允许本机同源访问"})
            return
        parts = urlsplit(self.path)
        params = parse_qs(parts.query)
        one = lambda key, default="": params.get(key, [default])[0]
        try:
            if parts.path == "/api/status":
                self.reply(200, {"source": SOURCE, "time": datetime.now(timezone.utc).isoformat(), "mode": "live"})
            elif parts.path == "/api/search":
                keyword = one("q").strip()
                if not keyword or len(keyword) > 80:
                    raise ValueError("请输入 1–80 个字符的片名")
                page = one("page", "1")
                if not page.isdigit() or not 1 <= int(page) <= 200:
                    raise ValueError("页码无效")
                started = time.monotonic()
                data = api_get(ac="detail", wd=keyword, pg=page)
                self.reply(200, {"items": [normalize(x) for x in data["list"]], "page": int(data.get("page", page)),
                                 "pages": int(data.get("pagecount", 1)), "total": int(data.get("total", len(data["list"]))),
                                 "elapsed_ms": round((time.monotonic() - started) * 1000), "source": SOURCE["name"]})
            elif parts.path == "/api/detail":
                item = get_detail(one("id"))
                lines = playback_lines(item)
                result = normalize(item)
                result["lines"] = [{"name": line["name"], "episodes": [{"name": ep["name"]} for ep in line["episodes"]]} for line in lines]
                self.reply(200, result)
            elif parts.path == "/api/play":
                item = get_detail(one("id"))
                line_no, episode_no = int(one("line", "0")), int(one("episode", "0"))
                lines = playback_lines(item)
                if line_no < 0 or episode_no < 0 or line_no >= len(lines) or episode_no >= len(lines[line_no]["episodes"]):
                    raise ValueError("线路或集数无效")
                episode = lines[line_no]["episodes"][episode_no]
                relay_url = register_media(episode["url"])
                self.reply(200, {"url": episode["url"], "relay_url": relay_url, "upstream_url": episode["url"],
                                 "format": "hls" if urlsplit(episode["url"]).path.endswith(".m3u8") else "mp4",
                                 "title": plain(item["vod_name"]), "episode": episode["name"], "line": lines[line_no]["name"]})
            elif parts.path.startswith("/media/"):
                self.media(parts.path)
            elif parts.path.startswith("/api/"):
                self.reply(404, {"error": "接口不存在"})
            elif parts.path in ("/", "/index.html", "/demo.html", "/app.js", "/styles.css", "/favicon.svg", "/vendor/hls.min.js"):
                if parts.path in ("/", "/index.html"):
                    self.path = "/demo.html"
                super().do_GET()
            else:
                self.send_error(404)
        except (ValueError, IndexError) as error:
            self.reply(400, {"error": str(error)})
        except LookupError as error:
            self.reply(404, {"error": str(error)})
        except (requests.RequestException, OSError) as error:
            self.log_error("upstream: %s", str(error)[:350])
            self.reply(502, {"error": "上游请求失败，请稍后重试或更换影片", "detail": str(error)[:220]})

    def media(self, path):
        token = path.split("/")[2]
        with LOCK:
            url = TOKENS.get(token)
        if not url:
            self.reply(404, {"error": "播放会话已过期，请重新选择集数"})
            return
        if not MEDIA_SLOTS.acquire(timeout=2):
            self.reply(503, {"error": "同时加载的媒体请求过多"})
            return
        sent = False
        try:
            headers = {}
            requested_range = self.headers.get("Range", "")
            if re.fullmatch(r"bytes=\d*-\d*", requested_range):
                headers["Range"] = requested_range
            with remote_get(url, headers=headers, stream=True) as response:
                is_playlist = urlsplit(response.url).path.endswith(".m3u8") or "mpegurl" in response.headers.get("Content-Type", "").lower()
                if is_playlist:
                    body = b""
                    for chunk in response.iter_content(65536):
                        body += chunk
                        if len(body) > 2_000_000:
                            raise ValueError("播放清单过大")
                    text = body.decode("utf-8-sig")
                    if not text.startswith("#EXTM3U"):
                        raise ValueError("上游没有返回有效播放清单")
                    body = rewrite_playlist(text, response.url).encode()
                    sent = True
                    self.send_response(200)
                    self.send_header("Content-Type", "application/vnd.apple.mpegurl")
                    self.send_header("Content-Length", str(len(body)))
                    self.send_header("Cache-Control", "no-store")
                    self.end_headers()
                    self.wfile.write(body)
                else:
                    sent = True
                    self.send_response(response.status_code)
                    self.send_header("Content-Type", response.headers.get("Content-Type", "application/octet-stream"))
                    for name in ("Content-Range", "Accept-Ranges"):
                        if response.headers.get(name):
                            self.send_header(name, response.headers[name])
                    if response.headers.get("Content-Length") and not response.headers.get("Content-Encoding"):
                        self.send_header("Content-Length", response.headers["Content-Length"])
                    self.send_header("Cache-Control", "private, max-age=120")
                    self.end_headers()
                    for chunk in response.iter_content(65536):
                        self.wfile.write(chunk)
        except (BrokenPipeError, ConnectionResetError, ConnectionAbortedError):
            pass
        except (requests.RequestException, OSError, ValueError) as error:
            self.log_error("media relay: %s", str(error)[:220])
            if sent:
                self.close_connection = True
            else:
                self.reply(502, {"error": "媒体上游暂时不可用，请重试", "detail": str(error)[:180]})
        finally:
            MEDIA_SLOTS.release()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, default=8767)
    args = parser.parse_args()
    server = ThreadingHTTPServer(("127.0.0.1", args.port), Handler)
    print(f"映片 Demo: http://127.0.0.1:{args.port}/ | live source: {SOURCE['name']}", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
