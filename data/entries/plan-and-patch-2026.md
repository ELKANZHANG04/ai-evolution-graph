---
id: plan-and-patch-2026
type: insight
title: "Plan-and-Patch：局部修补计划"
title_en: "Plan-and-Patch: Diffusion Language Models for Agentic Planning"
date: "2026-10-07"
importance: 6
categories: [thought, agent]
summary: "Plan-and-Patch 用扩散语言模型生成结构化计划，并在环境变化时只重生成受影响区域、保留前后步骤：在 Natural Plan 上计划修复成功率达 53.7%（AR 27.0%），规划延迟降低 39–46%。"
significance: "它把「修改」变成 agent 规划的一等操作：与其重写全文、冒不必要的变更风险，不如在原计划上局部打补丁。这为长程 agent 的容错与可维护性提供了新思路，也修正了「计划是一次性生成物」的默认假设。"
quote: "Such revisions often affect only part of a plan, leaving the preceding and subsequent structure intact. Rather than regenerate the entire plan and risk unnecessary changes, repair can regenerate the affected region conditioned on the preserved prefix and suffix."
speaker: "Syamantak Kumar et al."
occasion: "论文《Plan-and-Patch: Diffusion Language Models for Agentic Planning》（arXiv:2610.10786，2026-10-07）"
my_comment: "计划的单位不该是「一份」，而该是「一段」——补丁思维正在从代码蔓延到 agent 的思考。"
tags: [diffusion-lm, agent, planning, repair]
sources:
  - "https://arxiv.org/abs/2610.10786"
relations: []
added_at: 2026-10-29
needs_review: false
node_kind: paper
thought_chain: generative-decision
thought_role: revision
thought_claim: "改一段计划，不必重写全文"
thought_summary: "扩散语言模型生成结构化计划，环境变化时只重生成受影响区域并保留前后步骤：计划修复成功率 53.7%（AR 27.0%），规划延迟降低 39–46%。"
---

## 背景

长程 agent 的计划常被环境推翻：工具返回意外结果、动作失败、假设失效。自回归模型只能重写整份计划，引入本不必要的变更，也浪费时间。

## 核心观点

Plan-and-Patch 用扩散语言模型生成结构化、类程序的计划，并在需要修订时只重生成受影响区域，保留前后步骤。论文以 DreamReasoner-8B 与 Qwen3-8B 分别代表扩散与自回归规划器做对照：在 Natural Plan 上，扩散规划器的计划修复成功率为 53.7%，接近 AR 的 27.0% 的两倍；在 ALFWorld/TextCraft 上，规划延迟相比 AR 降低 39–46%。

## 为什么今天还要读

它把「修改」提升为规划的一等操作：计划应是可修补的工件，而不是一次性生成物。这一视角对长程 agent 的可靠性、可维护性与成本都有直接影响；对 agent 框架而言，重试与恢复可以只作用于计划的一段，而不是整轮重跑，成本与风险都会显著下降。