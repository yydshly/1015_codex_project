# 片源发现、获取与持续供给

[返回总览](README.md) · [Filmhub 专题](filmhub.md) · [架构](architecture.md)

## 1. “源”至少有六种含义

| 名称 | 实际拿到什么 | 还缺什么 |
| --- | --- | --- |
| 网站清单 | 用户可以访问的网站 URL | 站内搜索、直接播放和内容使用权 |
| TVBox 配置 | 站点列表、API 或插件配置 | 协议适配、兼容性、服务条件和授权 |
| 元数据 API | 标题、简介、海报、演员等 | 视频文件及相应的展示许可 |
| 播放 URL | 某个版本/集数的媒体地址 | 长期供应、域名与地区权限、并发和商用承诺 |
| 官方播放器嵌入 | 由来源方分发和控制的播放能力 | 自有播放器控制、再托管和收费权限 |
| 影片文件与分发许可 | 视频、字幕、海报和合同允许的使用范围 | 自己的转码、存储、CDN 和运营 |

买视频云服务得到的是基础设施；购买或取得影片使用权得到的是内容许可。这两类供应商可以不同。

## 2. 这次到底从哪里找到的

007 的可追溯路径是：

```text
原仓库 resources/resources.json
  分类 tvbox_config，条目“小马”
    https://szyyds.cn/tv/x.json
      sites 中 key=暴風，type=1
        api=https://bfzyapi.com/api.php/provide/vod/?ac=list
          统一查询基地址 /api.php/provide/vod/
            搜索：ac=detail&wd=...
            详情：ac=detail&ids=...
              vod_play_from、vod_play_url
                https://v.fengbao14.com/.../index.m3u8
                  媒体分片
```

配置中的 `?ac=list` 是发现时的地址；实际搜索请求改用已测试的参数。`type=1` 在这份配置中表示可直接尝试的 HTTP 数据源，不能不经验证就推广为所有播放器配置的统一规范。

小马配置读取时有 62 个站点，包含 15 个 type=1、46 个 type=3、1 个 type=0；老刘备配置读取时有 234 个站点，其中 type=1 为 15 个。这里只是配置项数量；可能指向同一个后端、镜像或不同线路，不是独立内容供应商数量。原始结果见 [007 配置扫描](../007-zhuiju-source-demo/assets/source-scan.json)。

本次共保留 17 份配置读取记录和 26 条 HTTP API 调用记录。没有把陌生插件或 Spider 下载后执行。协议和媒体测试细节见 [007 笔记](../007-zhuiju-source-demo/notes.md)。

## 3. 作者如何整理的，能追溯多远

上游核验记录明确包含用户提交、截图推荐以及 2026-07-04 的 TVBox 配置批量收录。“小马”在该批次中。目录先汇总入口，后续用人工记录和定时 HTTP 检查维护。

可追溯的是：谁向目录推荐了什么、何时录入、记录了哪些观察。不可从这些记录推出：最早的发现者、资源站如何取得原片、是否覆盖各国家版权、为什么免费承担媒体费用。[固定核验记录](references/upstream/reports/verifications.json)

对于暴风来源，本轮未取得以下承诺：第三方网站接入许可、商业使用范围、可用地区、并发、日流量、API 配额、服务保障、域名变更通知和原始影片授权链。留空意味着未知，不等于无限或默认允许。

## 4. 丰富片库从哪里来

### 正规版权供应

