---
id: megatron-turing-2021
type: event
title: "Megatron-Turing NLG 530B"
title_en: "Megatron-Turing NLG 530B"
date: "2021-10-11"
importance: 7
categories: [model, architecture]
summary: "微软与 NVIDIA 联合发布 Megatron-Turing NLG 530B：5300 亿参数的自回归语言模型，在约 2700 亿 token 上训练，是当时公开报道中最大的稠密语言模型。"
significance: "它延续了「更大即更强」的稠密模型竞赛，验证了 Megatron-LM 与 DeepSpeed 的 3D 并行能在千亿参数级稳定训练。其「全部参数都激活」的稠密路线很快被 MoE 与「更小模型 + 更多数据」部分取代，但工程经验成为后续大模型训练基础设施的公共资产。"
quote: ""
speaker: ""
occasion: ""
my_comment: "530B 的意义不在参数本身，而在于它把「万卡级训练工程」变成了可复制的流程。"
tags: [megatron-turing, large-language-model, dense-model, distributed-training]
sources:
  - "https://venturebeat.com/technology/microsoft-and-nvidia-team-up-to-train-one-of-the-worlds-largest-language-models"
relations:
  - to: transformer-2017
    type: 基于
    note: "采用 Transformer 解码器架构的稠密自回归语言模型"
  - to: megatron-lm-2019
    type: 基于
    note: "沿用 Megatron-LM 的模型并行与训练栈扩展到 530B"
  - to: gpt-3-2020
    type: 启发
    note: "延续 GPT-3 开启的稠密语言模型规模竞赛"
  - to: a100-2020
    type: 基于
    note: "530B 模型在 NVIDIA A100 集群上训练"
needs_review: false
node_kind: model
---
