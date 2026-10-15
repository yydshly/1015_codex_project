/** Collect actual fixed-version GitNexus LocalBackend results, without MCP transport.
 * node collect-advanced.mjs <installed-gitnexus-package-root> <temporary-lab-root>
 * First analyze the independent <lab>/advanced-lab with --pdg --index-only.
 */
import fs from "node:fs/promises";
import { writeSync } from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createHash } from "node:crypto";

const [packageArg, labArg] = process.argv.slice(2);
if (!packageArg || !labArg) throw new Error("Pass package root and temporary lab root");
const packageRoot = path.resolve(packageArg);
const lab = path.resolve(labArg);
const fixture = path.join(lab, "advanced-lab");
const project = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const refs = path.join(project, "references");
process.env.GITNEXUS_HOME = path.join(lab, "advanced-home");
process.env.GITNEXUS_ANALYZER_IDENTITY_CACHE_DIR = path.join(lab, "advanced-identity-cache");
process.env.GITNEXUS_ANALYZER_IDENTITY_IN_PROCESS_GUARDS = "1";
process.env.CI = "1";
process.env.SCARF_ANALYTICS = "false";
process.env.NO_COLOR = "1";

const scrubString = value => {
  let clean = value.replace(/\x1b\[[0-9;]*[A-Za-z]/g, "");
  for (const [old, replacement] of [[fixture, "<LAB>/advanced-lab"], [lab, "<LAB>"], [project, "<PROJECT>"], [os.homedir(), "<USER_HOME>"]]) {
    clean = clean.split(old).join(replacement).split(old.replaceAll("\\", "/")).join(replacement);
  }
  return clean;
};
const scrub = value => typeof value === "string" ? scrubString(value) : Array.isArray(value) ? value.map(scrub) : value && typeof value === "object" ? Object.fromEntries(Object.entries(value).map(([k,v]) => [k, scrub(v)])) : value;
const write = async (name, data) => fs.writeFile(path.join(refs, `advanced-${name}.json`), JSON.stringify(scrub(data), null, 2), "utf8");
const sourceFiles = async dir => {
  const result = [];
  for (const item of await fs.readdir(dir, { withFileTypes: true })) {
    if (item.name.startsWith(".")) continue;
    const full = path.join(dir, item.name);
    if (item.isDirectory()) result.push(...await sourceFiles(full));
    else if (/\.(ts|py|json)$/.test(item.name)) result.push(full);
  }
  return result.sort();
};
const fileHashes = async () => Object.fromEntries(await Promise.all((await sourceFiles(fixture)).map(async file => [path.relative(fixture,file).replaceAll("\\", "/"), createHash("sha256").update(await fs.readFile(file)).digest("hex")])));
await fs.mkdir(refs, { recursive: true });
const before = await fileHashes();
const { LocalBackend } = await import(pathToFileURL(path.join(packageRoot, "dist/mcp/local/local-backend.js")));
const backend = new LocalBackend();
if (!await backend.init()) throw new Error("Advanced fixture has no registered index");
const calls = [
  ["rename", "rename", { symbol_name: "calculateShipping", file_path: "services/shipping.ts", new_name: "computeShippingFee", dry_run: true }],
  ["route_map", "route_map", {}],
  ["shape_check", "shape_check", {}],
  ["api_impact", "api_impact", { route: "/api/orders", method: "POST" }],
  ["tool_map", "tool_map", {}],
  ["pdg_controls", "pdg_query", { mode: "controls", target: "calculateShipping", limit: 100 }],
  ["pdg_flows", "pdg_query", { mode: "flows", target: "calculateShipping", variable: "shipping", limit: 100 }],
  ["pdg_impact", "impact", { target: "calculateShipping", mode: "pdg", line: 5, direction: "upstream" }],
  ["explain", "explain", { target: "security/preview.ts", limit: 100 }],
  ["explain_unsafe", "explain", { target: "unsafePreview", limit: 100 }],
  ["explain_safe", "explain", { target: "safePreview", limit: 100 }],
  ["explain_wrapped", "explain", { target: "wrappedPreview", limit: 100 }],
  ["explain_callback", "explain", { target: "callbackPreview", limit: 100 }],
  ["graph_nodes", "cypher", { statement: "MATCH (n) RETURN n.id AS id, n.name AS name, labels(n) AS kind, n.filePath AS filePath, n.startLine AS startLine, n.endLine AS endLine ORDER BY n.id", limit: 1000 }],
  ["graph_edges", "cypher", { statement: "MATCH (a)-[r:CodeRelation]->(b) RETURN a.id AS source, b.id AS target, r.type AS type, r.confidence AS confidence ORDER BY a.id,b.id,r.type", limit: 2000 }],
  ["graph_types", "cypher", { statement: "MATCH (a)-[r:CodeRelation]->(b) RETURN r.type AS type, count(r) AS count ORDER BY count DESC", limit: 100 }],
];
const results = {};
const commands = [];
try {
  for (const [id, method, params] of calls) {
    const inputs = { ...params, repo: fixture };
    const started = performance.now();
    let result;
    try { result = await backend.callTool(method, inputs); }
    catch (error) { result = { error: String(error.stack ?? error) }; }
    results[id] = result;
    await write(id, result);
    commands.push({ id, method, params: scrub(inputs), durationMs: Math.round(performance.now()-started), status: result.error ? "error" : "returned", raw: `references/advanced-${id}.json` });
    writeSync(1, `${id}: ${result.error ? "error" : "returned"}\n`);
  }
} finally { await backend.dispose(); }
const after = await fileHashes();
const renameIntegrity = { dryRun: true, changedSourceFiles: Object.keys(before).filter(file => before[file] !== after[file]), sourceHashesBefore: before, sourceHashesAfter: after };
await write("rename-integrity", renameIntegrity);
await write("commands", commands);
await write("results", results);
await write("metadata", JSON.parse(await fs.readFile(path.join(fixture,".gitnexus/gitnexus.json"),"utf8")));
const source = await Promise.all((await sourceFiles(fixture)).map(async file => ({path:path.relative(fixture,file).replaceAll("\\", "/"), content:await fs.readFile(file,"utf8")})));
await write("files", source);
const toolsModule = await import(pathToFileURL(path.join(packageRoot,"dist/mcp/tools.js")));
await write("tool-schema-exports", Object.keys(toolsModule));
writeSync(1,"Advanced actual output retained.\n");
