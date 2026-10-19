# Smart Excalidraw：场景、能力与边界

固定版本：`fd139925b01ab34203510d6afa560aa56fcc3201`；核对日期：2026-10-20。

## 业务价值

将提供的内容组织成图形初稿，保留独立的文字、形状、箭头和关系，便于继续修改。适用于需求沟通、技术设计、知识整理与研究汇报。场景覆盖面与模型的理解能力、输入材料的完整性相关。

## 三类输入

| 输入 | 已有入口 | 限制 |
| --- | --- | --- |
| 文字 | 自然语言指令、粘贴文章或能力说明 | 模型上下文与输出长度制约复杂内容 |
| 文件 | `.md`、`.txt`，浏览器 FileReader 读为文本 | 前端限制 1MB；没有直接解析 Excel/PDF/DOCX 的入口 |
| 图片 | 图片数据和文字指令组成多模态请求 | 需要视觉模型，重建不保证逐像素一致 |

直接读取数据库、任意网站、整个仓库或执行外部工具，需要额外开发或先提取内容。

## 22 类图表规范

- 流程与交互：流程图、时序图、状态图、泳道图、数据流图。
- 系统与结构：架构图、网络拓扑图、UML 类图、ER 图、组织架构图、树形图。
- 知识与关系：思维导图、概念图、韦恩图。
- 时间与计划：甘特图、时间线。
- 分析与表达：鱼骨图、SWOT 分析图、金字塔图、漏斗图、矩阵图、信息图。

图种名称与视觉规范通过提示词引导模型生成 Excalidraw 基础图形。各类统计、建模与排程规则需要另行核对，不应把图形表达等同于计算结果。

## 实现链路

1. 读取内容，组织文字 / 图像消息。
2. 系统提示规定图形字段、坐标、标签、绑定；用户提示加入图表类型与业务内容。
3. `/api/generate` 以系统消息和本次输入调用 OpenAI 兼容接口或 Anthropic，SSE 返回 JSON 文本。
4. 页面尝试修复代码围栏、JSON 闭合与引号问题。箭头优化依据绑定节点的相对位置调整端点。
5. `convertToExcalidrawElements` 补全元素，Excalidraw 显示并允许手动编辑。

## 具体边界

- 箭头优化没有完整的节点重排和全局避障算法；复杂图需要精修。
- 请求没有附带当前画布与完整多轮历史；持续对话修改现有图需要扩展。
- 本地浏览器保存配置并不意味着完全离线生成。请求会经过应用服务端到达配置的模型端点；自带 Key 模式也会把配置发送给应用服务端。
- 上游只在文字来源生成后保存本地历史；文件与图片来源不应宣称同样被完整归档。
- 访问密码允许共享服务端模型配置；成熟多租户权限、计费、限流与组织协作需要额外建设。
- 图形中的主外键、消息时序、数值与业务判断需要核对。

## 本研究示例与验证范围

六个构造场景：退款流程、系统架构、项目能力树、数据关系、缓存思维导图、四周计划。示例由研究者编写，真实集成 Excalidraw 0.18.0 渲染、编辑与导出。未配置模型，未测量 AI 生成速度、成功率或效果优劣。

## 可扩展场景

可扩展数据接入、行业模板、持续改图、团队协作和业务闭环，也可将本研究仓库的项目资料整理为能力地图。具体素材、目标效果和必要开发条件见 [extensions.md](extensions.md)。这些为扩展建议，不代表上游已有自动数据库 / 仓库读取、协作或工具执行功能。

## 主要来源与证据

- [输入实现](https://github.com/liujuntao123/smart-excalidraw-next/blob/fd139925b01ab34203510d6afa560aa56fcc3201/components/Chat.jsx)
- [图表目录](https://github.com/liujuntao123/smart-excalidraw-next/blob/fd139925b01ab34203510d6afa560aa56fcc3201/lib/constants.js)
- [提示词与视觉规范](https://github.com/liujuntao123/smart-excalidraw-next/blob/fd139925b01ab34203510d6afa560aa56fcc3201/lib/prompts.js)
- [生成接口](https://github.com/liujuntao123/smart-excalidraw-next/blob/fd139925b01ab34203510d6afa560aa56fcc3201/app/api/generate/route.js)
- [箭头优化](https://github.com/liujuntao123/smart-excalidraw-next/blob/fd139925b01ab34203510d6afa560aa56fcc3201/lib/optimizeArrows.js)
- [画布组件](https://github.com/liujuntao123/smart-excalidraw-next/blob/fd139925b01ab34203510d6afa560aa56fcc3201/components/ExcalidrawCanvas.jsx)
- [模型适配](https://github.com/liujuntao123/smart-excalidraw-next/blob/fd139925b01ab34203510d6afa560aa56fcc3201/lib/llm-client.js)
- [主页面与历史处理](https://github.com/liujuntao123/smart-excalidraw-next/blob/fd139925b01ab34203510d6afa560aa56fcc3201/app/page.js)

版本、文件哈希与快照见 [references/sources.json](references/sources.json)。
