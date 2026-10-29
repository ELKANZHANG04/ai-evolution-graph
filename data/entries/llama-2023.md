---
id: llama-2023
type: event
title: "LLaMA 开源"
title_en: "LLaMA: Open and Efficient Foundation Language Models"
date: "2023-02-24"
importance: 8
categories: [opensource, model]
summary: "Meta 发布 LLaMA 系列基础模型（7B/13B/33B/65B），仅用公开数据训练 1 到 1.4 万亿 token；13B 版本在多数基准上超过 1750 亿参数的 GPT-3，权重以研究许可发布。"
significance: "LLaMA 证明了「更小模型 + 更多高质量 token」可以逼近甚至超过大得多的模型，重写了人们对参数效率的认知。研究许可权重流出后迅速催生 Alpaca、Vicuna、llama.cpp 等生态，成为开源大模型浪潮的起点，也让「权重开放」成为持续的产业与政策议题。"
quote: ""
speaker: ""
occasion: ""
my_comment: "LLaMA 的真正冲击发生在权重泄漏之后：一个非商用研究许可，意外点燃了此后两年最活跃的开源模型社区。"
tags: [llama, open-weights, meta, language-model]
sources:
  - "https://arxiv.org/abs/2302.13971"
relations:
  - to: transformer-2017
    type: 基于
    note: "采用 Transformer 解码器架构"
  - to: chinchilla-2022
    type: 启发
    note: "采用「更小模型 + 更多高质量 token」的 Chinchilla 式配方"
needs_review: false
mainline: true
node_kind: model
---
