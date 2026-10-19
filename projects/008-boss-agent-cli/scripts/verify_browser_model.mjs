import assert from 'node:assert/strict';
import {readFileSync, writeFileSync} from 'node:fs';
import {matchAllWelfare, evaluateJobs, replayRisk} from '../web/assets/lab.mjs';

const data = JSON.parse(readFileSync(new URL('../references/replay.json', import.meta.url), 'utf8'));
const checks = [];
for (const probe of data.probes) {
  const actual = matchAllWelfare(probe.conditions, probe.tags, probe.text, data.welfare_keywords);
  assert.deepEqual(actual, probe.matches, probe.id);
  checks.push({name:`upstream-parity:${probe.id}`, passed:true});
}
for (const scenario of data.search_combinations) {
  const actual = evaluateJobs(data.jobs, {city:scenario.city, labels:scenario.conditions}, data.welfare_keywords);
  assert.deepEqual(actual.filter(job => job.actual).map(job => job.id), scenario.expected_ids);
  checks.push({name:`filter-parity:${scenario.city || 'all'}:${scenario.conditions.join('+') || 'none'}`, passed:true});
}
let state = replayRisk({locked:false, requests:0}, 'environment');
assert.equal(state.requests, 1);
assert.equal(state.locked, true);
state = replayRisk(state, 'success');
assert.equal(state.requests, 1, 'a locked workflow must not send another simulated request');
checks.push({name:'environment-risk-blocks-next-request', passed:true});
state = replayRisk({...state,locked:false}, 'success');
assert.equal(state.requests, 2);
checks.push({name:'explicit-simulated-recovery-permits-one-attempt', passed:true});
state = replayRisk({locked:false, requests:0}, 'budget');
assert.equal(state.requests, 0);
checks.push({name:'budget-stops-before-request', passed:true});
for (const response of ['auth','account','limited']) {
  state = replayRisk({locked:false, requests:0}, response);
  assert.equal(state.requests, 1);
  assert.ok(!state.locked);
  assert.ok(state.trace.at(-1).includes(response === 'auth' ? '认证失败' : response === 'account' ? '36' : '9'));
  checks.push({name:`response:${response}`,passed:true});
}
const report = {date:'2026-10-16', mode:'node-offline-parity-and-demo-transitions', checks, total:checks.length, passed:checks.length, live_platform_requests:0};
writeFileSync(new URL('../references/browser-model-checks.json', import.meta.url), JSON.stringify(report,null,2) + '\n');
console.log(`${report.passed}/${report.total} checks passed; JavaScript matches actual Python upstream outputs.`);
