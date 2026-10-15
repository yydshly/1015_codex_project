"""Publish retained advanced GitNexus output as read-only, directly drawable views.

This performs format conversion and finite result checks; it does not infer new edges.
Run after collect-advanced.mjs: python src/collect-advanced.py
"""
import json
from pathlib import Path
from collections import Counter

project = Path(__file__).resolve().parents[1]
refs = project / "references"
read = lambda name: json.loads((refs / f"advanced-{name}.json").read_text(encoding="utf-8-sig"))

def table(data):
    lines = data.get("markdown", "").splitlines()
    if len(lines) < 2:
        return []
    headers = [value.strip() for value in lines[0].strip("|").split("|")]
    return [dict(zip(headers, [value.strip() for value in line.strip("|").split("|")])) for line in lines[2:] if line.startswith("|")]

results = read("results")
files = read("files")
source = {file["path"]: file["content"] for file in files}
nodes = table(results["graph_nodes"])
for node in nodes:
    for key in ("startLine", "endLine"):
        line = node[key]
        node[key] = int(line) + (0 if node["kind"] == "BasicBlock" else 1) if line not in ("", "null", "NULL") else None
    if node["filePath"] in source and node["startLine"]:
        lines = source[node["filePath"]].splitlines()
        node["code"] = "\n".join(lines[node["startLine"]-1:node["endLine"]])
        node["line"] = node["startLine"]
    if not node["name"]:
        node["name"] = (f"L{node['startLine']} · {node.get('code', '').splitlines()[0].strip()[:64]}" if node["kind"] == "BasicBlock" and node.get("code") else node["id"])
edges = table(results["graph_edges"])
for index, edge in enumerate(edges):
    edge["confidence"] = float(edge["confidence"])
    edge["id"] = f"advanced-edge-{index}"
ids = {node["id"] for node in nodes}
assert all(edge["source"] in ids and edge["target"] in ids for edge in edges)
assert len(nodes) == read("metadata")["stats"]["nodes"]
assert len(edges) == read("metadata")["stats"]["edges"]

def select(predicate, edge_types=None):
    selected = [node for node in nodes if predicate(node)]
    selected_ids = {node["id"] for node in selected}
    selected_edges = [edge for edge in edges if edge["source"] in selected_ids and edge["target"] in selected_ids and (edge_types is None or edge["type"] in edge_types)]
    return {"nodes": selected, "edges": selected_edges}

rename = results["rename"]
integrity = read("rename-integrity")
edit_files = {item["file_path"] for item in rename.get("changes", [])}
edits = [{"file": change["file_path"], "filePath": change["file_path"], "nodeId": "File:"+change["file_path"], "line": edit["line"], "oldText": edit["old_text"], "newText": edit["new_text"], "classification": edit["confidence"], "confidence": edit["confidence"]} for change in rename.get("changes", []) for edit in change["edits"]]
rename_ok = rename.get("status") == "success" and rename.get("applied") is False and not integrity["changedSourceFiles"]
rename_graph = select(lambda n: n["filePath"] in edit_files and (n["kind"] in {"File", "Function"} or n["id"] == "Const:notes.ts:developerNote"))

api_graph = select(lambda n: n["kind"] in {"Route", "Tool"} or n["kind"] in {"File", "Function"} and (n["filePath"].startswith(("server/", "client/", "tools/")) or n["filePath"] == "services/shipping.ts"))
mismatches = [{"field": mismatch["field"], "consumer": mismatch["consumer"], "consumerNodeId": "File:"+mismatch["consumer"], "provider": results["api_impact"]["handler"], "providerNodeId": "File:"+results["api_impact"]["handler"], "routeNodeId": "Route:POST /api/orders", "confidence": mismatch["confidence"], "reason": mismatch["reason"], "consumerLine": 9, "providerLine": 9} for mismatch in results["api_impact"].get("mismatches", [])]
route_ok = results["route_map"].get("total") == 3
shape_ok = any(item["field"] == "receiptId" for item in mismatches)
tool_ok = any(tool["name"] == "quote_shipping" for tool in results["tool_map"].get("tools", []))
parameter_route = next(route for route in results["route_map"].get("routes", []) if route["route"] == "/api/orders/:id")
parameter_gap = not parameter_route.get("consumers")

