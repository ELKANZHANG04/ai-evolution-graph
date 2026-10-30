---
id: swe-bench-2023
type: event
title: "SWE-bench：用真实 GitHub issue 考代码能力"
title_en: "SWE-bench: Can Language Models Resolve Real-World GitHub Issues?"
date: "2023-10-10"
importance: 7
categories: [model, product]
summary: "普林斯顿等团队发布 SWE-bench：从 12 个 Python 开源仓库收集 2294 个真实 issue，要求模型给出能通过仓库测试的补丁。它把「写代码」评测从函数题推进到「理解仓库、定位 bug、改对代码」的端到端任务。"
significance: "SWE-bench 成为 agent 与代码模型最重要的能力标尺之一：从 2023 年不到 2% 的解决率，到 2025 年头部 agent 越过 70%，这条曲线直接推动了「AI 软件工程师」叙事。它也把评测与真实工程流程绑定：跑测试、迭代修复。"
quote: ""
speaker: ""
occasion: ""
my_comment: "SWE-bench 让「会不会写代码」变得可被自动化验证，但也提醒：能过测试的补丁不一定是好补丁，维护性与安全仍是盲区。"
tags: [swe-bench, benchmark, coding, agent, evaluation]
sources:
  - "https://arxiv.org/abs/2310.06770"
  - "https://www.swebench.com/"
relations: []
needs_review: false
node_kind: paper
thought_chain: evaluation
thought_role: advance
---

## 背景

代码模型早期评测多用 HumanEval 这类函数级题目，与真实软件开发差距很大：真实任务要读仓库、理解上下文、定位问题、写补丁并让测试通过。

## 核心观点

SWE-bench 从真实开源仓库的 issue 与合并 PR 构造任务：给定 issue 与代码库，模型需生成补丁，由仓库测试判定是否解决。后续版本（SWE-bench Verified、多语言版）进一步清洗与扩展。它的出现让「agent 在真实工程闭环里工作」有了统一验收标准。

## 为什么今天还要读

它把评测从「生成代码片段」推向「改变仓库状态并接受测试」，是 agent 时代评测的基础设施；也解释了为什么 2024–2026 年编程 agent 的竞争都围绕 SWE-bench 分数展开。
