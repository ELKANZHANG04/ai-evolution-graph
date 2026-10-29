---
id: nested-learning-2025
type: insight
title: "Nested Learning：把持续学习写成嵌套优化"
title_en: "Nested Learning: The Illusion of Deep Learning Architectures"
date: "2025-11-25"
importance: 6
categories: [thought, model]
summary: "Google Research 提出 Nested Learning：把模型表示为一组嵌套、多层、可并行的优化问题，每层有自己的上下文流与更新频率；由此引出更表达性的优化器、可自我修改的序列模型与「连续记忆系统」，并组合成 Hope 模块。"
significance: "它把持续学习从「外挂记忆/RAG」拉回模型内部：不同更新频率的层构成连续记忆，使模型能在使用中沉淀经验。若路线成立，将改变「训练截止即冻结」这一大模型的基本假设。"
quote: "NL suggests a philosophy to design more expressive learning algorithms with more levels, resulting in higher-order in-context learning and potentially unlocking effective continual learning capabilities."
speaker: "Ali Behrouz et al.（Google Research）"
occasion: "Google Research 博客《Introducing Nested Learning》（2025 年 11 月）；论文 arXiv:2512.24695（NeurIPS 2025）"
my_comment: "外挂记忆是给失忆者配笔记本；嵌套学习想做的，是让大脑本身重新长出海马体。"
tags: [continual-learning, nested-learning, memory, hope]
sources:
  - "https://arxiv.org/abs/2512.24695"
  - "https://research.google/blog/introducing-nested-learning-a-new-ml-paradigm-for-continual-learning/"
relations: []
thought_pin: top
needs_review: true
node_kind: paper
innovation: true
maturity: prototype
why_underrated: "「持续学习」长期被外挂记忆绕过；把优化器/记忆/模型统一成嵌套优化，是一条少人走的底层路线。"
thought_chain: memory
thought_role: thesis
thought_claim: "持续学习不是外挂记忆，而是多层嵌套优化"
thought_summary: "把模型重写成嵌套多层的优化问题，每层有不同更新频率与上下文流；由此得到更表达性的优化器、自修改序列模型与连续记忆系统，并用 Hope 模块验证持续学习能力。"
---

## 背景

大模型的知识在预训练结束时就冻结：上下文窗口像短期记忆，外挂 RAG 像笔记本，模型参数本身并不会因使用而改变。持续学习因此常成为「看起来能记、其实没学会」的工程幻觉。

## 核心观点

Nested Learning 把模型重新表述为一组嵌套、多层、可并行的优化问题，每层有自己的上下文流与更新频率。由此得到三点：Adam/SGD 等优化器本质是压缩梯度的联想记忆；可自我修改的序列模型能学习自己的更新规则；「连续记忆系统」把长/短期记忆推广为多时间尺度。组合成 Hope 模块后，在语言建模、知识注入与少样本泛化上表现良好。

## 为什么今天还要读

它把持续学习从外挂记忆拉回模型内部，直指「训练截止即冻结」这一基本假设。若这条路走通，个性化 AI 与终身学习将不再依赖检索，而是模型真的在变。