# 007 · Web 运行说明

运行时：Python 3.10+、requests 2.33.1。原生 HTML/CSS/JavaScript，固定 HLS.js 1.7.3，无前端构建依赖。

仓库根目录执行：

```powershell
python -m pip install -r projects/007-zhuiju-source-demo/requirements.txt
python projects/007-zhuiju-source-demo/server.py --port 8767
```

打开 http://127.0.0.1:8767/ 。根路径映射到 demo.html。Ctrl+C 停止；端口占用时可改用 --port 8768。

## 文件与配置

- demo.html、styles.css、app.js：实际应用，需要同源 /api/* 后端。
- index.html：静态研究与启动说明，未启动后台时不会展示假的搜索功能。
- vendor/hls.min.js、vendor/hls.LICENSE：固定播放器及原始许可。
- ../source.json：选定 API、来源追溯、域名白名单与样例。

## 部署边界

按 docs/deployment.md 约定，现有静态构建只将 index.html 等资产汇总到 _site/projects/007-zhuiju-source-demo/。这个路径是运行说明，不提供实时接口。

实际应用需要独立 Python 运行环境；目前只监听本机，没有推送或公网部署，demo_url 留空。公网运行需要单独处理鉴权、限流、内容许可和带宽。

## 验证

```powershell
node --check projects/007-zhuiju-source-demo/web/app.js
python -m unittest discover -s projects/007-zhuiju-source-demo/tests
python projects/007-zhuiju-source-demo/scripts/verify_live.py
```

Node 仅用于语法检查；应用运行不需要 npm。ffprobe 仅用于媒体检查，不是运行依赖。
