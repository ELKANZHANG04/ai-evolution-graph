---
id: gpt-oss-2025
type: event
title: "OpenAI 开放权重：gpt-oss"
title_en: "Introducing gpt-oss"
date: "2025-08-05"
importance: 7
categories: [opensource, model]
summary: "OpenAI 发布 gpt-oss-120b 与 gpt-oss-20b 两款开放权重推理模型（Apache 2.0）：可本地或私有部署，支持可调推理强度与工具调用，是 OpenAI 自 GPT-2 以来首次开放模型权重。"
significance: "开源阵营多了一个「前沿实验室出身」的重量级参与者，也说明开放权重策略已经从 Meta、DeepSeek 扩散到原本最封闭的 OpenAI。它改变了「开源 vs 闭源」的阵营叙事：分界线不再是公司身份，而是具体产品策略。"
quote: ""
speaker: ""
occasion: ""
my_comment: "最封闭的玩家开始给权重，说明「开源」已经从立场变成竞争工具；真正的问题变成：哪一层能力会被开放。"
tags: [gpt-oss, openai, open-weights, reasoning, apache-2]
sources:
  - "https://openai.com/index/introducing-gpt-oss/"
relations:
  - to: gpt-5-2025
    type: 竞争
    note: "同一公司的闭源旗舰与开放权重产品并行"
  - to: deepseek-r1-2025
    type: 竞争
    note: "开放权重推理模型赛道上的直接竞争"
needs_review: false
node_kind: model
thought_chain: opensource
thought_role: revision
thought_claim: "连最封闭的实验室也开始开放权重"
thought_summary: "OpenAI 以 Apache 2.0 开放两款推理模型权重，可在消费级与单卡环境部署，并支持推理强度调节与工具调用。它修正了「前沿能力只留在 API 后面」的叙事，说明开放与闭源是产品策略而非公司身份。"
---

## 背景

GPT-2 之后，OpenAI 长期把最强模型留在 API 后面，「闭源守前沿」几乎成了它与开源阵营的分界线。到 2025 年，开源权重已经追到推理模型，压力传导到了每一家前沿实验室。

## 核心观点

gpt-oss 系列包括 120b（面向单张 80GB GPU）与 20b（面向 16GB 显存）两个尺寸，均为 MoE 架构、Apache 2.0 许可，支持可调推理强度、完整思维链与工具调用。OpenAI 同时强调安全：模型经过对抗性微调与风险评测，开放前做了准备度评估，并把「开放权重也能被本地审查」作为论点。

## 为什么今天还要读

它是「开源 vs 闭源」讨论的转折点：当 OpenAI 也开源，阵营对立失去意义，问题变成「哪些能力开放、许可证多宽松、安全责任如何分配」。此后判断一家公司的开放性，要看具体产品，而不是它的口号。

