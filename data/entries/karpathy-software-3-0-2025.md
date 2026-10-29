---
id: karpathy-software-3-0-2025
type: insight
title: "Software 3.0：用自然语言编程"
title_en: "Software 3.0: Software Is Changing (Again)"
date: "2025-06-17"
importance: 6
categories: [thought]
summary: "Karpathy 在 Y Combinator AI Startup School 演讲《Software Is Changing (Again)》中提出 Software 3.0：LLM 更像一台可编程的计算机或操作系统，自然语言（prompt）成为新的编程语言。"
significance: "它把 2017 年的 Software 2.0 框架推进到「意图即程序」阶段，为 AI 原生开发、提示工程与规格驱动开发提供了共同语言；也提醒人们在 agent 时代应保留「部分自主」的人类控制权。"
quote: "The hottest new programming language is English."
speaker: "Andrej Karpathy"
occasion: "Y Combinator AI Startup School 演讲《Software Is Changing (Again)》（2025-06-17）；该表述最早出自其 2023 年 1 月的推文"
my_comment: "从「数据即代码」到「意图即代码」，Karpathy 每次都在描述同一件事：抽象层在往上走。注：quote 为他反复使用的标志性表述（最早见 2023-01 推文），与 2025 演讲的逐字对应关系待核对。"
tags: [software-3-0, karpathy, llm, prompt]
sources:
  - "https://www.ycombinator.com/library/MW-andrej-karpathy-software-is-changing-again"
  - "https://latent.space/p/s3"
relations:
  - to: karpathy-software-2-0-2017
    type: 启发
    note: "在 Software 2.0 框架基础上提出 Software 3.0"
needs_review: true
node_kind: concept
---

## 背景

2025 年 6 月 17 日，Andrej Karpathy 在 Y Combinator 的 AI Startup School 发表演讲《Software Is Changing (Again)》。距他写下《Software 2.0》已过去八年：当年「神经网络的权重就是程序」的判断，已被大模型、Copilot 与 agent 产品全面验证。新的问题变成：如果 LLM 本身足够通用，软件开发的下一层抽象是什么？

## 核心观点

Karpathy 把软件史切成三代。Software 1.0 是程序员用 Python、C++ 写下显式规则；Software 2.0 是用数据集与优化目标「训练」出权重；Software 3.0 则是用自然语言直接编程。在他看来，LLM 不只是一件工具，更像一台可编程的计算机或操作系统：prompt 是它的程序，上下文窗口是内存，工具调用是 I/O。演讲中的两个判断尤其重要：其一，Software 3.0 正在吞噬 1.0 与 2.0，越来越多能力以自然语言接口暴露；其二，自主性不是二元的，而是一根滑杆——从代码补全、Copilot 到全自动 agent，他更看好「钢铁侠战衣」式的部分自主，让 AI 大幅增强人，而人保留判断与关键决策。

## 为什么今天还要读

「Software 3.0」为 AI 原生开发提供了一套共同语言：它解释了为什么 prompt、上下文与规格（spec）值得被当作工程产物来管理，也解释了为什么 agent 的瓶颈常常不在模型单项能力，而在人机分工的接口设计。更重要的是它保持了 Karpathy 一贯的清醒：抽象层级每上升一格，验收与验证的责任就更多地落回人类身上。八年前的 Software 2.0 提醒我们「数据即代码」；今天的 Software 3.0 提醒我们「意图即代码」——而意图比数据更值得被认真审查。
