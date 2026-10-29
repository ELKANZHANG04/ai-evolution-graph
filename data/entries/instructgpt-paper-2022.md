---
id: instructgpt-paper-2022
type: insight
title: "InstructGPT：更大不等于更对齐"
title_en: "Training language models to follow instructions with human feedback"
date: "2022-03-04"
importance: 7
categories: [thought]
summary: "OpenAI 的 InstructGPT 论文开门见山：把语言模型做大并不能让它更好地遵循用户意图；用人类反馈微调后，13 亿参数版本在人类评估中胜过 1750 亿参数的 GPT-3。"
significance: "这篇论文把 RLHF 确立为大模型后训练的标配，也是 ChatGPT 成功的关键工程基础。它第一次用实验说明：对齐不是能力之后的附加项，而是决定模型能否被使用的核心能力。"
quote: "Making language models bigger does not inherently make them better at following a user's intent."
speaker: "Long Ouyang et al.（OpenAI）"
occasion: "论文《Training language models to follow instructions with human feedback》（arXiv:2203.02155）"
my_comment: "「小 100 倍却更受欢迎」是整篇论文最有力的一句话：用户要的是听话，不是参数量。"
tags: [instructgpt, rlhf, alignment, openai]
sources:
  - "https://arxiv.org/abs/2203.02155"
relations:
  - to: gpt-3-2020
    type: 基于
    note: "在 GPT-3 上用人类示范做监督微调，再用人类偏好做 RLHF"
thought_chain: alignment
thought_role: thesis
thought_claim: "更大不等于更听话，对齐才是关键"
thought_summary: "InstructGPT 用人类示范与偏好排序微调 GPT-3；13 亿参数版本在人类评估中胜过 1750 亿版本，说明对齐比规模更重要。"
needs_review: false
node_kind: paper
---

## 背景

2022 年，大模型能力随规模快速提升，但「更大」并不自动等于「更听话」：模型会编造事实、输出有害内容、忽视用户意图。OpenAI 试图回答一个问题：能否用人类反馈，把 GPT-3 调成一个有用且诚实的助手？

## 核心观点

论文摘要开门见山：把语言模型做大并不能让它更好地遵循用户意图，这些模型「与用户未对齐」。他们先用人类示范做监督微调，再用人类偏好排序做 RLHF；结果 13 亿参数的 InstructGPT 在人类评估中比 1750 亿参数的 GPT-3 更受欢迎——小 100 倍，却更符合意图，同时在真实性与毒性上都有改善。

## 为什么今天还要读

RLHF 从此成为大模型后训练的标配，也是 ChatGPT 成功的关键工程。它第一次用实验说明：对齐不是能力之后的附加项，而是决定模型能否被使用的核心能力；「规模」与「意图」应当分开优化，这个判断塑造了此后三年的模型开发流程。
