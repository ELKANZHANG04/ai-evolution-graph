---
id: rlhf-instructgpt-2022
type: event
title: "InstructGPT 与 RLHF 对齐"
title_en: "Training Language Models to Follow Instructions with Human Feedback"
date: "2022-01-27"
importance: 8
categories: [alignment, model]
summary: "OpenAI 发布 InstructGPT，用「监督微调 + 奖励模型 + PPO」三阶段 RLHF 让语言模型按人类指令办事；13 亿参数的 InstructGPT 在人类评估中胜过 1750 亿参数的 GPT-3。"
significance: "RLHF 把「对齐」从事后补丁变成训练流程的核心环节，模型的可用性与安全性第一次可以被系统性优化。它是 ChatGPT 的直接技术前身，也奠定了此后 RLHF、DPO 等偏好学习方法的行业地位。"
quote: ""
speaker: ""
occasion: ""
my_comment: "一个「更小但更听话」的模型胜过「更大但不受控」的模型，这是产品目标第一次压倒参数竞赛。"
tags: [rlhf, instruction-following, alignment, gpt]
sources:
  - "https://arxiv.org/abs/2203.02155"
relations:
  - to: gpt-3-2020
    type: 基于
    note: "在 GPT-3 系列模型之上做指令微调与人类反馈强化学习"
needs_review: false
mainline: true
node_kind: model
---
