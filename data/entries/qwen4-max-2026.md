---
id: "qwen4-max-2026"
type: "event"
title: "阿里发布 Qwen4-Max：2.4T 参数/71B 激活，原生视觉 + 百万上下文"
title_en: "Alibaba Qwen4-Max"
date: "2026-11-16"
importance: 7
categories: [model, agent]
summary: "11 月 16 日，阿里巴巴发布新一代基座大模型 Qwen4-Max：总参数 2.4T、每 Token 仅激活 71B（较上代少 25%），原生视觉能力、支持百万上下文；采用基于 Qwen 稀疏注意力（QSA）的 MoE 架构。官方称 CodeArena 全球前端编程盲测第 6，Agents' Last Exam、Vals Index 等智能体/专业任务评测领先；Terminal-Bench 4.0 同档思考下 Token 用量从 289K 降至 151K、得分从 38.9 升至 48.5。Qwen4-Max 已在千问 AI 平台提供 API（缓存命中 0.5 元/百万 Token），单任务平均费用较上代降 6 成，接入千问办公、Qoder、千问 App；中小尺寸模型将陆续开源。"
significance: "国产旗舰模型开始用「更少激活 + 更少 Token」竞争，而不是单纯堆参数：2.4T/71B、百万上下文、原生视觉与 Agent/编程能力一起升级，目标从聊天转向真实全场景任务。API 降价 6 成也会直接压到同行定价与推理算力需求，Qwen4 系列后续开源则可能重塑国产开源模型格局。"
quote: ""
speaker: ""
occasion: ""
my_comment: "CodeArena 第 6、ALE/Vals 领先均为官方口径，需第三方复测；百万上下文的实际有效长度与缓存计费细则要看 API 文档。"
tags: [国内, 阿里, 通义千问, Qwen4-Max, 万亿参数, 智能体, 编程]
sources:
  - "https://www.alibabacloud.com/en/press-room/alibaba-unveils-qwen4-max"
  - "https://www.qbitai.com/2026/11/510486.html"
relations:
  - to: "qwen-2023"
    type: "基于"
    note: "通义千问系列从 Qwen 起步，迭代到 Qwen4-Max"
needs_review: false
node_kind: model
added_at: "2026-11-17"
---
