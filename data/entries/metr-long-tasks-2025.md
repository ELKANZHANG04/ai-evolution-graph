---
id: metr-long-tasks-2025
type: insight
title: "用「能跑多久」衡量智能体能力"
title_en: "Measuring AI Ability to Complete Long Software Tasks"
date: "2025-03-18"
importance: 6
categories: [thought, agent]
summary: "METR 提出「50% 任务完成时间跨度」指标：AI 以 50% 成功率能完成的任务，对应人类完成所需的时长。测量显示前沿模型约 50 分钟，且该时间跨度自 2019 年以来约每 7 个月翻一倍。"
significance: "它把「agent 有多能干」换算成可与人类工作直接对比的连续量纲，为能力预测与危险能力评估提供了可外推的曲线。对 agent 产品而言，这意味着「能跑多久」正在取代「单步多准」成为新的验收标准。"
quote: "frontier AI time horizon has been doubling approximately every seven months since 2019, though the trend may have accelerated in 2024."
speaker: "Thomas Kwa 等（METR）"
occasion: "论文《Measuring AI Ability to Complete Long Software Tasks》，arXiv:2503.14499（2025-03-18 首次提交，NeurIPS 2025）"
my_comment: "这个指标最狠的地方在于把「智能」换算成了时间：不是模型多聪明，而是它能替你连续工作多少分钟。"
tags: [metr, time-horizon, agent, evaluation]
sources:
  - "https://arxiv.org/abs/2503.14499"
relations:
  - to: computer-use-2024
    type: 启发
    note: "为 computer-use 与 coding agent 提供统一的能力量纲"
needs_review: false
node_kind: paper
thought_chain: agents
thought_role: advance
thought_claim: "agent 的验收单位正从单步正确率变成能连续工作多久"
thought_summary: "METR 用「人类完成时长」标定 AI 能完成的任务：50% 成功率对应的时间跨度约每 7 个月翻倍，当前前沿约 50 分钟。它让 agent 能力可以跨模型、跨代际比较，也提示自主性上升带来的风险。"
---

## 背景

基准分数在涨，但「能解一道题」和「能独立完成一个项目」是两种能力。评测需要一把尺子，把 agent 的自主性换算成人类可理解的工作量。

## 核心观点

METR 招募有领域专长的标注者，测量人类完成 RE-Bench、HCAST 等任务所需时间，再测模型 50% 成功率覆盖的任务范围，得到「50% 任务完成时间跨度」。结果：前沿模型（如 Claude 3.7 Sonnet）约为 50 分钟；该指标自 2019 年以来约每 7 个月翻倍，且 2024 年可能加速。增长主要来自可靠性、纠错与工具使用，而不只是单步推理。

## 为什么今天还要读

它提供了一条可外推的能力曲线，也把 agent 评估从「做题」转向「完成工作」。对产品和安全都重要：能跑几小时的 agent 需要不同的权限设计、监控方式与责任划分。

