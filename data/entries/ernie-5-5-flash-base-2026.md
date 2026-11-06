---
id: "ernie-5-5-flash-base-2026"
type: "event"
title: "百度开源文心 5.5 Flash Base：280B 稀疏 MoE、14B 激活，多基准同尺寸 SOTA"
title_en: "Baidu ERNIE 5.5 Flash Base"
date: "2026-11-05"
importance: 7
categories: [model, opensource]
summary: "11 月 5 日，百度正式开源基座模型文心 5.5 Flash Base（ERNIE 5.5 Flash Base）：采用 MoE 架构，总参数 2800 亿、每 Token 激活 140 亿，使用 33.5 万亿 Token 预训练，预训练上下文最高 128K，微调与推理支持最长 100 万 Token。官方称其在知识、推理、数学、代码、多语言与长上下文等基准上取得同尺寸模型 SOTA，超过 DeepSeek-V4-Flash-Base、Hy3-preview-Base、MiMo-V2.5-Base；模型已在 Hugging Face 开放。"
significance: "国产开源模型的竞争进入「稀疏效率」阶段：280B 总参只激活 14B，配合长上下文与多项架构优化，试图用更低推理成本逼近更大模型。百度把基座权重直接开源，会加剧与腾讯 Hy4、DeepSeek、MiniMax 等开源路线的正面竞争，也方便开发者做二次微调。"
quote: ""
speaker: ""
occasion: ""
my_comment: "同尺寸 SOTA 是官方口径，需第三方复测；100 万上下文在实际推理中的成本与有效长度仍待验证。"
tags: [国内, 百度, 文心, ERNIE, 开源, MoE, 长上下文]
sources:
  - "https://www.news.cn/info/20261105/f3bbdb6854f5441ca9fb34062f213875/c.html"
  - "https://www.qbitai.com/2026/11/507787.html"
  - "https://huggingface.co/baidu/ERNIE-5.5-Flash-Base"
relations:
  - to: "tencent-hy4-2026"
    type: "竞争"
    note: "国产开源大模型同周正面竞争"
needs_review: false
node_kind: model
added_at: "2026-11-06"
---
