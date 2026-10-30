---
id: vibe-coding-2025
type: insight
title: "Vibe Coding：把代码交给直觉"
title_en: "Vibe Coding"
date: "2025-02-02"
importance: 6
categories: [thought, product]
summary: "Karpathy 提出「vibe coding」：完全顺着直觉让 LLM 写代码，接受全部改动、不读 diff，甚至不太清楚代码具体怎么写；他明确说这种方式适合一次性项目，但「挺好玩」。"
significance: "这个词迅速出圈，成为 AI 编程乐观派与担忧派共同使用的标签：它既描述了 LLM 让编程门槛骤降的现实，也暴露了「不读代码」带来的可维护性与安全风险，并推动 2025 年关于软件工程纪律的持续讨论。"
quote: "There's a new kind of coding I call \"vibe coding\", where you fully give in to the vibes, embrace exponentials, and forget that the code even exists."
speaker: "Andrej Karpathy"
occasion: "X/Twitter 推文（2025-02-02），转引自 Simon Willison 的引文页（2025-02-06）"
my_comment: "「氛围编程」不是一种工程方法，而是一份关于门槛消失后会发生什么的真实田野记录。"
tags: [vibe-coding, karpathy, ai-coding, developer-experience]
sources:
  - "https://simonwillison.net/2025/Feb/6/andrej-karpathy/"
  - "https://twitter.com/karpathy/status/1886192184808149383"
relations:
  - to: karpathy-software-3-0-2025
    type: 启发
    note: "同一作者对「自然语言即程序」的实践版本"
needs_review: false
node_kind: concept
thought_chain: software
thought_role: advance
thought_claim: "顺着直觉让 AI 写代码，不必逐行审查"
thought_summary: "Karpathy 用 vibe coding 描述一种极端 AI 编程方式：接受模型给的一切、不读 diff、不逐行审查；它揭示了门槛骤降后的效率与风险。"
---

## 背景

2023–2024 年，AI 编程助手从补全走向对话与多文件编辑；到 2025 年初，Cursor Composer 加语音输入已经可以让开发者几乎不碰键盘。写代码这件事第一次出现「完全委托」的可能。

## 核心观点

Karpathy 用「vibe coding」描述这种极端用法：完全顺着模型给的结果走，接受全部改动、不读 diff，遇到错误就把报错原样丢回去；他甚至说代码已经超出自己的理解范围。他同时给出边界——这只适合一次性周末项目，而且「挺好玩」。换言之，这更像一种消费级体验，而不是可交付的工程方法。

## 为什么今天还要读

这个词让「门槛消失」的乐观与风险同时可见：原型速度大幅提升，但可维护性、安全与责任归属被推到前台。它直接催生了对工程纪律的反向强调——spec-driven、代码审查、测试与可追溯性；理解 vibe coding，才能理解 2025 年后 AI 编程工具为何一边普及、一边被要求「可验证」。
