import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {welfareMatches,shortlist,careerProfile} from '../web/assets/model.mjs';
const load=path=>JSON.parse(readFileSync(new URL(path,import.meta.url),'utf8'));
const welfare=load('../web/assets/welfare-evidence.json');
const career=load('../web/assets/career-samples.json');
const sources=load('../web/assets/sources.json');
const checks=[];
for(const probe of welfare.probes){assert.deepEqual(welfareMatches(probe.conditions,probe.tags,probe.text,welfare.welfare_keywords),probe.matches);checks.push(`welfare-probe:${probe.id}`);}
for(const scenario of welfare.search_combinations){assert.deepEqual(shortlist(welfare.jobs,{city:scenario.city,conditions:scenario.conditions},welfare.welfare_keywords).map(job=>job.id),scenario.expected_ids);checks.push(`shortlist:${scenario.city||'all'}:${scenario.conditions.join('+')||'none'}`);}
const back=careerProfile(career.samples,'backend',['Python','SQL','API']);
assert.equal(back.sampleCount,3);assert.equal(back.skills.find(item=>item.skill==='SQL').count,3);checks.push('backend-sql-three-of-three');
assert.ok(!back.toExplore.some(item=>item.skill==='SQL'));assert.ok(back.toExplore.some(item=>item.skill==='Linux'));checks.push('selected-skills-change-exploration-list');
const data=careerProfile(career.samples,'data',[]);assert.equal(data.skills.find(item=>item.skill==='ETL').count,3);assert.equal(data.skills.find(item=>item.skill==='Python').count,2);checks.push('data-direction-aggregation');
const ai=careerProfile(career.samples,'ai',['RAG']);assert.equal(ai.skills.find(item=>item.skill==='RAG').count,3);assert.ok(!ai.toExplore.some(item=>item.skill==='RAG'));checks.push('ai-direction-and-selection');
assert.deepEqual(ai.skills.find(item=>item.skill==='RAG').evidence,['A01','A02','A03']);checks.push('skill-counts-link-to-sample-evidence');
const duplicate=careerProfile([{id:'T1',direction:'test',skills:['SQL','SQL'],tasks:['task','task']}],'test');assert.equal(duplicate.skills[0].count,1);assert.equal(duplicate.tasks[0].count,1);checks.push('count-once-per-job');
assert.equal(careerProfile(career.samples,'missing').sampleCount,0);checks.push('empty-direction');
assert.equal(sources.welfare_symbols_ast_unchanged,true);checks.push('current-source-parity-recorded');
const report={date:'2026-10-20',total:checks.length,passed:checks.length,checks,mode:'offline-regression-and-prototype-checks',live_platform_requests:0,llm_requests:0};
writeFileSync(new URL('../references/model-checks.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
console.log(`${checks.length}/${checks.length} checks passed; no platform or LLM requests.`);
