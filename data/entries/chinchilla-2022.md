---
id: chinchilla-2022
type: event
title: "Chinchilla 缩放定律修正"
title_en: "Training Compute-Optimal Large Language Models (Chinchilla)"
date: "2022-03-29"
importance: 8
categories: [model]
summary: "DeepMind 用 700 亿参数的 Chinchilla 在 1.4 万亿 token 上训练，全面超过 2800 亿参数的 Gopher，指出此前大模型「参数过多、数据不足」：给定算力下参数与训练 token 数应大致按 1:20 同步扩大。"
significance: "Chinchilla 修正了 Kaplan 等人缩放定律的结论，把「数据量」抬到与参数量同等重要的位置，直接改变了此后模型的训练配方。LLaMA、Mistral 等「小模型 + 海量数据」路线皆受其启发，也解释了为什么 2023 年后高质量数据成为比堆参数更稀缺的资源。"
quote: ""
speaker: ""
occasion: ""
my_comment: "Chinchilla 之后，「你的模型训练了多少 token」比「多少参数」更能说明水平。"
tags: [chinchilla, scaling-laws, compute-optimal, deepmind]
sources:
  - "https://arxiv.org/abs/2203.15556"
relations:
  - to: scaling-laws-2020
    type: 启发
    note: "对 Kaplan 等人缩放定律的修正与延续：同等算力下参数与 token 数应同步扩大"
needs_review: false
node_kind: paper
---
