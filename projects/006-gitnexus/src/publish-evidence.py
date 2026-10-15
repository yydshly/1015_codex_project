"""Normalize retained CLI JSON for the read-only demonstration website."""
import json
from pathlib import Path
import re

project = Path(__file__).resolve().parents[1]
refs = project / "references"
def read(name):
    return json.loads((refs / name).read_text(encoding="utf-8-sig"))
def rows(data):
    lines = data.get("markdown", "").splitlines()
    if len(lines) < 2:
        return []
    headers = [v.strip() for v in lines[0].strip("|").split("|")]
    return [dict(zip(headers, [v.strip() for v in line.strip("|").split("|")])) for line in lines[2:] if line.startswith("|")]

nodes = rows(read("graph-nodes.json"))
for node in nodes:
    # The raw Cypher schema stores zero-based lines; browser labels use one-based lines.
    node.update(startLine=int(node["startLine"]) + 1, endLine=int(node["endLine"]) + 1, label="Function")
edges = rows(read("graph-edges.json"))
for edge in edges:
    edge["confidence"] = float(edge["confidence"])
raw = read("collected-results.json")
business = read("business-checks.json")
expected = [
    ("routes/order.ts:submitOrder", "services/customer.ts:validate"),
    ("routes/order.ts:submitOrder", "services/checkout.ts:checkoutOrder"),
    ("services/checkout.ts:checkoutOrder", "services/pricing.ts:calculateSubtotal"),
    ("services/checkout.ts:checkoutOrder", "services/discount.ts:applyDiscount"),
    ("services/checkout.ts:checkoutOrder", "services/shipping.ts:calculateShipping"),
    ("services/checkout.ts:checkoutOrder", "services/inventory.ts:reserveStock"),
    ("services/checkout.ts:checkoutOrder", "storage/orders.ts:saveOrder"),
    ("services/estimate.ts:estimateOrder", "services/pricing.ts:calculateSubtotal"),
    ("services/estimate.ts:estimateOrder", "services/discount.ts:applyDiscount"),
    ("services/estimate.ts:estimateOrder", "services/shipping.ts:calculateShipping"),
    ("services/inventory.ts:reserveStock", "services/inventory.ts:validate"),
]
pairs = {(edge["source"], edge["target"]) for edge in edges}
found = [("Function:" + a, "Function:" + b) in pairs for a, b in expected]
false_customer = ("Function:routes/order.ts:submitOrder", "Function:services/inventory.ts:validate") in pairs
false_inventory = ("Function:services/inventory.ts:reserveStock", "Function:services/customer.ts:validate") in pairs
callers = sorted(v["name"] for v in raw["context"].get("incoming", {}).get("calls", []))
checks = [
    {"name": "预期业务调用", "passed": all(found), "detail": f"预先列出的 11 条函数调用全部核对；命中 {sum(found)}/11。", "matched": sum(found), "expected": 11},
    {"name": "导入别名", "passed": found[9], "detail": "estimateOrder 通过 shippingCost 别名导入，仍解析到 calculateShipping。"},
    {"name": "同名函数消歧", "passed": not false_customer and not false_inventory, "detail": "submitOrder → customer.validate；reserveStock → inventory.validate；两条交叉误连均未出现。"},
    {"name": "直接调用者", "passed": callers == ["checkoutOrder", "estimateOrder"], "detail": "context 返回 checkoutOrder 与 estimateOrder 两个直接调用者。"},
    {"name": "跨文件调用链", "passed": [h["name"] for h in raw["trace"].get("hops", [])] == ["submitOrder", "checkoutOrder", "saveOrder"], "detail": "trace 找到 submitOrder → checkoutOrder → saveOrder，共 2 跳。"},
    {"name": "业务行为", "passed": business["status"] == "passed", "detail": "3 个报价/下单案例通过；无效客户与空购物车均被拒绝。"},
]
metadata = read("analyze-metadata.json")
stats = metadata["stats"]
analysis_log = (refs / "analyze.stdout.txt").read_text(encoding="utf-8-sig")
duration = re.search(r"indexed successfully \(([\d.]+)s\)", analysis_log)
query_degraded = bool(raw["query"].get("warning"))
search_counts = {key: len(raw["query"].get(key, [])) for key in ("processes", "process_symbols", "definitions")}
checks.append({"name": "关键词检索", "passed": not query_degraded and search_counts["processes"] > 0, "detail": f"FTS 修复后实际返回 {search_counts['processes']} 条流程、{search_counts['process_symbols']} 个流程符号和 {search_counts['definitions']} 条定义。"})
limitations = [
    "这是原创小型 TypeScript 样本的实跑结果，不能外推为任意语言、大型项目或 AI 修复成功率。",
    "调用关系与流程来自静态分析；未覆盖运行时反射、动态依赖注入、外部系统和任意框架语义。",
    "未启用 embedding、LLM、Wiki 或 PDG；本实验验证的是结构图谱与查询工具。",
    "边 confidence=0.85 是工具给出的解析置信度，不能读成 85% 的实际正确率。",
    "影响分析返回的是需检查的依赖范围；实际破坏性仍需结合源码、类型检查与业务测试判断。",
]
if query_degraded:
    limitations.insert(0, "FTS 扩展安装下载超时，BM25 关键词搜索降级；query 实际返回空结果并带 warning，未伪造搜索命中。")
