---
id: sleep-time-compute-2025
type: insight
title: "Sleep-time Compute：把思考放到离线"
title_en: "Sleep-time Compute: Beyond Inference Scaling at Test-time"
date: "2025-04-17"
importance: 6
categories: [thought, model]
summary: "论文提出 sleep-time compute：在用户提问之前，模型先离线「思考」上下文、预计算可能用到的量，从而大幅降低测试时算力；在两套有状态推理任务上，同等准确率所需测试时算力可降约 5 倍。"
significance: "它把「算力何时花」变成可优化维度：测试时计算不是唯一解，离线预计算可以在不牺牲准确率的情况下摊薄成本。这对常驻 agent 与长上下文产品尤其重要，也补充了 test-time scaling 的叙事。"
quote: "We introduce sleep-time compute, which allows models to \"think\" offline about contexts before queries are presented: by anticipating what queries users might ask and pre-computing useful quantities, we can significantly reduce the compute requirements at test-time."
speaker: "Kevin Lin et al.（UC Berkeley）"
occasion: "论文《Sleep-time Compute: Beyond Inference Scaling at Test-time》（arXiv:2504.13171，2025-04-17）"
my_comment: "人靠睡眠巩固记忆，模型靠离线预计算省钱——同一个「把计算挪到闲时」的直觉。"
tags: [sleep-time-compute, inference, test-time, agent]
sources:
  - "https://arxiv.org/abs/2504.13171"
  - "https://github.com/letta-ai/sleep-time-compute"
relations:
  - to: o1-2024
    type: 启发
    note: "受 o1 类 test-time compute 路线启发，但把算力挪到查询到来之前"
needs_review: false
node_kind: paper
innovation: true
maturity: paper
why_underrated: "把思考挪到离线预计算，改变的是「算力何时花」而非「花多少」，这个视角在推理竞赛中被忽视。"
thought_chain: memory
thought_role: advance
thought_claim: "把思考放到离线：睡眠时计算换测试时算力"
thought_summary: "在查询到来前离线思考上下文、预计算可能用到的量，测试时直接复用：同等准确率所需测试时算力约降 5 倍，多个相关查询还可摊薄成本。"
---

## 背景

test-time compute 提升了推理能力，但代价是延迟与推理成本：每个问题都要现场思考。而很多场景中，用户的问题在提问前就可被部分预判——上下文已经给出线索。

## 核心观点

论文提出 sleep-time compute：模型在查询到来前先离线思考上下文，预测用户可能问什么并预计算有用量，测试时直接复用。在两套有状态推理任务上，达到同等准确率所需测试时算力减少约 5 倍；把离线计算摊到多个相关查询上，平均单查询成本还能再降 2.5 倍。查询越可预测，收益越大。

## 为什么今天还要读

它把「算力何时花」变成与「花多少」同等重要的设计维度，为常驻 agent 与长上下文产品提供了新的成本模型。在推理成本成为产品生死线的今天，这个被忽视的方向可能比再涨一点准确率更有价值。