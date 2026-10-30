---
id: flash-attention-2022
type: event
title: "FlashAttention：IO 感知的精确注意力"
title_en: "FlashAttention: Fast and Memory-Efficient Exact Attention with IO-Awareness"
date: "2022-05-27"
importance: 6
categories: [architecture, hardware]
summary: "Tri Dao 等提出 FlashAttention：用 tiling 把注意力计算切块，减少 GPU HBM 与片上 SRAM 之间的读写，在保持精确注意力的同时把 BERT-large 端到端训练提速 15%、GPT-2 提速 3 倍，并支持更长上下文。"
significance: "它把「注意力效率」从算法问题变成 IO 工程问题，证明不近似也能大幅提速；此后 FlashAttention 成为主流训练与推理栈的默认实现，也让长上下文模型的成本曲线整体下移。"
tags: [flash-attention, io-awareness, attention, efficiency]
sources:
  - "https://arxiv.org/abs/2205.14135"
relations:
  - to: transformer-2017
    type: 基于
    note: "优化的是 Transformer 的自注意力计算"
needs_review: false
node_kind: paper
thought_chain: architecture
thought_role: advance
thought_claim: "不近似也能让注意力更快：优化显存读写而非数学"
thought_summary: "FlashAttention 通过分块与 IO 感知，减少 GPU 显存读写，在保持精确注意力前提下显著提速并支持更长上下文，成为此后注意力实现的事实标准。"
---
