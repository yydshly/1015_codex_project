// Welfare rules ported from boss-agent-cli, Copyright (c) 2026 can4hou6joeng4.
// MIT License: ./boss-agent-cli-MIT.txt
// Commit 7f46ba37c654d5f7675bb1328158030d7604847c, search_filters.py.
// Other functions below are original research/demo scaffolding, not upstream execution.
export function matchAllWelfare(labels, tags, description, keywords) {
  const text = tags.join(' ');
  const fullText = `${text} ${description}`;
  const results = [];
  for (const label of labels) {
    const words = keywords[label] ?? [label];
    if (words.some(word => text.includes(word))) results.push(`${label}(标签)`);
    else if (description && words.some(word => fullText.includes(word))) results.push(`${label}(描述)`);
    else return [];
  }
  return results;
}

export function evaluateJobs(jobs, {city, labels}, keywords) {
  return jobs.map(job => {
    const cityMatches = !city || job.city === city;
    const matches = matchAllWelfare(labels, job.tags, job.description, keywords);
    const actual = cityMatches && (!labels.length || matches.length > 0);
    const annotated = cityMatches && labels.every(label => job.truth[label] === true);
    return {...job, matches, actual, annotated, cityMatches};
  });
}

export function replayRisk(state, response) {
  if (state.locked) return {...state, status: '本地锁已阻止', trace: ['检查本地风险锁', '当前模拟凭据未变化', '在请求发出前停止'], outcome: '本次模拟请求数 +0。先在官方页面处理，再显式恢复；本地锁不负责服务端解封。'};
  if (response === 'budget') return {...state, status: '预算耗尽', trace: ['检查本地任务预算', '预算不足，保存断点', '在请求发出前停止'], outcome: '本次模拟请求数 +0。预算停止不代表已经采集完成。'};
  const outcomes = {
    success: ['正常完成', ['本地检查通过', '模拟发出 1 次请求', '返回业务数据，进入本地处理'], '仅表示本次模拟完成，不说明真实接口可用。'],
    auth: ['需要重新登录', ['本地检查通过', '模拟发出 1 次请求', '认证失败，停止并给出登录指引'], '会话恢复依赖正常登录；本示意不演示各 HTTP 路径的刷新和重试细节。'],
    account: ['账号风险 · 已停止', ['本地检查通过', '模拟发出 1 次请求', '识别账号风险 36，停止当前流程'], '保留状态，回官方页面处理；停止后不自动执行后续触达。'],
    environment: ['环境风险 · 已锁定', ['本地检查通过', '模拟发出 1 次请求', '识别环境风险类 37', '记录本地风险锁，停止流程'], '再次回放时会在发出请求前被拦下。37 还存在 Token 过期分支，此处只示意环境风险。'],
    limited: ['限流 · 已停止示意', ['本地检查通过', '模拟发出 1 次请求', '识别限流 9，停止本次回放'], '真实路径的有限重试受各自策略与预算约束；降低频率不能保证平台放行。'],
  };
  if (!outcomes[response]) throw new Error('Unknown simulated response');
  const [status, trace, outcome] = outcomes[response];
  return {locked: response === 'environment', requests: state.requests + 1, status, trace, outcome};
}
