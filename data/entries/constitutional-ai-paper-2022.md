---
id: constitutional-ai-paper-2022
type: insight
title: "Constitutional AI：让 AI 依据原则自我监督"
title_en: "Constitutional AI: Harmlessness from AI Feedback"
date: "2022-12-15"
importance: 6
categories: [thought]
summary: "Anthropic 提出 Constitutional AI：只给模型一份原则清单，让它自我批评、修订回答，并用 AI 反馈（RLAIF）训练奖励模型，在几乎不依赖人工有害标注的情况下得到无害助手。"
significance: "宪法 AI 把「人类价值观」显式写成可审查的文本，让对齐从大量标注劳动转向规则与推理，显著降低了监督成本。它是 Claude 系列对齐路线的基础，也为「可扩展监督」这一前沿问题提供了最早的工程答案。"
quote: "As AI systems become more capable, we would like to enlist their help to supervise other AIs."
speaker: "Yuntao Bai et al.（Anthropic）"
occasion: "论文《Constitutional AI: Harmlessness from AI Feedback》（arXiv:2212.08073）"
my_comment: "把价值观写成宪法，意味着对齐讨论第一次有了可以逐条辩论的文本。"
tags: [constitutional-ai, rlaif, alignment, anthropic]
sources:
  - "https://arxiv.org/abs/2212.08073"
relations:
  - to: rlhf-instructgpt-2022
    type: 基于
    note: "沿用 RLHF 框架，但用 AI 反馈替代大部分人工有害性标注"
thought_chain: alignment
thought_role: advance
thought_claim: "不必全靠人工，让 AI 用原则监督 AI"
thought_summary: "宪法 AI 只给模型一份原则清单，让模型自我批评、修订，并用 AI 反馈训练奖励模型，实现更少人工标注下的无害助手。"
needs_review: false
node_kind: paper
---

## 背景

RLHF 依赖大量人类标注有害输出的偏好数据，成本高、速度慢，而且标注者本身也会暴露在有害内容中。Anthropic 想回答一个更前瞻的问题：当 AI 系统越来越强，能不能让 AI 参与监督 AI？

## 核心观点

论文摘要写道：随着系统能力增强，我们希望「让它们帮助监督其他 AI」。方法只给模型一份规则或原则清单（宪法），让模型对自己的回答做自我批评与修订，再用 AI 偏好训练奖励模型（RLAIF）。结果是一个「无害但不回避」的助手：面对有害请求，它会解释自己的反对理由，而不是简单拒绝；人类监督的只是原则清单本身。

## 为什么今天还要读

宪法 AI 把价值观显式写成可审查、可修改的文本，让对齐从「标注什么算坏」转向「用哪些原则推理好坏」，这是可扩展监督的核心思路。它也是 Claude 系列对齐路线的基础，至今仍是研究「如何监督超级智能」时最常被引用的工程范式之一。