---
id: tree-of-thought-2023
type: event
title: "Tree of Thoughts：把推理变成搜索"
title_en: "Tree of Thoughts: Deliberate Problem Solving with Large Language Models"
date: "2023-05-17"
importance: 6
categories: [model, thought]
summary: "Yao 等提出 Tree of Thoughts：让模型生成多个「思维」候选并搜索、评估、回溯，把推理从单条链变成可探索的树；在 Game of 24 上把成功率从思维链的约 4% 提升到 74%。"
significance: "它把推理看作搜索问题，证明「多花推理算力 + 有结构的探索」能显著提升复杂任务表现，是后来 test-time compute 路线的早期实证。它也提示：模型能力之外，推理过程的组织方式本身是新的设计维度。"
quote: ""
speaker: ""
occasion: ""
my_comment: "ToT 的意义不是「提示词技巧」，而是它把推理开销从固定成本变成了可调变量。"
tags: [tree-of-thoughts, reasoning, search, test-time-compute]
sources:
  - "https://arxiv.org/abs/2305.10601"
relations: []
needs_review: false
thought_chain: generative-decision
thought_role: advance
---

## 背景

思维链（Chain of Thought）让模型一步步写推理，但只有一条路径：一旦早先的推理走偏，后面只会越错越远。对于需要试探、回退、比较方案的题（如 24 点），单链推理的通过率很低。

## 核心观点

Tree of Thoughts 让模型在每一步生成多个候选「思维」，由模型自己评估哪些值得继续，允许前瞻与回溯，最终在一棵搜索树上选择最优路径。配合搜索算法，它把 Game of 24 的成功率从思维链的约 4% 提升到 74%。

## 为什么今天还要读

它是「推理时计算」这条路线的早期实证：同样的模型，多花一些推理预算并组织成搜索，能力就能显著提升。今天 o1 类模型的 test-time scaling，本质上是把这种搜索内化进模型训练里。
