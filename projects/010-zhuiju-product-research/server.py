"""Serve the research page and the existing 007 player on one loopback origin."""

import argparse
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import importlib.util
from pathlib import Path
from urllib.parse import unquote, urlsplit


ROOT = Path(__file__).resolve().parent
WEB = ROOT / "web"
DEMO_ROOT = ROOT.parent / "007-zhuiju-source-demo"
RESEARCH_PATH = "/projects/010-zhuiju-product-research/"
PLAYER_PATH = "/live-demo/"

SPEC = importlib.util.spec_from_file_location("zhuiju_existing_demo", DEMO_ROOT / "server.py")
demo = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(demo)


class Handler(demo.Handler):
    def __init__(self, *args, **kwargs):
        SimpleHTTPRequestHandler.__init__(self, *args, directory=str(WEB), **kwargs)

    def list_directory(self, path):
        self.send_error(404)
        return None

    def do_GET(self):
        if not self.valid_origin() or self.headers.get("Sec-Fetch-Site") == "cross-site":
            self.reply(403, {"error": "联合演示仅允许本机同源访问"})
            return
        parts = urlsplit(self.path)
        if parts.path == "/api/research-demo":
            self.reply(200, {"application": "zhuiju-research-with-007", "version": 1,
                             "player_path": PLAYER_PATH, "research_path": RESEARCH_PATH,
                             "source": demo.SOURCE["name"]})
        elif parts.path.startswith(("/api/", "/media/")):
            demo.Handler.do_GET(self)
        elif parts.path.startswith(PLAYER_PATH):
            self.path = parts.path[len(PLAYER_PATH) - 1:] + (("?" + parts.query) if parts.query else "")
            self.directory = str(demo.WEB)
            demo.Handler.do_GET(self)
        elif parts.path in ("/", RESEARCH_PATH[:-1]):
            self.send_response(302)
            self.send_header("Location", RESEARCH_PATH)
            self.send_header("Content-Length", "0")
            self.end_headers()
        elif parts.path.startswith(RESEARCH_PATH):
            relative = unquote(parts.path[len(RESEARCH_PATH):])
            target = (WEB / relative).resolve()
            if not target.is_relative_to(WEB.resolve()):
                self.send_error(403)
                return
            self.path = "/" + relative
            SimpleHTTPRequestHandler.do_GET(self)
        else:
            self.send_error(404)

    def do_HEAD(self):
        # The integration advertises GET routes only; avoid a second routing path.
        self.send_response(405)
        self.send_header("Allow", "GET")
        self.send_header("Content-Length", "0")
        self.end_headers()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--port", type=int, default=8871)
    args = parser.parse_args()
    server = ThreadingHTTPServer(("127.0.0.1", args.port), Handler)
    print(f"研究与演示：http://127.0.0.1:{args.port}{RESEARCH_PATH}#live-demo", flush=True)
    print(f"独立播放器：http://127.0.0.1:{args.port}{PLAYER_PATH}", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
