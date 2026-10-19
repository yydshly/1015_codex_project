# 证据与来源索引

[返回总览](../README.md)

核查日期为 2026-10-16，Asia/Shanghai。外部资料在本轮会话中读取；价格和产品规则可能变化，发布或签约前复核。[sources.json](sources.json)提供机器可读索引，注明每个来源支持什么及不能推出什么。

## 本地证据

| 文件 | 用途 |
| --- | --- |
| [upstream-manifest.json](upstream-manifest.json) | 17 个上游固定版本文件的来源、字节数和 SHA-256 |
| [上游资源数据](upstream/resources/resources.json) | 119 条目录记录、分类、来源和人工核验状态 |
| [上游 Schema](upstream/resources/schema.json) | 字段定义 |
| [上游核验记录](upstream/reports/verifications.json) | 用户推荐、截图和配置收录记录 |
| [上游可访问报告](upstream/reports/availability.json) | 固定时间、96 个入口的 HTTP 响应状态 |
| [evidence-summary.json](evidence-summary.json) | 派生统计、007 历史结果和关联文件哈希 |
| [validation.json](validation.json) | 本次文档、快照、成本和目录检查结果 |

精选源码位于 `upstream/scripts/` 和 `upstream/.github/workflows/`。原始许可见 [LICENSE](upstream/LICENSE)。这是一份精选留档，不是可直接运行全部流程的完整上游 checkout。

007 的原始材料仍保留在原子项目，010 通过相对链接引用：

- [筛源过程](../../007-zhuiju-source-demo/notes.md)、[配置扫描](../../007-zhuiju-source-demo/assets/source-scan.json)、[API 调用记录](../../007-zhuiju-source-demo/assets/api-probes.json)。
- [选定来源](../../007-zhuiju-source-demo/source.json)、[实时链路报告](../../007-zhuiju-source-demo/assets/live-verification.json)。
- [浏览器报告](../../007-zhuiju-source-demo/assets/browser-verification.json)、[编码报告](../../007-zhuiju-source-demo/assets/ffprobe.json)、[播放截图](../../007-zhuiju-source-demo/assets/demo-playback-verified.jpg)。

这些是 2026-10-15 的抽样证据，不是 010 归纳日重新跑出的播放保证。

## 原库

- [固定版本](https://github.com/laoma528/awesome-zhuiju-free/tree/d1049a3af73c068c390decc92eebe9bff84d52a0)：源码版本锚点。
- [上游实时主页](https://github.com/laoma528/awesome-zhuiju-free)：可能继续更新，与固定快照分开。
- 数据、Schema、可访问检测、README 同步、审核、统计和周报工作流均在本地快照中按原路径保存。

## 影片与嵌入来源

- [Big Buck Bunny 许可](https://peach.blender.org/about/)与[Sintel 许可](https://durian.blender.org/sharing/)：具体作品的商业再分发和署名条件。
- [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/)：许可概要及原文入口，不自动覆盖其他作品。
- [Commons 复用](https://commons.wikimedia.org/wiki/Commons:First_steps/Reuse/en)：逐文件核实许可，平台不保证每个上传者的权利信息无误。
- [YouTube 开发者政策](https://developers.google.com/youtube/terms/developer-policies)、[API 额度](https://developers.google.com/youtube/v3/getting-started)：商业和嵌入约束、接口配额；不证明视频文件可再托管。
- [Pexels API](https://www.pexels.com/api/documentation/)、[内容条款](https://www.pexels.com/terms-of-service/)；[Pixabay API](https://pixabay.com/api/docs/)、[内容条款](https://pixabay.com/service/terms/)：素材使用与请求额度，不能直接当成经营影片库许可。

## Filmhub

- [Buyer 页面](https://filmhub.com/buyers)：内容类别和采购合作。
- [渠道资源总表](https://help.filmhub.com/resources-for-channels)、[入驻流程](https://help.filmhub.com/channel-onboarding-guide)、[账户状态](https://help.filmhub.com/channel-account-statuses-explained)。
- [选片](https://help.filmhub.com/en/articles/3031183-title-discovery-licensing)、[授权可用范围](https://help.filmhub.com/understanding-avails-and-rights)。
- [标准交付包](https://help.filmhub.com/en/articles/2663766-filmhub-standard-delivery-package)、[文件传输](https://help.filmhub.com/en/articles/2692190-setting-up-file-transfer)、[交付时序](https://help.filmhub.com/delivery-timeline-and-what-to-expect)。
- [分成与固定费](https://help.filmhub.com/en/articles/8386488-filmhub-distribution-deal-types-revenue-share-fixed-fee)、[制片人侧分成](https://help.filmhub.com/en/articles/2663772-filmhub-revenue-share)、[通用条款](https://filmhub.com/terms)。
- [报表](https://help.filmhub.com/reporting-and-royalties)、[OTT 供应商说明](https://help.filmhub.com/en/articles/5955903-ott-service-providers)。
- [Relay 官方公告](https://filmhub.com/blog/posts/introducing-relay-a-new-streaming-service-powered-by-filmhub)：特定渠道的历史规模和合作示例，不是我们的准入或报价。

## 分发、浏览器与部署

- [Bunny Stream 价格](https://bunny.net/docs/stream/pricing)、[档位](https://bunny.net/docs/stream/delivery-tiers)、[计费与余额](https://bunny.net/docs/billing/add-funds)、[FAQ](https://bunny.net/faq/)、[SLA](https://bunny.net/sla/)、[播放保护设置](https://bunny.net/docs/stream/security-options)。
- [Cloudflare Stream 价格](https://developers.cloudflare.com/stream/pricing/)、[播放访问控制](https://developers.cloudflare.com/stream/viewing-videos/securing-your-stream/)。
- [Cloudflare Pages 计费](https://developers.cloudflare.com/pages/functions/pricing/)、[普通 CDN 条款](https://www.cloudflare.com/service-specific-terms-application-services/)、[GitHub Pages 限制](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits)。
- [hls.js](https://github.com/video-dev/hls.js)、[MDN CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS)。

## 行业模式示例

- [Netflix 许可模式](https://help.netflix.com/en/node/4976)、[Tubi 免费与广告模式](https://tubitv.com/help-center/About-Tubi/articles/4409975158043)。
- [Europol 实际案件](https://www.europol.europa.eu/media-press/newsroom/news/european-law-enforcement-stops-illegal-iptv-service-providers)：证明未经授权分发网络存在，不用于指控本研究中的某个具体域名。

## 核查限制

不把网页可访问当成供应关系已经成立；不把某篇公告中的特定协议推广成统一价格。本项目未获取 Filmhub 新渠道合同、个人准入标准、动画可授权清单或完整报价，也未测量这些视频 CDN 在目标市场的播放质量。
