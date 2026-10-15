"""Maintain the ordered research catalog using only Python's standard library."""

import argparse
import html
import json
from pathlib import Path, PurePosixPath
import re
import shutil
import sys
from urllib.parse import quote, urlsplit


ROOT = Path(__file__).resolve().parents[1]
START = "<!-- PROJECTS:START -->"
END = "<!-- PROJECTS:END -->"
STATUSES = {
    "planned": "待研究",
    "researching": "研究中",
    "completed": "已完成",
    "archived": "已归档",
}
FIELDS = {
    "id", "slug", "name", "repository", "summary", "status", "tags", "cover", "demo_url"
}


class CatalogError(ValueError):
    pass


def directory(project):
    return f"{project['id']:03d}-{project['slug']}"


def write_text(path, content):
    with path.open("w", encoding="utf-8", newline="\n") as stream:
        stream.write(content)


def single_line(value):
    return (
        isinstance(value, str)
        and bool(value.strip())
        and value == value.strip()
        and not any(ord(char) < 32 or ord(char) == 127 for char in value)
    )


def validate_metadata(catalog):
    if not isinstance(catalog, dict) or set(catalog) != {"schema_version", "projects"}:
        raise CatalogError("projects.json 必须包含 schema_version 与 projects。")
    if type(catalog["schema_version"]) is not int or catalog["schema_version"] != 1:
        raise CatalogError("仅支持 schema_version: 1。")
    if not isinstance(catalog["projects"], list):
        raise CatalogError("projects 必须是数组。")
    ids, slugs = set(), set()
    for project in catalog["projects"]:
        if not isinstance(project, dict) or set(project) != FIELDS:
            raise CatalogError(f"每个项目必须包含这些字段：{', '.join(sorted(FIELDS))}。")
        number = project["id"]
        if type(number) is not int or not 1 <= number <= 999 or number in ids:
            raise CatalogError(f"项目编号必须在 1–999 之间且不重复：{number!r}")
        ids.add(number)
        slug = project["slug"]
        if (
            not isinstance(slug, str)
            or not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", slug)
            or len(slug) > 64
            or slug in slugs
        ):
            raise CatalogError(f"slug 必须唯一，且为最多 64 字符的小写英文、数字与连字符：{slug!r}")
        slugs.add(slug)
        for key in ("name", "summary", "repository", "status", "cover"):
            if not single_line(project[key]):
                raise CatalogError(f"{number:03d} 的 {key} 必须是无首尾空格的单行文本。")
        if project["status"] not in STATUSES:
            raise CatalogError(f"{number:03d} 的 status 无效，可选：{', '.join(STATUSES)}")
        if not re.fullmatch(
            r"https://github\.com/[A-Za-z0-9][A-Za-z0-9_.-]*/[A-Za-z0-9][A-Za-z0-9_.-]*",
            project["repository"],
        ):
            raise CatalogError(f"{number:03d} 的 repository 应为 https://github.com/owner/repo。")
        tags = project["tags"]
        if not isinstance(tags, list) or not all(single_line(tag) for tag in tags):
            raise CatalogError(f"{number:03d} 的 tags 必须是单行文本数组。")
        cover = PurePosixPath(project["cover"])
        if (
            not project["cover"].startswith("assets/")
            or ".." in cover.parts
            or "\\" in project["cover"]
            or any(char in project["cover"] for char in "?#")
            or cover.suffix.lower() not in {".svg", ".png", ".jpg", ".jpeg", ".webp", ".gif"}
        ):
            raise CatalogError(f"{number:03d} 的 cover 必须指向自身 assets/ 目录中的图片。")
        demo = project["demo_url"]
        if demo != "":
            if not single_line(demo) or any(char.isspace() for char in demo):
                raise CatalogError(f"{number:03d} 的 demo_url 必须是空字符串或 HTTPS 地址。")
            try:
                parsed = urlsplit(demo)
                valid = parsed.scheme == "https" and parsed.hostname and not parsed.username and not parsed.password
            except ValueError:
                valid = False
            if not valid:
                raise CatalogError(f"{number:03d} 的 demo_url 必须是空字符串或 HTTPS 地址。")


def load_catalog(root):
    try:
        catalog = json.loads((root / "projects.json").read_text(encoding="utf-8"))
    except (OSError, ValueError) as error:
        raise CatalogError(f"无法读取 projects.json：{error}") from error
    validate_metadata(catalog)
    return catalog


def validate_files(root, catalog):
    expected = set()
    for project in catalog["projects"]:
        name = directory(project)
        expected.add(name)
        folder = root / "projects" / name
        for relative in ("README.md", "notes.md", "web/README.md", project["cover"]):
            path = folder / relative
            if not path.resolve().is_relative_to(folder.resolve()):
                raise CatalogError(f"文件指向项目目录以外：{name}/{relative}")
            if not path.is_file():
                raise CatalogError(f"缺少项目文件：projects/{name}/{relative}")
        if not folder.resolve().is_relative_to((root / "projects").resolve()):
            raise CatalogError(f"项目目录不能指向仓库之外：{name}")
    for folder in (root / "projects").iterdir():
        if folder.is_dir() and folder.name not in expected:
            raise CatalogError(f"存在未登记的项目目录：projects/{folder.name}")


def md(value):
    value = html.escape(value, quote=False)
    return re.sub(r"([\\`*_\[\]|])", r"\\\1", value)


def link_url(value):
    return quote(value, safe=":/?#@!$&*+,;=%-._~")


