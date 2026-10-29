---
id: spec-driven-development-2025
type: insight
title: "规格驱动开发：代码服务规格"
title_en: "Specification-Driven Development"
date: "2025-09-02"
importance: 5
categories: [thought]
summary: "GitHub 开源 Spec Kit，并把「规格驱动开发」（SDD）做成一整套可执行方法论：规格成为首要产物，代码由规格与实现计划生成，维护软件即演进规格。"
significance: "它把 Karpathy 所说的「意图即程序」落成工程实践：当自然语言成为编程语言，意图的精确表达与版本管理就成为新的核心竞争力。SDD 是 2025 年 AI 原生开发方法论争论的中心，也是「规格 vs 代码」这条路线最完整的宣言。"
quote: "Spec-Driven Development (SDD) inverts this power structure. Specifications don't serve code—code serves specifications."
speaker: "GitHub Spec Kit 团队"
occasion: "Spec Kit 方法论文档《Specification-Driven Development》（GitHub，2025-09）"
my_comment: "如果代码可以由规格再生成，那么真正需要 review、需要版本控制的就变成了规格本身。"
tags: [spec-driven-development, ai-coding, github, software]
sources:
  - "https://github.com/github/spec-kit/blob/main/spec-driven.md"
  - "https://github.blog/ai-and-ml/generative-ai/spec-driven-development-with-ai-get-started-with-a-new-open-source-toolkit/"
relations: []
thought_chain: software
thought_role: advance
thought_claim: "规格才是源代码，代码服务规格"
thought_summary: "规格驱动开发反转代码与规格的主从关系：规格成为首要产物，代码由它生成；维护软件即演进规格，调试即修复规格。"
needs_review: false
node_kind: concept
---

## 背景

2025 年，AI 编程工具从代码补全走向「代理写代码」，但生成质量高度依赖输入是否清晰：随手写的 prompt 会得到随机的代码。GitHub 开源 Spec Kit，把「规格驱动开发」（SDD）做成模板、命令与检查点组成的工作流，试图给 AI 编程补上缺失的工程纪律。

## 核心观点

方法论开篇给出权力反转：「几十年来代码为王，规格服务于代码；SDD 反转这一结构——规格不服务代码，而是代码服务规格。」规格与实现计划成为首要产物，代码是它们生成的表达；维护软件意味着演进规格，调试意味着修复那些生成了错误代码的规格。模板、检查清单与项目「宪法」则用来约束 LLM，让输出完整、无歧义、可测试。

## 为什么今天还要读

它把「Software 3.0 / 意图即程序」从口号落成了可执行流程：当自然语言成为编程语言，意图的精确表达与版本管理就成了新的核心竞争力。SDD 是 2025 年 AI 原生开发方法论争论的中心，读它有助于判断「规格优先」究竟是真正的范式转移，还是又一次工具包装。