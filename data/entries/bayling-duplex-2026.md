---
id: bayling-duplex-2026
type: insight
title: "BayLing-Duplex：几个特殊 token 实现全双工"
title_en: "BayLing-Duplex: Native Full-Duplex Speech Dialogue with a Single Autoregressive LLM"
date: "2026-06-12"
importance: 6
categories: [thought, agent]
summary: "BayLing-Duplex 在单个自回归 LLM 的词表中加入少量特殊 token，让模型自行决定何时听、何时说、何时停，无需外部 VAD；从 GLM-4-Voice 出发、仅 40 万条全双工样本微调，即达到 92% 轮转成功率与 100% 打断成功率。"
significance: "它说明全双工不必依赖新架构或级联模块：极小改动即可复用现有训练与推理栈，把「实时可打断」变成通用 LLM 的能力，显著降低语音 agent 的工程门槛。"
quote: "The design adds only a few special tokens to the standard vocabulary, so it transfers across LLMs and reuses existing training and serving stacks with no architectural adaptation."
speaker: "Qingkai Fang, Shoutao Guo, Yang Feng"
occasion: "论文《BayLing-Duplex: Native Full-Duplex Speech Dialogue with a Single Autoregressive LLM》（arXiv:2606.14528，2026-06-12）"
my_comment: "最「不创新」的方案反而最有工程杀伤力：把交互控制塞进词表，其余全部复用。"
tags: [full-duplex, llm, speech, token]
sources:
  - "https://arxiv.org/abs/2606.14528"
  - "https://github.com/BayLing-Models/BayLing-Duplex"
relations: []
added_at: 2026-10-29
needs_review: false
node_kind: paper
thought_chain: interaction
thought_role: advance
thought_claim: "不改架构，几个特殊 token 就能让 LLM 学会抢答"
thought_summary: "在标准词表里加入少量特殊 token，让单个自回归 LLM 自主决定听、说、停；仅 40 万条全双工样本微调即达到 92% 轮转与 100% 打断成功率，且可迁移到不同 LLM。"
---

## 背景

此前的全双工方案多依赖新架构、外部 VAD 或双模型级联：要么训练成本高，要么交互仍被回合边界限制。一个自然的问题是：能不能用现成 LLM 直接做到边听边说？

## 核心观点

BayLing-Duplex 只做了一件小事：在标准词表中加入少量特殊 token，让单个自回归 LLM 自己决定何时听、何时说、何时停。从公开的 GLM-4-Voice 出发，仅用 40 万条全双工样本微调并做轻量 DPO，就达到 92% 轮转成功与 100% 打断成功，同时保持原模型的回答质量。

## 为什么今天还要读

它证明全双工不是架构问题，而是「控制信号如何进入词表」的问题：极小改动即可复用现有训练与推理栈。对工程团队而言，这意味着实时语音能力可以低成本增量获得，而不必重训一个模型；论文同时开源模型与代码，也降低了复现门槛。