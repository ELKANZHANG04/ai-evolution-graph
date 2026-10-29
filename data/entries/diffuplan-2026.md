---
id: diffuplan-2026
type: insight
title: "DiffuPlan：可编辑的规划状态"
title_en: "DiffuPlan: Editable Planning State for Diffusion Language Model Agents"
date: "2026-10-17"
importance: 6
categories: [thought, agent]
summary: "DiffuPlan 让扩散语言模型 agent 维护单一可编辑规划状态：当后续证据改变搜索路线时，只重建受影响的步骤，而非追加文本或重写全文；4 个多跳 QA 平均 F1 50.24，可编辑状态带来 +2.44 提升（AR 仅 +0.47）。"
significance: "它指出扩散语言模型对 agent 的结构性优势不是「生成快」，而是「已提交状态可修订」；这挑战了自回归 agent 只能 append-only 的交互协议，为长程规划与工具搜索提供了新的状态范式。"
quote: "We ask whether this capability can support a different agent-state paradigm in which intermediate planning state is directly revisable as evidence arrives."
speaker: "Qisheng Zhou, Zhen Xiong, Qiaoyu Tan"
occasion: "论文《DiffuPlan: Editable Planning State for Diffusion Language Model Agents》（arXiv:2610.24717，2026-10-17）"
my_comment: "append-only 的上下文像一条只能往前写的时间线；可编辑状态才让 agent 拥有「改主意」的自由。"
tags: [diffusion-lm, agent, planning, editable-state]
sources:
  - "https://arxiv.org/abs/2610.24717"
  - "https://github.com/Jaasssoooonnnnn/DiffuPlan"
relations: []
added_at: 2026-10-29
needs_review: false
node_kind: paper
innovation: true
maturity: paper
why_underrated: "扩散语言模型的 agent 优势常被当成「生成速度」问题，实际上「可编辑状态」才是它对 AR agent 的结构性优势。"
thought_chain: generative-decision
thought_role: thesis
thought_claim: "计划写下就不该改吗？扩散 agent 让它随时可编辑"
thought_summary: "DiffuPlan 让扩散语言模型 agent 维护可编辑规划状态：新证据到来时只重建受影响步骤，而非追加或重写；4 个多跳 QA 平均 F1 50.24，可编辑状态带来 +2.44 提升。"
thought_pin: top
---

## 背景

主流 LLM agent 沿用了自回归的交互协议：中间状态一旦写下，后续观察只能靠追加文本。可环境随时推翻假设，追加式状态会越滚越大，旧结论却无法修改。

## 核心观点

DiffuPlan 让扩散语言模型维护单一可编辑规划状态：新证据到来时，只重建受影响步骤，前后结构保持固定；作者用 Expansion-Partition Marginalization 支持变长修订，并把扩散轨迹 RL 用到多轮搜索。在四个多跳 QA 上平均 F1 50.24，可编辑状态带来 +2.44 提升，而 AR 源模型只有 +0.47。

## 为什么今天还要读

它把「已提交状态可修订」确立为扩散模型对 agent 的结构性优势，而不只是生成速度。若这一范式成立，agent 的设计核心会从「如何追加上下文」转向「如何维护可编辑的世界状态」；对搜索类 agent 而言，这还意味着更少的上下文膨胀与更清晰的可解释轨迹。