---
id: scaling-laws-2020
type: event
title: "Scaling Laws：规模的幂律"
title_en: "Scaling Laws for Neural Language Models"
date: "2020-01-23"
importance: 9
categories: [model]
summary: "OpenAI 团队发现语言模型损失随参数量、数据量与计算量呈平滑幂律下降，并给出固定算力预算下的最优规模分配方案。"
significance: "Scaling Laws 把「加大模型」从经验直觉变成可外推的工程科学：训练前就能预测更大模型的性能与算力需求。它直接支撑了 GPT-3 级别的参数竞赛，也启发了后续 Chinchilla 对「数据相对不足」的重要修正。"
quote: ""
speaker: ""
occasion: ""
my_comment: "一张 loss 对算力的对数直线图，比任何单点架构创新都更深刻地改变了 2020 年后的 AI 投资决策。"
tags: [scaling-laws, power-law, compute, language-model]
sources:
  - "https://arxiv.org/abs/2001.08361"
relations:
  - to: sutton-bitter-lesson-2019
    type: 启发
    note: "「通用方法 × 算力」的实证化；思想脉络上呼应《苦涩的教训》（非直接引用）"
mainline: true
needs_review: false
node_kind: paper
---
