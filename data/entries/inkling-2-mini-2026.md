---
id: "inkling-2-mini-2026"
type: "event"
title: "Thinking Machines 开源 Inkling 2 Mini：26.4B/5.4B 激活，中间层循环三次"
title_en: "Thinking Machines Inkling 2 Mini"
date: "2026-11-21"
importance: 6
categories: [model, opensource]
summary: "11 月 21 日，Thinking Machines Lab 发布 Inkling 2 Mini：26.4B 总参数、5.4B 激活的开放权重模型，核心是「中间层循环三次」的 looped Transformer——同一组中间层重复计算，在不增加参数量的前提下加深单步推理。模型支持编程、computer use 与视觉设计，可在笔记本/Apple Silicon 本地运行；Ollama 0.40.17 预发布版已支持，Exo Labs 实测在 96GB M5 Ultra Mac Studio 上解码 210 tok/s、48GB M5 Max MacBook Pro 上 125 tok/s。Hugging Face 称 transformers/llama.cpp/MLX 均已支持。"
significance: "小模型「靠循环层堆算力」从论文走向可下载权重：Inkling 2 Mini 用 26B/5B 激活实现本地可跑的长链推理，直接挑战「参数越大越强」的 scaling 叙事。对开发者和端侧 AI，这是低成本本地 Agent 的新选项；对开源社区，则是一次「架构效率 vs 参数规模」的公开实验。"
quote: ""
speaker: ""
occasion: ""
my_comment: "210/125 tok/s 是特定硬件与量化条件；循环层带来的推理延迟/显存开销与真实任务收益仍需第三方复测。"
tags: [海外, ThinkingMachines, Inkling2Mini, 开源权重, LoopedTransformer, 端侧]
sources:
  - "https://thinkingmachines.ai/news/inkling-2-mini/"
  - "https://www.cnblogs.com/itech/p/23737873"
relations:
  - to: "inkling-2-small-2026"
    type: "基于"
    note: "Inkling 2 系列从 594B 旗舰下探到 26B 本地模型"
needs_review: false
node_kind: model
added_at: "2026-11-22"
---
