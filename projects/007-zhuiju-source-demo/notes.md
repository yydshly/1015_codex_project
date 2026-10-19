# 源筛选与实测记录

日期：2026-10-15（Asia/Shanghai）。

## 有限范围筛选

读取原仓库资源 JSON，以 tvbox_config 为入口，仅将配置当数据解析；不下载或执行任何 Spider 插件。17 份配置读取记录在 assets/source-scan.json，26 条 HTTP API 调用记录在 assets/api-probes.json；不同 URL 可能属于同一上游。

第一轮多个来源搜索、详情可用，但样例清单 404、分片超时或证书失败；没有关闭 TLS 校验或绕过登录、访问控制。随后在三个已发现 API 中抽样其他条目，结果保存在 assets/playback-samples.json。

最终选择小马配置中的暴风资源。样例 168380 的首两集有有效 HLS 和 MPEG-TS 数据；ffprobe 与浏览器识别到 1080p H.264 / AAC。源目录、配置的 SHA-256 保存在 source-scan.json。

## 适配与问题修复

- vod_play_from / vod_play_url 以 $$$ 分组，组内 # 分集，按第一个 $ 拆分集名与 URL。
- 网页播放入口不作为直放视频；只接入 HLS / MP4，保留 URL 查询参数。
- 片名、简介均作为不可信文本，以 textContent 渲染；HTML 简介转为纯文本。
- 本机 DNS 代理使用 198.18.0.0/15、2001:2::/48 映射。仅对准确登记的域名允许该映射；本机、内网、链路本地地址仍拒绝。
- 逐段本地转发增加开销；已验证源的清单和分片有 CORS，正常播放改用浏览器直连。
- 浏览器实际验证前两集和进度跳转；跳转后出现过分片超时，已补充有限加载重试及手动重试。源稳定性仍依赖上游和网络。

## 重复验证

```powershell
python projects/007-zhuiju-source-demo/scripts/probe_sources.py
python projects/007-zhuiju-source-demo/scripts/probe_api.py
python projects/007-zhuiju-source-demo/scripts/find_playable.py
python projects/007-zhuiju-source-demo/scripts/verify_live.py
```

probe_api.py 跳过已有报告中的 API，适合增量检查。verify_live.py 用于复验当前选定来源。

“可用”仅指本次响应、媒体抽样与浏览器解码，不代表持续可用、完整内容核验或商业授权。
