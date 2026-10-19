"""Exercise the built research page, its user interactions and real resource requests."""
import argparse
from datetime import datetime, timezone
from html.parser import HTMLParser
import json
from pathlib import Path
from urllib.parse import urljoin, urlsplit
from urllib.request import urlopen

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]

class Resources(HTMLParser):
    def __init__(self):
        super().__init__()
        self.urls = set()
    def handle_starttag(self, tag, attrs):
        for key, value in attrs:
            if key in ("src", "href") and value and not value.startswith(("https:", "http:", "#", "mailto:", "data:")):
                self.urls.add(value)

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--url", default="http://127.0.0.1:8872/projects/011-octop/")
    args = parser.parse_args()
    report = {"checked_at": datetime.now(timezone.utc).isoformat(), "url": args.url,
              "scope": "Research website only; no real Octop/model/connector execution.",
              "checks": [], "resources": [], "viewports": [], "console_errors": [], "request_failures": []}
    def check(name, passed, detail=None):
        report["checks"].append({"name": name, "passed": bool(passed), "detail": detail})
        if not passed:
            raise AssertionError(name + ": " + str(detail))
    screenshots = ROOT / "assets"
    screenshots.mkdir(exist_ok=True)
    with urlopen(args.url, timeout=10) as response:
        html = response.read().decode("utf-8")
        check("Built page HTTP response", response.status == 200)
    resource_parser = Resources()
    resource_parser.feed(html)
    for path in sorted(resource_parser.urls):
        with urlopen(urljoin(args.url, path), timeout=10) as response:
            payload = response.read()
            report["resources"].append({"path": path, "status": response.status, "bytes": len(payload)})
            check("Resource: " + path, response.status == 200 and bool(payload))
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1440, "height": 1000}, device_scale_factor=1, reduced_motion="reduce")
        page.on("pageerror", lambda error: report["console_errors"].append(str(error)))
        page.on("requestfailed", lambda request: report["request_failures"].append({"url": request.url, "failure": request.failure}))
        page.goto(args.url, wait_until="networkidle")
        page.locator(".cap-card").first.wait_for()
        check("Chinese research title and rendered capabilities", "Octop" in page.title() and page.locator(".cap-card").count() == 8)
        check("Six clear summary answers and full overview image", page.locator(".research-summary dt").count() == 6 and "群聊只是" in page.locator(".research-summary").inner_text() and page.locator(".overview-poster img").get_attribute("height") == "6786")
        check("Grok chat and Bot are distinguished", "两种形态" in page.locator(".product-scope").inner_text() and page.locator('.product-scope a[href="https://x.ai/grok"]').count() == 1)
        page.screenshot(path=str(screenshots / "preview-desktop.png"))
        for kind, count in [("implemented", 6), ("beta", 1), ("planned", 1), ("all", 8)]:
            page.locator(f'[data-cap-filter="{kind}"]').click()
            check("Capability status filter: " + kind, page.locator(".cap-card").count() == count)
        for scenario in ["report", "research", "coding"]:
            page.locator("#scenarioSelect").select_option(scenario)
            for stage in range(7):
                page.locator(f'[data-step="{stage}"]').click()
                check(f"Scenario {scenario} stage {stage + 1}", page.locator("#stepCounter").inner_text().startswith(f"{stage + 1:02d}") and bool(page.locator("#flowDetail").inner_text().strip()))
            check("End boundary: " + scenario, page.locator("#nextStep").is_disabled())
        page.locator('[data-step="0"]').click()
        check("First step boundary", page.locator("#prevStep").is_disabled())
        page.locator("#nextStep").click()
        page.locator("#prevStep").click()
        check("Previous / next navigation", page.locator("#stepCounter").inner_text() == "01 / 07")
        page.locator("#hostSelect").select_option("server")
        page.locator("#modelSelect").select_option("local")
        check("Host and model location are independent", "同机 Ollama" in page.locator("#environmentResult").inner_text() and "部署主机继续运行" in page.locator("#environmentResult").inner_text())
        page.locator("#hostSelect").select_option("personal")
        page.locator("#modelSelect").select_option("cloud")
        check("Personal shutdown and cloud data explanation", "服务随之停止" in page.locator("#environmentResult").inner_text() and "相关请求上下文会离开主机" in page.locator("#environmentResult").inner_text())
        check("Four product comparison", page.locator(".comparison-table thead th").count() == 5 and page.locator("#comparisonRows tr").count() == 7)
        decision_texts = []
        for persona in ["personal", "team", "builder"]:
            page.locator(f'[data-persona="{persona}"]').click()
            decision_texts.append(page.locator("#decisionPanel h3").inner_text())
        check("Three distinct user goals", len(set(decision_texts)) == 3)
        for index in range(6):
            summary = page.locator(".question summary").nth(index)
            opened = summary.locator("..").get_attribute("open") is not None
            summary.click()
            check(f"Thought accordion {index + 1}", (summary.locator("..").get_attribute("open") is not None) != opened)
        for extension in ["model", "channel", "mcp", "skills", "acp", "reliability"]:
            page.locator(f'[data-extension="{extension}"]').click()
            check("Extension path: " + extension, page.locator("#extensionPanel").get_attribute("aria-labelledby") == "tab-" + extension and page.locator("#extensionPanel li").count() == 3)
        page.locator("#tab-model").focus()
        page.keyboard.press("ArrowDown")
        check("Extension keyboard navigation", page.locator("#tab-channel").get_attribute("aria-selected") == "true")
        page.keyboard.press("End")
        check("Extension keyboard End", page.locator("#tab-reliability").get_attribute("aria-selected") == "true")
        for kind, count in [("源码", 5), ("上游文档", 5), ("官方产品文档", 8), ("all", 18)]:
            page.locator(f'[data-source-filter="{kind}"]').click()
            check("Source filter: " + kind, page.locator(".source-card").count() == count)
        page.locator("#sourceSearch").fill("no-such-source-011")
        check("Source search empty state", page.locator(".source-card").count() == 0 and page.locator(".source-empty").is_visible())
        page.locator("#sourceSearch").fill("ACP")
        check("Source search matches content", page.locator(".source-card").count() == 1)
        page.locator("#sourceSearch").fill("")
        page.locator("#researchScenarioLink").click()
        check("First project links to research scenario", page.locator("#scenarioSelect").input_value() == "research" and "重要更新" in page.locator("#scenarioRequest").inner_text())
        check("All internal anchors resolve", page.evaluate("Array.from(document.querySelectorAll('a[href^=\"#\"]')).every(a => document.getElementById(a.getAttribute('href').slice(1)))"))
        check("Unique element IDs", page.evaluate("(()=>{const ids=Array.from(document.querySelectorAll('[id]'),e=>e.id);return ids.length===new Set(ids).size})()"))
        check("Reference links are pinned or official", page.evaluate("Array.from(document.querySelectorAll('.source-card')).every(a=>a.href.includes('/blob/dd9dce470844c25d59effb50615bb3c667ea25cd/')||['learn.chatgpt.com','docs.x.ai','x.ai'].includes(new URL(a.href).hostname))"))
        page.set_viewport_size({"width":1440,"height":1000})
        page.locator("#principle").scroll_into_view_if_needed()
        page.screenshot(path=str(screenshots / "preview-principle.png"))
        for section in ["overview", "comparison", "extensions", "evidence"]:
            page.locator("#" + section).scroll_into_view_if_needed()
            page.screenshot(path=str(screenshots / ("preview-" + section + ".png")))
        for width in [1440, 1024, 768, 390, 320]:
            page.set_viewport_size({"width":width,"height":900})
            page.evaluate("window.scrollTo(0, 0)")
            dimensions = page.evaluate("({viewport:innerWidth, document:document.documentElement.scrollWidth})")
            report["viewports"].append(dimensions)
            check(f"No page overflow at {width}px", dimensions["document"] <= width, dimensions)
            if width == 390:
                page.screenshot(path=str(screenshots / "preview-mobile.png"))
                page.locator("#principle").scroll_into_view_if_needed()
                page.locator("#scenarioSelect").select_option("coding")
                page.locator("#nextStep").click()
                check("Mobile scenario controls", page.locator("#stepCounter").inner_text() == "02 / 07")
                page.screenshot(path=str(screenshots / "preview-mobile-principle.png"))
        check("No JavaScript errors", not report["console_errors"], report["console_errors"])
        check("No failed browser requests", not report["request_failures"], report["request_failures"])
        offline = browser.new_page(viewport={"width":1280,"height":900}, reduced_motion="reduce")
        offline.goto((ROOT / "web/index.html").as_uri(), wait_until="load")
        offline.locator(".cap-card").first.wait_for()
        offline.locator('[data-extension="acp"]').click()
        check("Direct file opening without HTTP or network data fetch", offline.locator(".cap-card").count() == 8 and offline.locator(".source-card").count() == 18 and offline.locator("#tab-acp").get_attribute("aria-selected") == "true")
        browser.close()
    report["passed"] = all(item["passed"] for item in report["checks"])
    target = ROOT / "references/web-verification.json"
    target.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"passed": report["passed"], "checks": len(report["checks"]), "resources":len(report["resources"]), "viewports":report["viewports"]}))

if __name__ == "__main__":
    main()
