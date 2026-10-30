---
id: decision-transformer-2021
type: event
title: "Decision Transformer：把决策写成序列"
title_en: "Decision Transformer: Reinforcement Learning via Sequence Modeling"
date: "2021-06-02"
importance: 6
categories: [model, agent]
summary: "Chen 等提出 Decision Transformer：把强化学习轨迹（状态、动作、回报）编码成序列，用因果 Transformer 条件在目标回报上直接预测动作，在 Atari、OpenAI Gym 等离线任务上匹配或超过无模型离线 RL 基线。"
significance: "它把「决策」重新表述为序列建模，绕过了价值函数与策略梯度的传统框架，是最早一批「用通用 Transformer 做 agent」的证据。这条路线后来与语言模型汇合，成为生成式决策与轨迹建模的源头之一。"
quote: ""
speaker: ""
occasion: ""
my_comment: "把回报当成 prompt 的一部分，是这篇论文最漂亮的一步：目标不再是训练出来的，而是「说出来的」。"
tags: [decision-transformer, offline-rl, sequence-modeling, agent]
sources:
  - "https://arxiv.org/abs/2106.01345"
relations: []
needs_review: false
thought_chain: generative-decision
thought_role: advance
---

## 背景

强化学习长期依赖价值函数与策略梯度：先估计状态价值，再改进策略。离线 RL 还要处理分布偏移，工程复杂、超参敏感，与当时正席卷 NLP 的 Transformer 范式显得格格不入。

## 核心观点

Decision Transformer 把一条轨迹表示成「回报、状态、动作」交错的序列，用带因果掩码的 Transformer 直接预测动作；只要把期望回报作为条件输入，模型就能生成达成该回报的动作序列，无需显式价值函数。

## 为什么今天还要读

它第一次严肃地回答：如果语言模型可以「给定目标生成文本」，为什么不能「给定回报生成动作」？这条「决策即生成」的思路，后来延伸为轨迹建模、世界模型与 VLA 的共同语法。
