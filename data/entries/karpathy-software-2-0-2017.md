---
id: karpathy-software-2-0-2017
type: insight
title: "Software 2.0"
title_en: "Software 2.0"
date: "2017-11-11"
importance: 6
categories: [thought]
summary: "Karpathy 提出「软件 2.0」概念：软件不再由程序员逐行书写，而是由数据集与优化过程决定，代码就写在神经网络的权重里。"
significance: "这篇短文重新定义了深度学习与软件工程的关系，把数据标注、清洗与评测提升为软件开发的核心工作。它为此后「数据即代码」「预训练 + 对齐」的产业现实提供了最早也最清晰的框架。"
quote: "Software 2.0 is written in neural network weights."
speaker: "Andrej Karpathy"
occasion: "个人博客《Software 2.0》（Medium，2017-11-11）"
my_comment: "八年后回看，它不止是预言，更像一份写给数据工程师的行业宣言。"
tags: [software-2-0, neural-networks, paradigm, karpathy]
sources:
  - "https://medium.com/@karpathy/software-2-0-a64152b37c35"
relations: []
thought_chain: software
thought_role: thesis
thought_claim: "程序的未来，写在神经网络的权重里"
thought_summary: "软件从显式规则转向由数据与优化过程决定权重；数据、清洗与评测，正在取代源代码成为新的工程对象。"
needs_review: false
node_kind: concept
---

## 背景

2017 年，深度学习已经在视觉、语音、机器翻译上全面超过传统方法，但产业界仍普遍把神经网络当作「工具箱里多出来的一个分类器」：特征工程照旧，业务流程照旧。Karpathy 时任特斯拉 AI 主管，正在用真实车队数据训练自动驾驶视觉系统。他在 Medium 上写下这篇短文，试图回答一个当时没人说清的问题：如果模型能力持续超过手写规则，软件工程本身该往哪里走？

## 核心观点

文章提出「软件 1.0 / 2.0」的二分：1.0 是程序员用 Python、C++ 等语言显式写下每一行逻辑；2.0 则是用神经网络权重写成的软件——人类不再直接写代码，而是提供数据集与约束，让优化过程在程序空间中搜索出满足约束的程序。由此 Karpathy 重新定义了数据工作：标注、清洗、可视化不再是低价值杂活，而是软件开发的一等公民。他列举了软件 2.0 的优势（计算同质、易于烧进芯片、运行时间与内存恒定、模块可端到端联合优化），也诚实地指出代价（不可解释、会以令人尴尬的方式失败、存在对抗样本）。

## 为什么今天还要读

今天回看，这篇文章几乎预告了此后的技术路线：大规模预训练、RLHF 的偏好数据标注、甚至「Software 3.0 = 用自然语言编程」的说法都能在这里找到雏形。它最有价值的地方不是预言，而是一种判断框架：当你在争论「该写规则还是该喂数据」时，Karpathy 给出的标准是——哪种方式能更好地利用持续增长的计算与数据，哪种就会赢。这与 Sutton 的《苦涩的教训》形成互文：一个从软件工程视角、一个从 AI 研究史视角，指向同一个结论。
