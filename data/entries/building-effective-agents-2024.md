---
id: building-effective-agents-2024
type: insight
title: "Anthropic：简单可组合胜过复杂框架"
title_en: "Building Effective Agents"
date: "2024-12-19"
importance: 6
categories: [thought]
summary: "Anthropic 基于与数十个团队的 agent 实践写下《Building Effective Agents》：最成功的实现并没有使用复杂框架或专门库，而是用简单、可组合的模式搭建。"
significance: "这是 agent 领域少有的「反框架」宣言：把注意力从工具选型拉回到任务分解、工具接口（ACI）与评测。它区分 workflow 与 agent、主张按需增加复杂度，至今仍是构建 agent 时最实用的第一份 checklist。"
quote: "Consistently, the most successful implementations weren't using complex frameworks or specialized libraries. Instead, they were building with simple, composable patterns."
speaker: "Anthropic"
occasion: "Anthropic 工程博客《Building Effective Agents》（2024-12-19）"
my_comment: "在人人都在造 agent 框架的 2024 年，最有影响力的一篇 agent 文章却在劝你先别用框架。"
tags: [agents, workflows, anthropic, engineering]
sources:
  - "https://www.anthropic.com/engineering/building-effective-agents"
relations: []
thought_chain: agents
thought_role: advance
thought_claim: "简单可组合的工作流，胜过复杂 agent 框架"
thought_summary: "Anthropic 的实践结论：最成功的 agent 实现不用复杂框架，而是简单、可组合的模式；先求最简方案，再按需增加复杂度。"
needs_review: false
node_kind: concept
---

## 背景

2024 年底，agent 框架层出不穷，开发者容易陷入「堆框架、加抽象」的冲动：多一层编排、多一个库，似乎就更「智能体」。Anthropic 基于与数十个行业团队的合作经验，写下这篇工程笔记，给出相反的建议。

## 核心观点

文章的核心结论来自开头：最成功的实现「并没有使用复杂框架或专门库，而是用简单、可组合的模式」构建。作者区分 workflow（用预定义代码路径编排 LLM 与工具）与 agent（由模型自主决定流程与工具使用），建议先找最简方案、只在复杂度能证明带来收益时才加码；并强调工具接口（ACI）的设计值得与提示词同等投入。

## 为什么今天还要读

这篇笔记是 agent 领域少有的「反框架」宣言：它把讨论从工具选型拉回到任务分解、工具设计与评测。对今天构建 agent 的团队来说，它依然是最实用的第一份 checklist——尤其是「先写最少的代码，再增加自主性」这一条。