pdg_graph = select(lambda n: n["kind"] in {"BasicBlock", "Function"} and n["filePath"] in {"services/shipping.ts", "security/preview.ts"}, {"CFG", "CDG", "REACHING_DEF", "TAINTED", "TAINT_PATH", "SANITIZES", "CALLS", "CALL_SUMMARY"})
controls = results["pdg_controls"].get("total", 0)
flows = results["pdg_flows"].get("total", 0)
findings = results["explain"].get("findings", [])
unsafe_ok = results["explain_unsafe"].get("totalFindings") == 1
wrapped_ok = any(finding.get("interprocedural") for finding in results["explain_wrapped"].get("findings", []))
safe_clean = results["explain_safe"].get("totalFindings") == 0
callback_gap = results["explain_callback"].get("totalFindings") == 0

cases = [
    {"id": "rename-preview", "status": "verified" if rename_ok else "partial", "summary": "重命名预览覆盖 4 个文件、5 处文本，其中 4 处 graph、1 处 text_search；源文件哈希完全一致。", "expected": "定义、命名导入、别名导入与调用更新；文本提及另标置信度；dry-run 不写源码。", "actual": {"filesAffected": rename.get("files_affected"), "edits": rename.get("total_edits"), "applied": rename.get("applied"), "changedSourceFiles": integrity["changedSourceFiles"]}, "nodeIds": ["Function:services/shipping.ts:calculateShipping"], "evidence": "references/advanced-rename.json"},
    {"id": "api-shape", "status": "verified" if route_ok and shape_ok else "partial", "summary": "识别 3 个静态 API 路由；POST /api/orders 的 receiptId/orderId 偏差被准确报告。", "expected": "客户端读取 receiptId，提供者只返回 orderId、total、status。", "actual": {"routes": results["route_map"].get("total"), "mismatches": mismatches, "risk": results["api_impact"].get("impactSummary", {}).get("riskLevel")}, "nodeIds": ["Route:POST /api/orders", "File:client/create-order.ts", "File:server/create-order.ts"], "evidence": "references/advanced-shape_check.json"},
    {"id": "tool-map", "status": "verified" if tool_ok else "uncovered", "summary": "tool_map 识别 Python FastMCP 的 quote_shipping 定义与说明。", "expected": "发现 @mcp.tool() 装饰的函数。", "actual": results["tool_map"], "nodeIds": ["Tool:quote_shipping", "Function:tools/shipping_tool.py:quote_shipping"], "evidence": "references/advanced-tool_map.json"},
    {"id": "pdg-dependence", "status": "verified" if controls == 7 and flows == 3 else "partial", "summary": "calculateShipping 返回 7 条控制依赖、shipping 变量的 3 条 def→use。", "expected": "分辨提前 throw、条件分支和多处赋值到 return 的依赖。", "actual": {"controls": controls, "flows": flows, "slice": results["pdg_impact"].get("affectedStatementCount")}, "nodeIds": ["Function:services/shipping.ts:calculateShipping"], "evidence": "references/advanced-pdg_controls.json"},
    {"id": "taint", "status": "verified" if unsafe_ok and wrapped_ok and safe_clean else "partial", "summary": "找到未过滤输入的 raw→html→res.send 与跨函数链；encodeURIComponent 样本没有同类发现。", "expected": "报告 unsafePreview 与 wrappedPreview，持久化 sanitizer kill 证据。", "actual": {"findings": len(findings), "unsafe": results["explain_unsafe"].get("totalFindings"), "wrapped": results["explain_wrapped"].get("totalFindings"), "sanitized": results["explain_safe"].get("totalFindings")}, "nodeIds": ["Function:security/preview.ts:unsafePreview", "Function:security/preview.ts:wrappedPreview", "Function:security/preview.ts:sendPreview", "Function:security/preview.ts:safePreview"], "evidence": "references/advanced-explain.json"},
    {"id": "parameter-url-gap", "status": "uncovered" if parameter_gap else "verified", "summary": "GET /api/orders/:id 未关联字面量 /api/orders/42 或变量拼接 URL 客户端。", "expected": "两个客户端均消费该参数路由。", "actual": parameter_route, "nodeIds": ["Route:GET /api/orders/:id", "File:client/order-detail.ts", "File:client/dynamic-order.ts"], "evidence": "references/advanced-route_map.json"},
    {"id": "callback-gap", "status": "uncovered" if callback_gap else "verified", "summary": "callbackPreview 中的请求数据进入回调 res.send，explain 未给出发现。", "expected": "此样本包含应被人工审查的回调路径。", "actual": results["explain_callback"], "nodeIds": ["Function:security/preview.ts:callbackPreview"], "evidence": "references/advanced-explain_callback.json"},
]
known_gaps = [
    {"id": "parameter-url-gap", "observed": True, "summary": cases[-2]["summary"], "raw": cases[-2]["evidence"]},
    {"id": "callback-gap", "observed": True, "summary": cases[-1]["summary"], "raw": cases[-1]["evidence"]},
    {"id": "runtime-evidence", "observed": True, "summary": "所有路由的 runtimeEvidence.confirmed=false；这是静态索引，未运行 HTTP 服务。"},
    {"id": "finite-fixture", "observed": True, "summary": "结果仅验证这个有限原创样本；未启用 LLM、embedding、Wiki 或付费 API。"},
    {"id": "pdg-scope", "observed": True, "summary": "PDG 控制/数据边在函数内；跨函数污点与 impact 的 callgraph-bridge 证据须分别解释。"},
    {"id": "rename-scope", "observed": True, "summary": "重命名依据图找到文件后逐行文本替换；graph 标签不等于语言服务器的逐引用语义证明。"},
]
views = {
    "rename": {"status": "verified" if rename_ok else "partial", "title": "跨文件重命名预览", "summary": cases[0]["summary"], **rename_graph, "files": sorted(edit_files), "details": {**rename, "edits": edits, "integrity": integrity}, "raw": ["references/advanced-rename.json", "references/advanced-rename-integrity.json"]},
    "api": {"status": "partial" if parameter_gap else "verified", "title": "API 消费、字段偏差与工具定义", "summary": "成功识别 3 路由、1 条消费关系、receiptId 偏差与 1 个 MCP 工具；参数/动态 URL 客户端未连上。", **api_graph, "details": {"route_map": results["route_map"], "shape_check": results["shape_check"], "api_impact": results["api_impact"], "tool_map": results["tool_map"], "mismatches": mismatches, "uncoveredClients": ["client/order-detail.ts", "client/dynamic-order.ts"] if parameter_gap else []}, "raw": [f"references/advanced-{name}.json" for name in ("route_map", "shape_check", "api_impact", "tool_map")]},
    "pdg": {"status": "partial" if callback_gap else "verified", "title": "控制依赖、数据依赖与污点证据", "summary": "7 条控制依赖、3 条 shipping 数据依赖、2 个污点发现；编码器样本无发现，回调样本漏报。", **pdg_graph, "details": {"controls": results["pdg_controls"], "flows": results["pdg_flows"], "impact": results["pdg_impact"], "explain": results["explain"], "unsafe": results["explain_unsafe"], "sanitized": results["explain_safe"], "wrapped": results["explain_wrapped"], "callback": results["explain_callback"]}, "raw": [f"references/advanced-{name}.json" for name in ("pdg_controls", "pdg_flows", "pdg_impact", "explain", "explain_safe", "explain_callback")]},
}
metadata = read("metadata")
data = {
    "status": "verified-with-gaps", "version": "1.6.12", "schemaVersion": 1, "sample": "advanced-lab", "analyzedAt": metadata["indexedAt"],
    "method": "Fixed npm distribution; analyze --pdg --index-only --no-stats; call public LocalBackend.callTool methods used by MCP, without transport overhead. Graph nodes/edges are actual Cypher rows, never inferred by this publisher.",
    "upstream": read("provenance"), "files": files, "graphs": {"all": {"nodes": nodes, "edges": edges}, "rename": rename_graph, "api": api_graph, "pdg": pdg_graph}, "views": views,
    "results": results, "cases": cases, "raw": {key: f"references/advanced-{key}.json" for key in results}, "commands": read("commands"), "knownGaps": known_gaps,
    "metrics": {**metadata["stats"], "nodeKinds": dict(Counter(node["kind"] for node in nodes)), "edgeTypes": dict(Counter(edge["type"] for edge in edges)), "renameEdits": rename.get("total_edits"), "controls": controls, "shippingFlows": flows, "taintFindings": len(findings)},
    "lineNumbers": "Function/symbol stored lines converted from zero-based to one-based; BasicBlock and pdg_query statement lines are already one-based. Display names for unnamed BasicBlocks are derived from the original source snippet."
}
output = project / "web/assets/advanced.json"
output.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
print(json.dumps({"status": data["status"], "metrics": data["metrics"], "views": {key: {"nodes": len(view["nodes"]), "edges": len(view["edges"]), "status": view["status"]} for key, view in views.items()}}, ensure_ascii=False, indent=2))
