---
id: arc-agi-2-2025
type: insight
title: "ARC-AGI-2：能力之外还要标价"
title_en: "ARC-AGI-2: Measuring Capability and Efficiency"
date: "2025-03-24"
importance: 6
categories: [thought, model]
summary: "ARC Prize 发布 ARC-AGI-2：面向符号解释、组合推理与上下文规则等「人类易解、AI 难解」任务的新基准，并要求所有成绩同时报告成本与效率，以检验推理系统是否真的高效地会思考。"
significance: "它把评估从单一准确率推进到「能力 × 成本」的二维标尺，并指出 log-linear scaling 不足以通关，需要新的推理时自适应方法。这为大模型评测提供了一个更难被暴力搜索与数据污染绕过的公共基准。"
quote: "Log-linear scaling is insufficient to beat ARC-AGI-2. New test-time adaptation algorithms or novel AI systems are needed to bring AI efficiency inline with human performance."
speaker: "ARC Prize Foundation（François Chollet 等）"
occasion: "ARC-AGI-2 基准发布（2025-03-24，ARC Prize 2025）"
my_comment: "把「成本」写进榜单是评测思路的升级：一个花掉百万美元才答对的系统，和人类随手答对不是同一种智能。"
tags: [arc-agi, benchmark, reasoning, evaluation, efficiency]
sources:
  - "https://arcprize.org/arc-agi/2"
  - "https://arcprize.org/blog/announcing-arc-agi-2-and-arc-prize-2025"
relations:
  - to: o1-2024
    type: 启发
    note: "针对 o1 类推理模型的推理时算力成本提出效率要求"
needs_review: true
node_kind: concept
thought_chain: evaluation
thought_role: advance
thought_claim: "衡量智能的标尺要同时量能力与成本"
thought_summary: "ARC-AGI-2 用人类可解、AI 难解的任务检验推理与泛化，并强制并列报告成本：单纯堆算力（log-linear scaling）不足以通关，需要新的推理时自适应方法。它把「效率」变成评估的一等公民。"
---

## 背景

ARC-AGI-1 长期被当作「LLM 是否具备抽象推理」的试金石。2024 年底，o3 类推理模型用大规模推理时算力大幅提升其分数，但也带来新问题：暴力搜索与巨额算力换来的分数，算不算通用智能？

## 核心观点

ARC-AGI-2 由 ARC Prize Foundation 发布，任务围绕符号语义解释、组合推理与上下文相关规则设计，强调「对人容易、对 AI 难」。它与前代最大的区别是把成本纳入度量：每个成绩都要附带推理成本，与人类完成成本对比。官方明确表示：log-linear scaling 不足以攻克它，需要新的推理时自适应算法或系统设计；评测集经 400 余名公众参与者校准，确保至少两人在两次尝试内可解。

## 为什么今天还要读

它代表评测范式的一次转变：从「会不会」到「以多大代价会」。当推理成本成为前沿竞争的核心变量，只报告准确率的榜单会系统性高估模型的实际可用性——这也是 2025 年后各类评测开始加入成本与效率维度的原因。

