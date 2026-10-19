# 静态研究与离线演示

入口 index.html，原生 HTML/CSS/JS，无应用依赖。仓库根目录运行：

```powershell
python scripts/projects.py check
python scripts/build_web.py
python -m http.server 8768 --bind 127.0.0.1 --directory _site
```

访问 <http://127.0.0.1:8768/projects/008-boss-agent-cli/>。既有构建器复制 index.html、styles.css、app.js 和 assets/，研究文档及 references 也按原规则打包，无需修改根目录依赖。

交互：角色能力切换、五步原理、合成岗位城市/福利筛选、命中/全量、文本探针、模拟错误停止、重复请求本地拦截和模拟人工恢复。

assets/evidence.json 来自 Python 原始函数，lab.mjs 是 JS 移植。仓库根目录运行 `node projects/008-boss-agent-cli/scripts/verify_browser_model.mjs` 检查一致性。

没有真实 BOSS 请求、消息或模型调用。模拟请求计数只统计演示步骤。角色命令为示例，页面不执行 shell。凭据变化只解除演示本地锁，不代表服务端解除风险。

全部资源为相对路径，适配既有 Pages 子路径。当前未部署，demo_url 留空。版权和许可见项目 THIRD_PARTY.md 及 assets/boss-agent-cli-MIT.txt。