平台可以采购单片、整组片库、非独家授权，或者自制与联合出品；按地域、期限和商业模式签约。内容文件和宣传素材通过供应链交付。Netflix 的官方说明可以佐证采购和自制并存的模式。[Netflix 说明](https://help.netflix.com/en/node/4976)

免费广告平台同样可以签约取得影片，用广告收入支付内容与基础设施。用户观看免费，不代表供应和分发成本为零。[Tubi 免费模式](https://tubitv.com/help-center/About-Tubi/articles/4409975158043)

### 创作者供稿

可以直接与独立导演、动画团队、院校创作团队和版权所有人沟通。先核实对方可授予的权利，再签非独家、限定地区与期限的协议。可能按固定费用、收入分成或其他条款合作；本项目尚未与任何作者签约。

### 第三方资源复用

多个前台网站可以接同一资源库或播放服务，使片目看起来很丰富。有的拥有相应授权，也存在未经许可复制和分发的案例。不能仅凭一个站“能搜到热门片”就判断具体授权状态。Europol 的实际案件证明未经授权分发网络存在，但该案例不直接证明本项目测试的任何具体来源违法。[Europol 案例](https://www.europol.europa.eu/media-press/newsroom/news/european-law-enforcement-stops-illegal-iptv-service-providers)

采集接口不产生影片，也不改变影片的权利状态。多个来源返回同一 CDN 时，还会形成共同故障点。

## 5. 候选来源对比

以下为公开资料核查，不是本项目已完成的供应商接入或跨地区压力测试。技术配额与商业规则可能变化，应在开户和发布前复核。

| 来源 | 内容与接入方式 | 商业条件 | 配额 / 流量事实 | 当前用途 |
| --- | --- | --- | --- | --- |
| Blender 具体开放电影 | 获取获准再分发的影片文件，建立自有片目 | 按具体作品许可证署名、保留片尾等 | 未获得原站无限外链承诺；自己存储和分发可控制账单 | 小规模动画专题首选 |
| Wikimedia Commons | 科学、历史、自然等成片与素材，按文件筛选 | 逐文件确认许可证与署名、共享要求 | 不将原站热链当成长期视频 CDN 供应合同 | 后续扩充专题 |
| YouTube 官方嵌入 | Data API 检索、官方 iframe 播放 | 保留平台要求；不得对嵌入播放本身收费，产品要有独立价值 | 当前默认每日搜索 100 次，其他接口合计 10,000 单位；不代表播放 GB 额度 | 内容策展候选 |
| Pexels | 素材短视频与 API | 商用受内容和 API 条款限制；禁止原样独立分发、复制核心服务等 | 默认 200 次/小时、20,000 次/月；不是免费视频 CDN 容量承诺 | 创作专题素材，不直接搬成片库 |
| Pixabay | 素材视频与 API | 遵守内容许可，限制原样独立分发等 | 默认 100 次/分钟，API 结果缓存 24 小时；文档允许应用嵌入视频，但不等于任意用途获准 | 创作素材候选 |
| Filmhub | 按渠道合同选片并接收文件 | AVOD / SVOD / TVOD、地区、期限和分账单独确定 | 没有取得本项目报价或免费媒体流量承诺 | 丰富商业片库的商务候选 |
| 当前暴风接口 | HTTP 搜索详情与上游视频地址 | 未核实 | API 与媒体额度未知 | 本地技术实验 |

官方参考：[Commons](https://commons.wikimedia.org/wiki/Commons:First_steps/Reuse/en)、[YouTube 政策](https://developers.google.com/youtube/terms/developer-policies)、[YouTube 额度](https://developers.google.com/youtube/v3/getting-started)、[Pexels API](https://www.pexels.com/api/documentation/)、[Pexels 条款](https://www.pexels.com/terms-of-service/)、[Pixabay API](https://pixabay.com/api/docs/)、[Pixabay 条款](https://pixabay.com/service/terms/)。

YouTube 默认额度按本轮文档记载，未沿用旧资料把所有调用都简单视为同一个每日 10,000 单位池。无法据此保证任何地区都能顺畅访问。

## 6. 已核实可作为起点的具体作品

| 作品 | 官方许可依据 | 使用时的操作 |
| --- | --- | --- |
| Big Buck Bunny | 项目页明确 CC BY 3.0，允许商业复用与分发 | 完整播映保留完整片尾；按要求标注出处和许可，注意商标等排除项 |
| Sintel | 项目 Sharing 页明确 CC BY 3.0 与商业分发 | 播放影片保留完整片尾；按指定方式署名 |

来源：[Big Buck Bunny](https://peach.blender.org/about/)、[Sintel](https://durian.blender.org/sharing/)。

不因为软件 Blender 可商用，就把任意用 Blender 制作的动画当成可再分发。也不把所有 Blender Studio 资产视为相同许可证。增加作品应检查具体发布文件、声音、字幕、海报和署名说明。

CC 内容的用户仍享有原许可下的权利。不要加入与其许可冲突的 DRM、技术限制或额外再利用禁令。减少第三方占用你付费带宽，与宣称独占或撤销原许可是不同事情。[CC BY 3.0](https://creativecommons.org/licenses/by/3.0/)

## 7. 获取一个正式来源的实际流程

1. **从产品找内容**：确定观众、题材、地区、语言和商业模式，而不是先收集尽可能多的 URL。
2. **确认供应主体**：版权方、发行商、创作者、平台或配置维护者各能承诺什么，联系方式和授权文件是谁提供的。
3. **确认交付物**：媒体文件、海报、元数据、字幕、预告片、接口文档或官方嵌入方式。
4. **确认权利范围**：网站点播、广告、订阅、单片收费、剪辑、翻译和下载是否分别允许。
5. **确认服务条件**：API 额度、并发、地区、链接有效期、更新、撤回、支持和计费。
6. **拿小样验证**：不同集数和版本、浏览器、目标网络、播放开始及拖动；少量抽样并保存时间和结果。
7. **登记后接入**：签署或保存适用许可，导入片目和文件，配置授权门禁，设置预算。
8. **持续维护**：监测到期、撤回、文件更换、字幕修正、域名变化和质量；保留回滚与下架方式。

未知字段不填写“免费”“不限”“全球”，而记录“未确认”。

## 8. 来源台账模板

这是一份建议模型，未表示下面的权限已经取得：

```json
{
  "source_id": "supplier-example",
  "provider_contact": null,
  "discovery_url": null,
  "delivery_mode": "file_delivery_or_official_embed_or_api",
  "contract_reference": null,
  "commercial_status": "unverified",
  "license_types": [],
  "territories": [],
  "license_start": null,
  "license_end": null,
  "attribution_requirements": [],
  "subtitle_rights": "unverified",
  "metadata_artwork_rights": "unverified",
  "api_quota": null,
  "media_quota": null,
  "concurrency_limit": null,
  "allowed_media_hosts": [],
  "price_reference": null,
  "last_playback_check": null,
  "last_terms_review": null,
  "takedown_contact": null
}
```

## 9. 来源的分层质量验证

| 层 | 最小检查 | 结果记录 |
| --- | --- | --- |
| 目录 | 主页、配置地址、跳转目标 | 状态码、最终域名、时间 |
| 接口 | 有结果和无结果搜索、详情、错误输入 | 数据结构、延迟、额度响应 |
| 媒体 | 清单及少量分片、编码、跨域和有效期 | 抽样状态、哈希和编码；无需长期保存未知影片 |
| 播放 | 浏览器首帧、时间推进、声音、选集与拖动 | 截图、错误和网络环境 |
| 供应 | 许可、配额、报价、到期与支持 | 文档、合同及未解决项 |
| 运营 | 多网络实测、真实用户卡顿和成功率 | 地区、设备和来源分组指标 |

来源切换必须仍是同一获准作品和版本，不能在失败时用无关视频冒充成功。多个 API 如果依赖同一 CDN，不应算成独立冗余。
