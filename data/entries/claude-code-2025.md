---
id: claude-code-2025
type: product
title: "Claude Code 发布：终端里的编码智能体"
title_en: "Claude Code Research Preview"
date: "2025-02-24"
importance: 7
categories: [agent, product]
summary: "Anthropic 随 Claude 3.7 Sonnet 发布终端编码 agent Claude Code（研究预览）：它可直接读写代码库、执行命令与测试，并在真实工程循环中持续修改，而不是只给建议。"
significance: "Claude Code 把 coding agent 的主战场从 IDE 补全转向命令行与完整工程循环，强调长任务、命令执行与权限边界。它带动 2025 年「agentic coding」成为主要产品形态，也让软件形态主题从「补全」推进到「意图即程序」。"
quote: ""
speaker: ""
occasion: ""
my_comment: "从「帮你写一段代码」到「在仓库里跑一晚上」——Claude Code 改变的是软件的交付方式，而不只是开发效率。"
tags: [claude-code, agentic-coding, anthropic, agent]
sources:
  - "https://www.anthropic.com/news/claude-3-7-sonnet"
relations:
  - to: claude-3-7-sonnet-2025
    type: 基于
    note: "随 Claude 3.7 Sonnet 一同发布，是其 agentic coding 产品形态"
needs_review: false
thought_chain: agents
thought_role: advance
thought_claim: "编码 agent 的战场从补全转向终端与工程循环"
thought_summary: "Claude Code 默认在终端工作：读取仓库、修改文件、运行命令与测试、根据失败继续迭代。它把 coding agent 从「建议片段」推进到「执行完整任务」，并把权限确认与可回滚的工程流程放在产品核心。"
---

## 背景

2021 年的 Codex 让模型学会写代码，2023 年的 Copilot 把补全塞进 IDE。但真实软件任务是循环：读懂仓库、改多处文件、跑测试、看报错、再修——单次补全无法覆盖。

## 核心观点

Claude Code 以命令行 agent 的形态出现：模型可以直接读写工作目录、执行 shell 命令、运行测试，并在多轮循环中迭代到任务完成。它不追求「一次给对」，而是让模型在真实环境里试错并验证。发布时配套更强的 Claude 3.7 Sonnet，Anthropic 同时强调权限提示与可审计的命令执行。

## 为什么今天还要读

它标志着 agent 产品的重心从「对话质量」转向「任务完成」：评价标准变成能不能把一个 issue 真正修完。它也把软件工程变成 agent 能力最密集的试验场——代码库既是任务，又是验证器。

