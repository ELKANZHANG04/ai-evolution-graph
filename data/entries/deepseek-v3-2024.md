---
id: deepseek-v3-2024
type: event
title: "DeepSeek-V3 发布：低成本前沿 MoE 模型"
title_en: "DeepSeek-V3"
date: "2024-12-26"
importance: 8
categories: [opensource, model]
summary: "深度求索发布并开源 671B 参数（每 token 激活 37B）的 MoE 模型 DeepSeek-V3，训练仅用约 278.8 万 H800 GPU 小时、成本约 557.6 万美元，性能接近当时顶级闭源模型。"
significance: "V3 以极低训练成本追平前沿闭源模型，证明工程效率与 MoE 架构可以大幅压缩算力门槛，直接改变了行业对「前沿模型需要多少资本」的预期。其开放权重也加速了全球开源模型竞赛，为一年后的 R1 铺路。"
quote: ""
speaker: ""
occasion: ""
my_comment: "557 万美元这个数字对行业的冲击，比榜单分数更大：它把「前沿」从资本神话拉回了工程问题。"
tags: [deepseek, moe, open-source, cost-efficiency]
sources:
  - "https://arxiv.org/abs/2412.19437"
  - "https://github.com/deepseek-ai/DeepSeek-V3"
relations:
  - to: gpt-4o-2024
    type: 竞争
    note: "能力对标 GPT-4o 级别，同时以训练成本优势直接竞争"
  - to: "deepseek-r1-2025"
    type: "奠基"
    note: "DeepSeek-R1 以 DeepSeek-V3 为基座"
mainline: true
needs_review: false
node_kind: model
---
