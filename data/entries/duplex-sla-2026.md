---
id: duplex-sla-2026
type: insight
title: "DuplexSLA：边说边调工具"
title_en: "DuplexSLA: A Full-Duplex Spoken Language Model with Synchronized Speech, Language, and Action"
date: "2026-05-20"
importance: 5
categories: [thought, agent]
summary: "DuplexSLA 是原生全双工「语音—语言—动作」基础模型：在共享的 160ms chunk 时间轴上，同时解码用户音频、助手音频与结构化动作流，实现语义驱动的轮转控制与对话中工具调用，无需外挂级联。"
significance: "它把「工具调用」从回合边界解放出来：agent 可以在说话的同时规划并调用工具。这为实时语音 agent 提供了统一架构，也提示未来交互系统的竞争点是时间轴上的同步精度，而不只是模型能力。"
quote: "We propose DuplexSLA, a native full-duplex Speech-Language-Action foundation model that decodes assistant audio together with a structured action stream on a shared 160 ms chunk timeline."
speaker: "Haoyang Zhang et al."
occasion: "论文《DuplexSLA: A Full-Duplex Spoken Language Model with Synchronized Speech, Language, and Action》（arXiv:2605.20755，2026-05-20）"
my_comment: "「边说边做」难的不是模型会不会调工具，而是语音和动作能不能对齐到同一个节拍器上。"
tags: [full-duplex, speech, tool-calling, agent]
sources:
  - "https://arxiv.org/abs/2605.20755"
  - "https://github.com/hyzhang24/DuplexSLA"
relations: []
added_at: 2026-10-29
needs_review: false
node_kind: paper
thought_chain: interaction
thought_role: advance
thought_claim: "边听、边说、边调工具，共享 160ms 时间轴"
thought_summary: "DuplexSLA 在共享的 160ms 时间轴上同时解码用户音频、助手音频与限速动作流，让语义驱动的轮转控制与对话中工具调用都在单主干内完成，无需外挂级联。"
---

## 背景

全双工语音模型解决了「边听边说」，但对话中的工具调用仍被绑在回合边界：要么等用户说完再调，要么外挂一个级联系统，动作与语音难以同步。

## 核心观点

DuplexSLA 把「语音—语言—动作」放进同一条时间轴：在共享的 160ms chunk 上，单主干同时解码用户音频、助手音频与限速的文本动作流。于是语义驱动的轮转控制（打断、停顿、附和）与对话中工具调用都在模型内部完成，多动作与附和触发的工具调用可与语音交错进行。作者同时发布 DuplexSLA-Bench，覆盖停顿、打断、附和与三类对话中工具调用，让这种「同步」能力可以被量化比较。

## 为什么今天还要读

它指出实时 agent 的真正难点不是某个模块更强，而是「听、说、做」在时间上的精确同步。若这条路线成熟，语音助手会从问答工具变成能边聊边办事的实时协作者。