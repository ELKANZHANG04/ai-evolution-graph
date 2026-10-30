---
id: context-engineering-2025
type: insight
title: "上下文工程：记忆是策展，不是存储"
title_en: "Effective Context Engineering for AI Agents"
date: "2025-09-29"
importance: 6
categories: [thought, agent]
summary: "Anthropic 提出「上下文工程」：随着 agent 多轮运行，构造 prompt 变成持续策展有限注意力预算的工程——用小而高信号的 token 集合换取稳定行为，并用压缩、结构化笔记与子 agent 架构处理长任务。"
significance: "它把「记忆」问题从「加长上下文或外挂向量库」改写为「每一步如何策展上下文」，为长任务 agent 提供了可落地的工程范式。压缩（compaction）、笔记式记忆与子 agent 分工，正在成为 2025 年后 agent 系统的标准组件。"
quote: "Context engineering refers to the set of strategies for curating and maintaining the optimal set of tokens (information) during LLM inference, including all the other information that may land there outside of the prompts."
speaker: "Anthropic（应用 AI 团队）"
occasion: "Anthropic Engineering 博客《Effective context engineering for AI agents》（2025-09）"
my_comment: "「上下文会腐烂」是这篇文章最实用的判断：不是窗口不够长，而是塞得越多、模型越抓不住重点。"
tags: [context-engineering, memory, agents, compaction, anthropic]
sources:
  - "https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents"
relations:
  - to: mcp-protocol-2024
    type: 启发
    note: "把工具与上下文接入放在同一个「上下文预算」框架里考虑"
needs_review: true
node_kind: concept
thought_chain: memory
thought_role: advance
thought_claim: "记忆不是把一切存下来，而是每步策展最有信号的上下文"
thought_summary: "模型有有限的注意力预算且会「上下文腐烂」，因此 agent 应持续策展上下文：压缩对话、把笔记写到窗口外、用子 agent 隔离搜索细节。它把长任务的记忆问题从容量问题改写为策展与编排问题。"
---

## 背景

上下文窗口越做越长，但「塞得下」不等于「用得好」。研究显示，上下文变长时模型对其中信息的召回反而下降（context rot）；长任务的 agent 会在几十轮工具调用后迷失在冗长的历史里。

## 核心观点

Anthropic 把这一转变称为从 prompt engineering 到 context engineering：目标不是写出更好的提示词，而是在每一步维持「最小的高信号 token 集合」。具体手段包括：系统提示保持在合适抽象层级、工具集精简、用「即时检索」代替预先灌入、用压缩（compaction）总结接近上限的对话、把笔记持久化到窗口之外（agentic memory），以及用子 agent 隔离大量搜索上下文、只回传摘要。文章还指出：上下文是递减边际收益的有限资源，越大不一定越好；最佳策略要按任务在「预检索」与「运行时探索」之间取舍。

## 为什么今天还要读

它是长任务 agent 的工程底座：决定了一个 agent 能否连续工作数小时而不「失忆」。也重新定义了记忆研究的方向——不是等无限上下文，而是设计压缩、笔记与编排；这些原语正在被各家 agent 产品直接采纳。

