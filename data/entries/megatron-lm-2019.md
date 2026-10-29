---
id: megatron-lm-2019
type: event
title: "Megatron-LM 模型并行"
title_en: "Megatron-LM: Training Multi-Billion Parameter Language Models Using Model Parallelism"
date: "2019-09-17"
importance: 6
categories: [model, architecture]
summary: "NVIDIA 提出 Megatron-LM：用模型并行在 512 块 GPU 上训练 83 亿参数的 Transformer 语言模型，验证了并行训练扩张模型规模的可行性。"
significance: "Megatron-LM 给出了大模型训练工程化的早期模板，模型并行、数据并行与流水并行的组合此后成为训练千亿级模型的标配。它把「规模即能力」从论文猜想变成可复现的工程实践。"
quote: ""
speaker: ""
occasion: ""
my_comment: "大模型竞争的一半在算法，另一半在如何让几千块 GPU 不闲着。"
tags: [megatron, model-parallel, scaling, nvidia]
sources:
  - "https://arxiv.org/abs/1909.08053"
relations:
  - to: transformer-2017
    type: 基于
    note: "以 Transformer 解码器堆叠为网络主体，做模型并行切分"
needs_review: false
node_kind: model
---
