---
id: lslm-listen-while-speaking-2025
type: insight
title: "LSLM：边听边说的全双工语音模型"
title_en: "Language Model Can Listen While Speaking"
date: "2025-04-11"
importance: 6
categories: [thought, agent]
summary: "上海交大 X-LANCE 与字节跳动提出 LSLM：在单一模型中同时接入流式音频输入与语音生成两个通道，让模型在说话时持续倾听，并能实时检测打断、完成全双工对话。"
significance: "LSLM 把语音对话从「回合制」推进到「全双工」，并证明 middle fusion 能在生成质量与实时交互之间取得平衡。它为之后「可被打断、能主动插话」的实时语音 agent 提供了可复用的架构范式。"
quote: "To address these limitations, we explore full duplex modeling (FDM) in interactive speech language models (iSLM), focusing on enhancing real-time interaction and, more explicitly, exploring the quintessential ability of interruption."
speaker: "Ziyang Ma et al.（上海交通大学 X-LANCE / 字节跳动）"
occasion: "AAAI-25 论文《Language Model Can Listen While Speaking》（2025-04-11）"
my_comment: "全双工的关键不是语音质量，而是模型愿意在说话中途把话轮让出来。"
tags: [full-duplex, speech, interaction, real-time]
sources:
  - "https://ojs.aaai.org/index.php/AAAI/article/view/34665"
  - "https://doi.org/10.1609/aaai.v39i23.34665"
relations: []
needs_review: false
node_kind: paper
innovation: true
maturity: paper
why_underrated: "全双工常被当成语音产品的体验优化，但它其实改变了对话的交互协议：模型必须边生成边决策是否让出话轮，这是实时 agent 的基础能力。"
thought_chain: interaction
thought_role: thesis
thought_claim: "对话不必回合制：模型可以边听边说、随时被打断"
thought_summary: "LSLM 在同一模型中并行接入流式音频输入与语音生成通道，用 middle fusion 让模型边说话边听，并实时检测打断，实现可被打断的全双工对话。"
---

## 背景

语音对话长期是回合制的：用户说完、VAD 判定结束，模型才开始回答；一旦模型开口，用户无法中途打断。这与人类对话的常态——重叠、犹豫、抢话——相去甚远，也限制了实时语音助手的自然度。

## 核心观点

LSLM 在单一模型中同时保留「听」与「说」两个通道：流式自监督编码器持续接收音频，token 化 TTS 解码器负责生成，两者在 middle fusion 层融合，使模型在说话的同时检测 turn-taking。论文比较三种融合策略，发现 middle fusion 在语音质量与实时交互之间最平衡，并在有噪声、有指令的两种设定下验证了打断能力。

## 为什么今天还要读

它把「可被打断」从一个产品 feature 变成可训练的架构能力，也为之后的全双工语音 agent 提供了基线。今天实时语音助手竞争的核心体验——能否自然打断、能否边听边想——都可以追溯到这条路线。