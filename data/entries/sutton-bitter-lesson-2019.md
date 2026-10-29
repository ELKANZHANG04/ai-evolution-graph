---
id: sutton-bitter-lesson-2019
type: insight
title: "《苦涩的教训》"
title_en: "The Bitter Lesson"
date: "2019-03-13"
importance: 7
categories: [thought]
summary: "Sutton 回望 70 年 AI 研究，指出利用大规模计算的通用方法最终总会战胜依赖人类领域知识的精巧设计。"
significance: "这篇短文为「规模优先」提供了历史与方法论依据，成为 Scaling Laws 与 GPT 路线最常被引用的思想文本。它提醒研究者区分「短期见效」与「长期可扩展」，深刻影响了此后大模型时代的研发取舍。"
quote: "The biggest lesson that can be read from 70 years of AI research is that general methods that leverage computation are ultimately the most effective, and by a large margin."
speaker: "Richard S. Sutton"
occasion: "个人博客 incompleteideas.net（2019-03-13）"
my_comment: "它常被简化为「堆算力」，但原文真正说的是：让通用方法乘上算力，而不是把人的偏见焊进系统。"
tags: [bitter-lesson, scaling, reinforcement-learning, sutton]
sources:
  - "http://www.incompleteideas.net/IncIdeas/BitterLesson.html"
relations: []
thought_chain: scaling
thought_role: thesis
thought_claim: "通用方法 × 算力，终将胜过人类先验"
thought_summary: "七十年 AI 史反复证明：能随算力扩展的通用方法最终最有效；依赖人类领域知识的精巧设计，会被规模与数据碾压。"
needs_review: false
node_kind: concept
---

## 背景

2019 年 3 月，深度学习「规模就是一切」的讨论刚刚起势，Richard Sutton 在个人博客上发布了这篇千余词的短文。Sutton 是强化学习奠基人之一（TD 学习、Sarsa、options），也是经典教材《Reinforcement Learning: An Introduction》的作者。他回望 70 年 AI 研究史，想解释一个反复出现却令人不适的模式。

## 核心观点

文章的核心句是：七十年的 AI 研究给出的最大教训是，利用计算的通用方法最终遥遥领先，而且优势巨大。原因在于摩尔定律让单位计算成本指数下降，而任何依赖人类领域知识的精巧设计，长期看都会遇到天花板，甚至阻碍对算力的进一步利用。Sutton 用国际象棋、围棋、语音识别、计算机视觉四个案例反复验证：研究者总想把「自己所理解的智能结构」硬编码进系统，短期见效、个人满足，长期却输给搜索与学习这两类能随算力无限扩展的通用方法。由此他给出两条方法论：一是优先选择能随算力增长的通用方法；二是不要再试图手写心智的复杂结构，而要构建能发现复杂性的「元方法」。

## 为什么今天还要读

Scaling Laws、GPT 系列与「算力换智能」的路线在事实层面强化了这篇短文的预言，但它常被误读为「只要堆算力就赢」。Sutton 强调的不是算力本身，而是乘上算力的通用方法——搜索与学习，以及不要把人类认知偏见固化进系统。对今天的启示是双向的：做大模型时，凡是依赖人工先验的架构、流程与评测，都值得追问一句「它能否随算力变强而变好」；反过来，数据、算法与评估设计上的巧思仍然决定单位算力的产出效率。真正被否定的不是人的聪明，而是把人的聪明焊死进系统。
