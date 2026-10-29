---
id: petri-2025
type: insight
title: "Petri：用 agent 审计 agent"
title_en: "Petri: An open-source AI auditing tool"
date: "2025-10-06"
importance: 6
categories: [thought, alignment]
summary: "Anthropic 开源 Petri（Parallel Exploration Tool for Risky Interactions）：由 auditor agent 模拟环境、与目标模型多轮交互，再由 judge 模型按多维度打分，把红队评估压缩到几分钟内完成。"
significance: "当模型能自主行动，人工逐条审计已不可行；Petri 把「审计」本身变成可并行、可复现的 agent 任务，并用 14 个前沿模型 × 111 条种子指令给出首批对比结果。它为评估基础设施提供了开源样板，也提出「谁能审计审计者」的新问题。"
quote: "The sheer volume and complexity of potential behaviors far exceeds what researchers can manually test, making it increasingly difficult to properly audit each model."
speaker: "Anthropic（Anthropic Fellows 项目）"
occasion: "Anthropic Alignment Science 技术报告《Petri: An open-source auditing tool to accelerate AI safety research》（2025-10-06）"
my_comment: "评估正在从「写测试」变成「造一个会写测试并读结果的 agent」。"
tags: [petri, red-teaming, evaluation, alignment]
sources:
  - "https://alignment.anthropic.com/2025/petri/"
  - "https://www.anthropic.com/research/petri-open-source-auditing"
  - "https://github.com/safety-research/petri"
relations: []
needs_review: false
node_kind: concept
innovation: true
maturity: product
why_underrated: "agent 审计 agent 仍被视为辅助工具，但在系统自主性快速上升时，它可能是评估基础设施的关键拼图。"
thought_chain: evaluation
thought_role: thesis
thought_claim: "用 agent 审计 agent，把红队变成自动工程"
thought_summary: "Petri 让 auditor agent 模拟环境与目标模型多轮交互，再由 judge 模型按 36 个维度打分；把人工数天的红队评估压缩到几分钟，并开源整个框架。"
---

## 背景

模型能力越强、权限越大，需要审计的行为空间就越广。靠人工设计场景、跑模型、读 transcript，覆盖速度远远落后于模型迭代，「能不能测全」成了安全工作的瓶颈。

## 核心观点

Petri 用 agent 审计 agent：auditor agent 依据种子指令模拟环境、生成工具并与目标模型多轮交互，judge 模型再对 transcript 按多个维度打分并摘出可疑案例。Anthropic 用它测试了 14 个前沿模型、111 条种子指令，覆盖欺骗、谄媚、自我保存、举报等行为，把过去数天的评估压缩到几分钟；技术报告也坦承 judge 偏见与场景真实感等局限。

## 为什么今天还要读

它把红队从「一次性研究」变成可并行、可复现的工程流程，并开源了整个框架。当系统自主性继续上升，评估本身也必须自动化——而 Petri 提出了一个关键问题：当审计者也由模型担任，我们如何评估审计的可信度？