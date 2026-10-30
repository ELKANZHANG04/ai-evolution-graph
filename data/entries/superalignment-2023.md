---
id: superalignment-2023
type: event
title: "OpenAI 提出 Superalignment 计划"
title_en: "Introducing Superalignment"
date: "2023-07-05"
importance: 7
categories: [alignment, org]
summary: "OpenAI 宣布成立 Superalignment 团队，由 Ilya Sutskever 与 Jan Leike 共同领导，计划在四年内投入 20% 已获算力，训练一个「自动对齐研究员」来监督比人类更聪明的模型。"
significance: "它把「如何监督比人更强的模型」从论文问题提升为有团队、有预算、有时间表的工程目标，让可扩展监督（scalable oversight）成为对齐研究的主线之一。团队后来因核心成员离职而解散，但这条问题意识延续到了弱监督强模型、思维链监控与可扩展监督评估等工作中。"
quote: ""
speaker: ""
occasion: ""
my_comment: "四年、20% 算力、一个自动对齐研究员——目标宏大，但它第一次让「对齐」看起来像正经的研发项目而不是伦理附录。"
tags: [superalignment, scalable-oversight, alignment, openai]
sources:
  - "https://openai.com/index/introducing-superalignment/"
relations:
  - to: rlhf-instructgpt-2022
    type: 基于
    note: "指出 RLHF 依赖人类监督，无法扩展到超智能模型"
needs_review: false
node_kind: concept
thought_chain: alignment
thought_role: advance
thought_claim: "对齐要抢在超智能出现之前，用 AI 监督 AI"
thought_summary: "当模型比人更聪明，人类反馈式监督会失效；OpenAI 提出训练自动对齐研究员、用算力规模化对齐研究，并给出四年路线。它把可扩展监督从概念变成有组织的工程目标。"
---

## 背景

RLHF 之所以有效，前提是人类能判断模型行为好不好。但如果模型在复杂任务上远超人类，人就只能「弱监督」：看得懂结果、却判断不了过程是否正确。超级对齐要解决的正是这个监督缺口。

## 核心观点

OpenAI 的方案不是等一个更强的监督者，而是先训练一个「自动对齐研究员」：用 AI 辅助评估 AI（可扩展监督）、自动化红队与可解释性做验证、再用故意训练出的失配模型做端到端压力测试。计划四年内投入 20% 已获算力，并明确承认目前没有可行解。

## 为什么今天还要读

它定义了此后几年对齐研究的议程与词汇（可扩展监督、泛化、对抗测试），也暴露出一个至今未解的张力：把对齐交给 AI，等于把最需要信任的问题交给最需要被监督的系统。团队解散后，这条路线以更分散的形式继续存在。

