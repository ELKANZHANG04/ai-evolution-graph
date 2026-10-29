---
id: attention-is-all-you-need-2017
type: insight
title: "Transformer 论文的架构宣言"
title_en: "Attention Is All You Need"
date: "2017-06-12"
importance: 7
categories: [thought]
summary: "Google 团队在《Attention Is All You Need》中提出 Transformer，主张完全基于注意力、彻底抛弃循环与卷积，在机器翻译上以更低训练成本刷新纪录。"
significance: "这篇论文把「注意力」从辅助组件变成唯一主干，用一个可高度并行的通用架构取代了序列建模的旧范式和大量手工归纳偏置。它成为此后几乎所有大模型的共同底座，也是「结构让位于算力与数据」这一方法论的关键转折。"
quote: "We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely."
speaker: "Ashish Vaswani et al.（Google）"
occasion: "论文《Attention Is All You Need》（arXiv:1706.03762，NeurIPS 2017）"
my_comment: "论文标题的断言「注意力就是你所需要的一切」，在此后每一块 GPU 上被反复验证。"
tags: [transformer, self-attention, architecture, nlp]
sources:
  - "https://arxiv.org/abs/1706.03762"
relations:
  - to: attention-2014
    type: 基于
    note: "继承注意力思想，但用自注意力彻底取代循环与卷积结构"
thought_chain: architecture
thought_role: thesis
thought_claim: "只要注意力，就足以取代循环与卷积"
thought_summary: "Transformer 完全基于自注意力，抛弃循环与卷积；用更通用、可并行的架构取代手工设计，换来更好的翻译质量与更低的训练成本。"
needs_review: false
node_kind: paper
---

## 背景

2017 年，序列建模仍由循环网络与卷积网络主导，注意力只是一个辅助组件。Google 团队在论文《Attention Is All You Need》中提出 Transformer，把注意力提升为唯一主干，试图回答：如果去掉循环结构，序列模型能不能更好？

## 核心观点

摘要直陈：模型「完全基于注意力机制，彻底抛弃循环与卷积」。自注意力让任意两个位置直接交互，训练可以高度并行；在 WMT 英德翻译上以 28.4 BLEU 刷新纪录，训练成本却只是当时最优模型的一小部分。它赌的是：结构上的归纳偏置并非必需品，算力与数据可以替代大量手工设计。

## 为什么今天还要读

今天几乎所有主流大模型都是 Transformer 的后代；「注意力就是一切」的断言在此后每一块 GPU 上被验证。它示范了一种方法论：当更通用、更可并行的结构出现时，应果断放弃精巧的旧结构，把复杂性交给规模去解决。
