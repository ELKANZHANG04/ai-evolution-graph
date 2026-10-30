---
id: mixtral-moe-2024
type: event
title: "Mixtral 8x7B：开源 MoE 复兴"
title_en: "Mixtral of Experts"
date: "2024-01-08"
importance: 6
categories: [architecture, opensource]
summary: "Mistral 开源 Mixtral 8x7B：每层 8 个前馈专家、每个 token 路由 2 个，总参数 47B、激活 13B；Apache 2.0 许可、32k 上下文，在多数基准上匹配或超过 Llama 2 70B 与 GPT-3.5。"
significance: "Mixtral 把稀疏 MoE 带入开源主流，确立了「大总参数量 + 小激活量」的效率路线。此后 DeepSeek-V3、Llama 4、Qwen 等前沿开源模型几乎都采用 MoE，MoE 也从「工程技巧」变成主流架构选择。"
tags: [mixtral, moe, mistral, sparse]
sources:
  - "https://arxiv.org/abs/2401.04088"
  - "https://mistral.ai/news/mixtral-of-experts/"
relations:
  - to: transformer-2017
    type: 基于
    note: "以 Transformer 层为单位把前馈层替换为稀疏专家"
needs_review: false
node_kind: paper
thought_chain: architecture
thought_role: advance
thought_claim: "总参数可以很大，但每个 token 只激活一小部分"
thought_summary: "Mixtral 用每 token 路由两个专家的稀疏 MoE，实现 47B 总参数、13B 激活，在开源模型中追平更大稠密模型，开启 2024 年后的 MoE 主流化。"
---
