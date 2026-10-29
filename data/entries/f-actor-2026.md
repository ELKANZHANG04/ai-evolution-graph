---
id: f-actor-2026
type: insight
title: "F-Actor：对话行为可被显式控制"
title_en: "F-Actor: Controllable Conversational Behaviour in Full-Duplex Models"
date: "2026-01-16"
importance: 5
categories: [thought, agent]
summary: "F-Actor 是首个开源的、可指令控制的全双工对话语音模型：冻结音频编码器、只微调语言模型，2000 小时数据即可训练；用户可用指令控制音色、话题、附和/打断等对话行为以及是否主动开场。"
significance: "它把「怎么说话」从模型风格变成可控参数，让语音 agent 能按场景调整互动方式（客服少插话、陪伴多附和）。这为对话体验的产品化提供了新的控制面，也让全双工研究更可复现。"
quote: "The model can follow explicit instructions to control speaker voice, conversation topic, conversational behaviour (e.g., backchanneling and interruptions), and dialogue initiation."
speaker: "Maike Züfle et al."
occasion: "论文《F-Actor: Controllable Conversational Behaviour in Full-Duplex Models》（arXiv:2601.11329，2026-01-16）"
my_comment: "当「何时该沉默」也能被指令控制，语音 agent 的性格设计才真正开始。"
tags: [full-duplex, controllability, speech, dialogue]
sources:
  - "https://arxiv.org/abs/2601.11329"
relations: []
needs_review: false
node_kind: paper
innovation: true
maturity: prototype
why_underrated: "把抢话、附和等行为变成可控指令，是产品体验差异化的关键，但学术关注度远低于模型能力本身。"
thought_chain: interaction
thought_role: advance
thought_claim: "抢话、附和、开场，这些对话行为可以被显式控制"
thought_summary: "F-Actor 冻结音频编码器、只微调语言模型，用 2000 小时数据训练出可指令控制的全双工语音模型：音色、话题、附和/打断、是否主动开场都能按指令调节。"
---

## 背景

全双工语音模型解决了「能不能同时听和说」，但「用什么样的行为说」仍不可控：模型可能过度附和、频繁抢话，或在需要时不敢开场。真实对话里，这些行为直接决定交互是否自然。

## 核心观点

F-Actor 让用户通过指令控制对话行为：音色、话题、附和（backchanneling）、打断、是否主动开场。方法上冻结音频编码器、只微调语言模型，2000 小时数据即可在典型学术资源下训练；模型与训练代码全部开源，可复现。

## 为什么今天还要读

它揭示了全双工的下一个产品命题：不是「能不能打断」，而是「何时该打断、该附和多少」。把对话行为做成可控参数，意味着语音 agent 可以按场景调整性格——这是体验差异化的关键，也是评测需要覆盖的新维度；开放模型与代码则让这类控制从论文概念变成可试验的接口。