import importlib.util
from pathlib import Path
import unittest
from unittest.mock import patch

SPEC = importlib.util.spec_from_file_location("demo_server", Path(__file__).resolve().parents[1] / "server.py")
server = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(server)


class AdapterTests(unittest.TestCase):
    def test_split_lines_and_ignore_web_players(self):
        item = {"vod_play_from": "web$$$hls", "vod_play_url": "网页$https://example.com/player/1$$$第1集$https://v.fengbao14.com/one.m3u8?token=a$b#第2集$https://v.fengbao14.com/two.mp4"}
        lines = server.playback_lines(item)
        self.assertEqual(len(lines), 1)
        self.assertEqual(lines[0]["name"], "hls")
        self.assertEqual(len(lines[0]["episodes"]), 2)
        self.assertTrue(lines[0]["episodes"][0]["url"].endswith("?token=a$b"))

    def test_playlist_rewrites_relative_segments_and_key(self):
        text = '#EXTM3U\n#EXT-X-KEY:METHOD=AES-128,URI="key.bin"\n#EXTINF:2,\n../part.ts\n'
        result = server.rewrite_playlist(text, "https://v.fengbao14.com/a/index.m3u8")
        self.assertNotIn("../part.ts", result)
        self.assertNotIn('URI="key.bin"', result)
        self.assertEqual(result.count("/media/"), 2)

    def test_untrusted_media_host_rejected(self):
        for url in ("http://127.0.0.1/private", "http://169.254.169.254/latest", "https://unknown.example/a.ts", "file:///etc/passwd"):
            with self.assertRaises(ValueError):
                server.register_media(url)

    def test_loopback_dns_answer_rejected_even_on_allowed_host(self):
        with patch.object(server.socket, "getaddrinfo", return_value=[(2, 1, 6, "", ("127.0.0.1", 443))]):
            with self.assertRaises(ValueError):
                server.public_url("https://bfzyapi.com/")

    def test_known_proxy_dns_mapping_allowed(self):
        with patch.object(server.socket, "getaddrinfo", return_value=[(2, 1, 6, "", ("198.18.2.160", 443))]):
            self.assertEqual(server.public_url("https://bfzyapi.com/"), "https://bfzyapi.com/")

    def test_html_metadata_becomes_plain_text(self):
        item = server.normalize({"vod_id": 1, "vod_name": "<b>片名</b>", "vod_content": "<p>第一行 &amp; 第二行</p>"})
        self.assertEqual(item["title"], "片名")
        self.assertEqual(item["description"], "第一行 & 第二行")


if __name__ == "__main__":
    unittest.main()
