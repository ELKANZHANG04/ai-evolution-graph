---
id: llada-diffusion-2025
type: insight
title: "LLaDA：扩散语言模型挑战自回归"
title_en: "Large Language Diffusion Models"
date: "2025-02-14"
importance: 6
categories: [thought, architecture]
summary: "研究团队提出 LLaDA：从零训练、用前向掩码与反向生成的扩散语言模型；8B 版本在通用、数学、代码任务上与自建自回归基线相当，SFT 后可多轮对话，并在「逆转诅咒」任务上超过 GPT-4o。"
significance: "它用「非自回归也能 scaling」挑战了 LLM 能力依赖自回归的默认假设，为扩散语言模型提供了 8B 级证据。此后扩散 LM 成为架构讨论中的活跃分支，也直接影响 agent 规划与可编辑生成的研究路线。"
quote: "The capabilities of large language models (LLMs) are widely regarded as relying on autoregressive models (ARMs). We challenge this notion by introducing LLaDA, a diffusion model trained from scratch under the pre-training and supervised fine-tuning (SFT) paradigm."
speaker: "Shen Nie et al."
occasion: "论文《Large Language Diffusion Models》（arXiv:2502.09992，2025-02-14）"
my_comment: "「语言模型必须自回归」可能只是路径依赖，而不是规律。"
tags: [llada, diffusion-language-model, architecture, non-autoregressive]
sources:
  - "https://arxiv.org/abs/2502.09992"
relations:
  - to: transformer-2017
    type: 基于
    note: "扩散过程仍由 Transformer 参数化，用于预测被掩码的 token"
needs_review: false
node_kind: paper
innovation: true
maturity: paper
why_underrated: "扩散语言模型常被当成「生成速度技巧」，但它真正动摇的是「语言模型必须自回归」这一架构前提。"
thought_chain: architecture
thought_role: revision
thought_claim: "语言模型不必自回归：扩散也能 scaling"
thought_summary: "LLaDA 从零训练 8B 扩散语言模型，用掩码与反向生成替代自回归，在多项任务上追平自建 AR 基线并展现指令跟随能力，证明核心能力不必依赖自回归。"
---

## 背景

自回归几乎是 LLM 的默认架构假设：GPT、Llama、Claude 都逐 token 生成。扩散模型在图像与视频上大获成功，但在语言上长期缺乏「能从零预训练、规模可扩展」的证据，因此被普遍视为次优路线。

## 核心观点

LLaDA 采用前向掩码、反向生成的过程：模型学习预测被掩码的 token，并通过优化似然下界进行概率推断。作者从零预训练 8B 模型，在通用、数学、代码等基准上与自建自回归基线表现相当；SFT 后具备多轮对话能力，并在「逆转诅咒」这类任务上超过 GPT-4o。结论很直接：上述核心能力并不必然依赖自回归结构。

## 为什么今天还要读

它把「架构多样性」重新带回语言模型讨论：如果非自回归也能 scaling，那么生成顺序、并行解码与编辑式生成都会成为可探索空间。2026 年关于扩散语言模型 agent 的研究（可编辑计划、元认知解码）正是在这条线上延伸，而 LLaDA 是这条线最关键的规模化证据。
