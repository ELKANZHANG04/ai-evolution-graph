---
id: rl-scaling-2025
type: insight
title: "RL Scaling：把强化学习训练变成可预测曲线"
title_en: "The Art of Scaling Reinforcement Learning Compute for LLMs"
date: "2025-10-15"
importance: 6
categories: [thought, model]
summary: "研究团队用 40 万+ GPU 小时系统研究 LLM 强化学习的 scaling：拟合 S 形算力—性能曲线，发现多数设计选择只影响算力效率而不改变渐近性能，并提出可外推的最佳实践配方 ScaleRL。"
significance: "它把 RL 训练从「炼丹」推向可预测的 scaling 科学，补上了预训练 scaling law 之外的关键缺口。对 2025 年后以 RL 为主的推理模型训练，这意味着算力投入与配方选择可以更早被估算和比较。"
quote: "We present the first large-scale systematic study, amounting to more than 400,000 GPU-hours, that defines a principled framework for analyzing and predicting RL scaling in LLMs."
speaker: "Devvrit Khatri et al."
occasion: "论文《The Art of Scaling Reinforcement Learning Compute for LLMs》（arXiv:2510.13786，2025-10-15）"
my_comment: "预训练教会我们「loss 可预测」，现在 RL 也开始有自己的对数直线了。"
tags: [rl-scaling, reinforcement-learning, scaling-laws, post-training]
sources:
  - "https://arxiv.org/abs/2510.13786"
relations:
  - to: o1-2024
    type: 启发
    note: "承接 o1 开启的强化学习推理训练路线，为其提供 scaling 方法论"
needs_review: false
node_kind: paper
thought_chain: scaling
thought_role: advance
thought_claim: "RL 训练也能像预训练一样，用 scaling 曲线预测"
thought_summary: "研究以 40 万 GPU 小时拟合 RL 的 S 形 scaling 曲线，发现多数设计选择只改变算力效率，并给出可外推的 ScaleRL 配方，把 RL 训练推向可预测。"
---

## 背景

预训练有成熟的 scaling law，但 2025 年推理模型让 RL 训练成为主要成本项：算力预算暴涨，却缺少「投入多少、能换多少性能」的可预测方法论。多数 RL 配方只能靠试错比较，难以判断是算法更好还是算力更多。

## 核心观点

这项研究投入 40 万+ GPU 小时，拟合出 RL 训练的 S 形算力—性能曲线，并系统消融常见设计选择。关键发现有三点：不同配方的渐近性能并不相同；损失聚合、归一化、课程与 off-policy 等细节主要影响算力效率，而不显著改变渐近上限；稳定可扩展的配方具有可预测轨迹，能从小规模外推。基于此提出的 ScaleRL 配方，在单次 10 万 GPU 小时的 RL 训练上成功预测了验证性能。

## 为什么今天还要读

它补上了「后训练时代的 scaling law」：当模型能力越来越依赖 RL 而非预训练，能否预测 RL 的投入产出将直接决定算力预算与路线选择。它也提示一种新的研究纪律——先问「这是算法优势还是算力优势」，再谈配方优劣。