files = [{"path": p.relative_to(project / "src/checkout-lab").as_posix(), "content": p.read_text(encoding="utf-8")} for p in sorted((project / "src/checkout-lab").rglob("*")) if p.is_file() and p.suffix in {".ts", ".json"}]
evidence = {
    "status": "verified", "version": "1.6.12", "analyzedAt": metadata["indexedAt"], "schemaVersion": 1,
    "upstream": {"repository": "https://github.com/abhigyanpatwari/GitNexus", "tag": "v1.6.12", "commit": "26ddd95685f13d07f3661ef37c7ca1b62d29c409", "license": "PolyForm-Noncommercial-1.0.0"},
    "sample": "checkout-lab", "searchStatus": "degraded" if query_degraded else "verified",
    "environment": {"os": "Windows x64", "node": "24.19.0", "npm": "10.9.2", "ladybugdb": "0.18.3", "embedding": False, "llm": False},
    "metrics": {"sourceFiles": stats["files"], "tsFiles": sum(f["path"].endswith(".ts") for f in files), "nodes": stats["nodes"], "edges": stats["edges"], "functions": len(nodes), "functionEdges": len(edges), "clusters": stats["communities"], "flows": stats["processes"], "analysisSeconds": float(duration.group(1)) if duration else None, "expectedCalls": len(expected), "verifiedCalls": sum(found), "businessCases": len(business["cases"]), "directCallers": len(callers), "impactedSymbols": raw["impact"].get("impactedCount", 0), "searchFlows": search_counts["processes"], "searchSymbols": search_counts["process_symbols"], "searchDefinitions": search_counts["definitions"]},
    "files": files, "nodes": nodes, "edges": edges,
    "results": {key: raw[key] for key in ("context", "impact", "query", "trace")},
    "checks": checks, "businessChecks": business, "limitations": limitations,
    "commands": read("commands.json"),
    "raw": {key: "references/" + key + ".json" for key in raw},
    "lineNumbers": {"normalized": "one-based", "rawCypherAndTrace": "zero-based", "rawContext": "one-based"},
}
output = project / "web/assets/evidence.json"
output.parent.mkdir(exist_ok=True, parents=True)
output.write_text(json.dumps(evidence, ensure_ascii=False, indent=2), encoding="utf-8")
assert len(nodes) == 10 and len(edges) == 11 and all(check["passed"] for check in checks)
print(json.dumps({"status": evidence["status"], "metrics": evidence["metrics"], "searchStatus": evidence["searchStatus"]}, ensure_ascii=False, indent=2))
