---
id: weak-to-strong-2023
type: event
title: "弱监督强模型：Weak-to-Strong Generalization"
title_en: "Weak-to-Strong Generalization: Eliciting Strong Capabilities With Weak Supervision"
date: "2023-12-14"
importance: 7
categories: [alignment, model]
summary: "OpenAI 发表 Weak-to-Strong Generalization：用弱模型（如 GPT-2 级）产生的标签微调强模型（GPT-4 级）时，强模型仍能持续超过弱监督者；但仅靠朴素微调远未恢复强模型的全部能力。"
significance: "它把「超人类模型只能被弱监督」这个抽象担忧变成了可复现、可度量的实验范式：强弱差距多大、用什么损失函数能补回多少，都能在今天的模型上研究。该设定此后成为可扩展监督与对齐评估的标准测试床。"
quote: ""
speaker: ""
occasion: ""
my_comment: "这篇论文的巧妙之处是把「未来问题」搬到现在：不用等超智能，用 GPT-2 监督 GPT-4 就能预演。"
tags: [weak-to-strong, scalable-oversight, alignment, openai]
sources:
  - "https://arxiv.org/abs/2312.09390"
relations:
  - to: superalignment-2023
    type: 启发
    note: "为超级对齐计划中的可扩展监督提供第一个实证测试床"
  - to: rlhf-instructgpt-2022
    type: 基于
    note: "直接针对 RLHF 依赖人类可靠监督这一前提"
needs_review: false
node_kind: paper
thought_chain: alignment
thought_role: advance
thought_claim: "弱监督能引出强能力，但距离恢复全部能力还很远"
thought_summary: "用弱模型标签微调强模型，强模型能超过弱监督者；但朴素微调只能恢复部分能力，加入辅助置信损失等简单方法可显著改善。它给出了研究超人类对齐的可操作实验范式。"
---

## 背景

如果未来模型在复杂任务上远超人类，人类标注就成了瓶颈：我们只能给出弱监督信号。OpenAI 用一个类比在今天的模型上研究这个问题——让弱模型监督强模型。

## 核心观点

实验覆盖 NLP、国际象棋与奖励建模：用 GPT-2 级监督者微调 GPT-4 级模型，强模型在多数任务上超过弱监督者，即「弱到强泛化」。但这远不是全部能力：朴素微调后仍有明显差距，而辅助置信损失等简单技巧能显著缩小差距，提示监督信号的组织方式本身可以研究、可以改进。

## 为什么今天还要读

可扩展监督从口号变成了可测量的曲线：给定弱监督者，强模型能恢复多少。今天讨论「用 AI 评估 AI」时，绕不开这个测试床，也绕不开它的结论——弱监督有希望，但还远不够。

