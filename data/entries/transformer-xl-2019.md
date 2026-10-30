---
id: transformer-xl-2019
type: event
title: "Transformer-XL：让 Transformer 记住上一段"
title_en: "Transformer-XL: Attentive Language Models Beyond a Fixed-Length Context"
date: "2019-01-09"
importance: 6
categories: [architecture, model]
summary: "Dai 等提出 Transformer-XL：用段级递归缓存前文隐状态并引入相对位置编码，让 Transformer 在固定窗口之外继续利用历史，在长文本语言建模上把 enwik8 的 bpc 降到 0.99。"
significance: "它第一次系统回答「Transformer 如何记住上一段」，是长上下文建模的起点之一。此后的长上下文、检索增强与记忆系统，都在回答同一个问题：模型的状态该存在哪里。"
quote: ""
speaker: ""
occasion: ""
my_comment: "Transformer-XL 把「记忆」做成了可训练的缓存，而不是提示词里硬塞的历史。"
tags: [transformer-xl, long-context, language-model, memory]
sources:
  - "https://arxiv.org/abs/1901.02860"
relations: []
needs_review: false
thought_chain: memory
thought_role: advance
---

## 背景

标准 Transformer 只能看固定长度的窗口。处理长文档时，通常把文本切成互不重叠的片段分别训练，片段之间没有信息流动，模型很难理解跨段的指代与叙事。

## 核心观点

Transformer-XL 引入段级递归：计算当前段时，缓存前一段各层的隐状态并作为额外上下文参与注意力，同时用相对位置编码解决缓存带来的位置错乱。它学到比 RNN 长 80%、比标准 Transformer 长 450% 的依赖，并在 enwik8 上把 bpc 降到 0.99。

## 为什么今天还要读

它开启了「模型可以拥有外部化状态」的思路：记忆不必塞进参数，也可以是显式缓存。今天的长上下文模型与 agent 记忆系统，仍在沿着这条线改进——存什么、怎么取、何时忘。
