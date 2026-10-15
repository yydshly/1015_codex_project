"""Check catalog behavior in disposable copies, without adding sample projects."""

import argparse
import copy
import importlib.util
import json
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest


REPOSITORY = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("catalog_tool", REPOSITORY / "scripts" / "projects.py")
catalog_tool = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(catalog_tool)


class CatalogTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="research-catalog-")
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        (self.root / "projects").mkdir()
        shutil.copytree(REPOSITORY / "templates", self.root / "templates")
        catalog_tool.write_text(self.root / "projects.json", '{"schema_version": 1, "projects": []}\n')
        catalog_tool.write_text(
            self.root / "README.md",
            f"自定义导读\n\n{catalog_tool.START}\n{catalog_tool.END}\n\n保留的正文\n",
        )

    def create(self, slug="example", **changes):
        args = dict(slug=slug, name="示例", repo="https://github.com/owner/example", summary="研究价值", tag=["Web"])
        args.update(changes)
        return catalog_tool.create_project(self.root, argparse.Namespace(**args))

    def test_empty_catalog_sync_is_idempotent(self):
        catalog = catalog_tool.load_catalog(self.root)
        catalog_tool.sync(self.root, catalog)
        first = (self.root / "README.md").read_text(encoding="utf-8")
        catalog_tool.sync(self.root, catalog)
        self.assertEqual(first, (self.root / "README.md").read_text(encoding="utf-8"))
        self.assertIn("暂无已收录项目", first)

    def test_new_creates_files_images_and_links(self):
        self.assertEqual(self.create(), "001-example")
        catalog = catalog_tool.load_catalog(self.root)
        catalog_tool.validate_files(self.root, catalog)
        readme = (self.root / "README.md").read_text(encoding="utf-8")
        self.assertIn("projects/001-example/README.md", readme)
        self.assertIn("projects/001-example/assets/cover.svg", readme)
        self.assertIn("| 编号 | 项目 | 源库 | 摘要 | 状态 | 入口 |", readme)
        self.assertIn("[example](https://github.com/owner/example)", readme)
        self.assertNotIn("[上游]", readme)
        self.assertTrue(readme.startswith("自定义导读\n"))
        self.assertTrue(readme.endswith("保留的正文\n"))
        for path in (self.root / "projects" / "001-example").rglob("*.md"):
            self.assertNotIn("{{", path.read_text(encoding="utf-8"))

    def test_numbers_keep_gaps_and_render_in_numeric_order(self):
        self.create()
        self.create("second")
        catalog = catalog_tool.load_catalog(self.root)
        old = self.root / "projects" / "002-second"
        target = self.root / "projects" / "007-second"
        self.assertTrue(old.resolve().is_relative_to(self.root.resolve()))
        self.assertTrue(target.resolve().is_relative_to(self.root.resolve()))
        old.rename(target)
        catalog["projects"][1]["id"] = 7
        catalog["projects"].reverse()
        catalog_tool.write_text(self.root / "projects.json", json.dumps(catalog))
        self.assertEqual(self.create("third"), "008-third")
        rendered = catalog_tool.render_index(catalog_tool.load_catalog(self.root))
        self.assertLess(rendered.index("| 001 |"), rendered.index("| 007 |"))
        self.assertLess(rendered.index("| 007 |"), rendered.index("| 008 |"))

    def test_rejects_invalid_metadata_before_creating_directory(self):
        for changes in ({"slug": "../escape"}, {"name": "bad\nname"}, {"repo": "http://github.com/o/r"}):
            with self.subTest(changes=changes), self.assertRaises(catalog_tool.CatalogError):
                self.create(**changes)
        self.assertEqual(list((self.root / "projects").iterdir()), [])
        self.assertEqual(catalog_tool.load_catalog(self.root)["projects"], [])

    def test_duplicate_slug_and_id_are_rejected(self):
        self.create()
        with self.assertRaises(catalog_tool.CatalogError):
            self.create()
        catalog = catalog_tool.load_catalog(self.root)
        catalog["projects"].append(copy.deepcopy(catalog["projects"][0]))
        with self.assertRaises(catalog_tool.CatalogError):
            catalog_tool.validate_metadata(catalog)

    def test_missing_cover_and_unregistered_folder_are_detected(self):
        self.create()
        catalog = catalog_tool.load_catalog(self.root)
        cover = self.root / "projects" / "001-example" / "assets" / "cover.svg"
        cover.unlink()
        with self.assertRaisesRegex(catalog_tool.CatalogError, "缺少项目文件"):
            catalog_tool.validate_files(self.root, catalog)
        shutil.copyfile(REPOSITORY / "templates" / "project" / "assets" / "cover.svg", cover)
        (self.root / "projects" / "002-unregistered").mkdir()
        with self.assertRaisesRegex(catalog_tool.CatalogError, "未登记"):
            catalog_tool.validate_files(self.root, catalog)

    def test_cover_traversal_and_invalid_demo_are_rejected(self):
        self.create()
        catalog = catalog_tool.load_catalog(self.root)
        for field, value in (("cover", "assets/../README.svg"), ("demo_url", "javascript:alert(1)")):
            changed = copy.deepcopy(catalog)
            changed["projects"][0][field] = value
            with self.subTest(field=field), self.assertRaises(catalog_tool.CatalogError):
                catalog_tool.validate_metadata(changed)

    def test_preview_and_demo_escape_markdown(self):
        self.create(name="A | [B] <C>", summary="中文 | 摘要")
        catalog = catalog_tool.load_catalog(self.root)
        catalog["projects"][0]["demo_url"] = "https://example.com/demo_(v1)/"
        catalog_tool.validate_metadata(catalog)
        rendered = catalog_tool.render_index(catalog)
        self.assertIn("A \\| \\[B\\] &lt;C&gt;", rendered)
        self.assertIn("demo_%28v1%29/", rendered)

    def test_invalid_readme_markers_do_not_create_files(self):
        for content in ("无标记", f"{catalog_tool.END}\n{catalog_tool.START}"):
            catalog_tool.write_text(self.root / "README.md", content)
            with self.assertRaises(catalog_tool.CatalogError):
                self.create()
        self.assertEqual(list((self.root / "projects").iterdir()), [])

    def test_cli_detects_stale_index_then_creates_and_checks(self):
        (self.root / "scripts").mkdir()
        shutil.copyfile(REPOSITORY / "scripts" / "projects.py", self.root / "scripts" / "projects.py")

        def run(*arguments):
            return subprocess.run(
                [sys.executable, "-X", "utf8", "scripts/projects.py", *arguments],
                cwd=self.root, capture_output=True, text=True, encoding="utf-8", check=False,
            )

        self.assertEqual(run("check").returncode, 1)
        self.assertEqual(run("sync").returncode, 0)
        result = run("new", "demo", "--name", "测试项目", "--repo", "https://github.com/owner/demo.git/", "--summary", "测试新增流程")
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(run("check").returncode, 0)
        self.assertEqual(catalog_tool.load_catalog(self.root)["projects"][0]["repository"], "https://github.com/owner/demo")


if __name__ == "__main__":
    unittest.main()
