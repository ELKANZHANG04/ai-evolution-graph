---
id: mamba-ssm-2023
type: event
title: "Mamba：选择性状态空间模型"
title_en: "Mamba: Linear-Time Sequence Modeling with Selective State Spaces"
date: "2023-12-01"
importance: 6
categories: [architecture]
summary: "Albert Gu 与 Tri Dao 提出 Mamba：让 SSM 参数随输入变化（选择性），并用硬件感知的并行算法在循环模式下计算；模型不含注意力与 MLP，推理吞吐为 Transformer 的 5 倍、序列长度线性扩展，3B 版本匹配两倍大小的 Transformer。"
significance: "Mamba 是 Transformer 之后最受关注的替代主干之一，带动 SSM 与混合架构研究；它也代表了「用新结构换长序列效率」这条与注意力优化并行的竞争路线。"
tags: [mamba, state-space-model, architecture, long-context]
sources:
  - "https://arxiv.org/abs/2312.00752"
relations: []
needs_review: false
node_kind: paper
thought_chain: architecture
thought_role: advance
thought_claim: "序列建模不一定需要注意力：状态空间模型也能线性扩展"
thought_summary: "Mamba 用输入相关的选择性 SSM 与硬件感知并行算法，在无注意力结构下实现线性复杂度与高吞吐，成为 Transformer 之外的重要主干候选。"
---
