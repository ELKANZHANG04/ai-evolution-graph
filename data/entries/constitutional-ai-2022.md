---
id: constitutional-ai-2022
type: event
title: "Anthropic Constitutional AI"
title_en: "Constitutional AI: Harmlessness from AI Feedback"
date: "2022-12-15"
importance: 6
categories: [alignment]
summary: "Anthropic 发布 Constitutional AI（CAI）：让模型依据一份书面「宪法」原则自我批评并修订回答，再用 AI 反馈强化学习（RLAIF）训练无害助手，减少对人类标注有害内容的依赖。"
significance: "CAI 提出「用 AI 监督 AI」的对齐路线，把价值规范显式写成可审计的文本，而不是隐含在人工标注里。它是 RLAIF、可扩展监督与「宪法式」对齐研究的开创性工作，也是 Anthropic Claude 系列模型的核心训练方法来源，深刻影响了 2023 年后的对齐工程。"
quote: ""
speaker: ""
occasion: ""
my_comment: "把价值观写成一份可讨论、可修改的文档，比把它藏在标注工人的直觉里更诚实。"
tags: [constitutional-ai, rlaif, alignment, anthropic]
sources:
  - "https://arxiv.org/abs/2212.08073"
  - "https://www.anthropic.com/research/constitutional-ai-harmlessness-from-ai-feedback"
relations:
  - to: rlhf-instructgpt-2022
    type: 基于
    note: "宪法 AI 在 RLHF 基础上改用 AI 反馈（RLAIF）"
needs_review: false
node_kind: paper
---