def render_index(catalog):
    projects = sorted(catalog["projects"], key=lambda project: project["id"])
    if not projects:
        return "暂无已收录项目。首个研究项目将从 **001** 开始；使用下方命令创建后，这里会自动展示有序索引与预览图。\n"
    rows = [
        f"已收录 **{len(projects)}** 个项目，按收录编号升序展示。",
        "",
        "| 编号 | 项目 | 摘要 | 状态 | 入口 |",
        "| --- | --- | --- | --- | --- |",
    ]
    for project in projects:
        path = f"projects/{directory(project)}"
        links = f"[研究]({path}/README.md) · [上游]({link_url(project['repository'])})"
        if project["demo_url"]:
            links += f" · [演示]({link_url(project['demo_url'])})"
        rows.append(
            f"| {project['id']:03d} | [{md(project['name'])}]({path}/README.md) | "
            f"{md(project['summary'])} | {STATUSES[project['status']]} | {links} |"
        )
    rows.extend(["", "### 项目预览", ""])
    for project in projects:
        path = f"projects/{directory(project)}"
        rows.extend([
            f"#### {project['id']:03d} · {md(project['name'])}",
            "",
            f"[![{md(project['name'])} 项目预览]({path}/{link_url(project['cover'])})]({path}/README.md)",
            "",
            md(project["summary"]),
            "",
        ])
        if project["tags"]:
            rows.extend(["标签：" + " · ".join(md(tag) for tag in project["tags"]), ""])
    return "\n".join(rows).rstrip() + "\n"


def updated_readme(root, catalog):
    content = (root / "README.md").read_text(encoding="utf-8")
    if content.count(START) != 1 or content.count(END) != 1:
        raise CatalogError("README 必须且只能包含一对 PROJECTS 索引标记。")
    before, _, rest = content.partition(START)
    _, _, after = rest.partition(END)
    if END in before:
        raise CatalogError("README 的 PROJECTS 索引标记顺序错误。")
    return before + START + "\n\n" + render_index(catalog) + "\n" + END + after


def sync(root, catalog):
    write_text(root / "README.md", updated_readme(root, catalog))


def create_project(root, args):
    catalog = load_catalog(root)
    validate_files(root, catalog)
    updated_readme(root, catalog)  # Reject broken markers before creating files.
    existing = [project["id"] for project in catalog["projects"]]
    existing.extend(
        int(match.group(1))
        for folder in (root / "projects").iterdir()
        if folder.is_dir() and (match := re.match(r"^(\d{3})-", folder.name))
    )
    project = {
        "id": max(existing, default=0) + 1,
        "slug": args.slug,
        "name": args.name,
        "repository": args.repo.rstrip("/").removesuffix(".git"),
        "summary": args.summary,
        "status": "planned",
        "tags": list(dict.fromkeys(args.tag)),
        "cover": "assets/cover.svg",
        "demo_url": "",
    }
    catalog["projects"].append(project)
    validate_metadata(catalog)
    name = directory(project)
    destination = root / "projects" / name
    if destination.exists():
        raise CatalogError(f"目录已存在：{name}")
    tokens = {
        "{{ID}}": f"{project['id']:03d}",
        "{{NAME}}": md(project["name"]),
        "{{SUMMARY}}": md(project["summary"]),
        "{{REPOSITORY}}": project["repository"],
        "{{DIRECTORY}}": name,
    }
    shutil.copytree(root / "templates" / "project", destination)
    for path in destination.rglob("*.md"):
        content = path.read_text(encoding="utf-8")
        content = re.sub(r"\{\{[A-Z]+\}\}", lambda match: tokens[match.group(0)], content)
        write_text(path, content)
    validate_files(root, catalog)
    catalog["projects"].sort(key=lambda item: item["id"])
    write_text(root / "projects.json", json.dumps(catalog, ensure_ascii=False, indent=2) + "\n")
    sync(root, catalog)
    return name


def main():
    parser = argparse.ArgumentParser(description="创建研究项目、同步首页、检查索引。")
    commands = parser.add_subparsers(dest="command", required=True)
    new = commands.add_parser("new", help="创建下一个编号的研究项目")
    new.add_argument("slug", help="小写英文、数字与连字符组成的目录名")
    new.add_argument("--name", required=True, help="项目显示名称")
    new.add_argument("--repo", required=True, help="上游 GitHub 仓库地址")
    new.add_argument("--summary", required=True, help="单行用途或研究价值摘要")
    new.add_argument("--tag", action="append", default=[], help="可重复指定的标签")
    commands.add_parser("sync", help="从 projects.json 同步首页")
    commands.add_parser("check", help="检查索引、文件和首页同步状态")
    args = parser.parse_args()
    try:
        if args.command == "new":
            name = create_project(ROOT, args)
            print(f"已创建 projects/{name}/ 并同步首页。")
        else:
            catalog = load_catalog(ROOT)
            validate_files(ROOT, catalog)
            expected = updated_readme(ROOT, catalog)
            if args.command == "sync":
                write_text(ROOT / "README.md", expected)
                print("已同步首页索引。")
            elif (ROOT / "README.md").read_text(encoding="utf-8") != expected:
                raise CatalogError("首页索引尚未同步，请运行 python scripts/projects.py sync。")
            else:
                print(f"检查通过：{len(catalog['projects'])} 个研究项目，首页索引已同步。")
    except (CatalogError, OSError) as error:
        print(f"错误：{error}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
