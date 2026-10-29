---
id: chinchilla-paper-2022
type: insight
title: "Chinchilla：大模型其实训练不足"
title_en: "Training Compute-Optimal Large Language Models"
date: "2022-03-29"
importance: 6
categories: [thought]
summary: "DeepMind 用 400 多个模型重新推导算力最优配比，直指当时的大模型「被严重训练不足」：算力固定时，模型规模与训练 token 数应同步翻倍。"
significance: "Chinchilla 修正了 2020 年 Scaling Laws 的参数优先结论，把训练数据抬到与参数量同等重要的位置。它让「小模型 + 海量数据」成为 2023 年后的主流配方，也让高质量数据成为比参数更稀缺的资源。"
quote: "We find that current large language models are significantly undertrained, a consequence of the recent focus on scaling language models whilst keeping the amount of training data constant."
speaker: "Jordan Hoffmann et al.（DeepMind）"
occasion: "论文《Training Compute-Optimal Large Language Models》（arXiv:2203.15556）"
my_comment: "它没有推翻缩放定律，而是修正了「缩放什么、怎么缩放」——这恰恰是科学最健康的姿态。"
tags: [chinchilla, scaling-laws, compute-optimal, deepmind]
sources:
  - "https://arxiv.org/abs/2203.15556"
relations:
  - to: scaling-laws-2020
    type: 启发
    note: "在 Kaplan 等人缩放定律的基础上修正参数与数据的配比"
thought_chain: scaling
thought_role: revision
thought_claim: "模型不是参数不够，而是训练数据不够"
thought_summary: "Chinchilla 用 400 多个模型重新推导算力最优配比：参数量与训练 token 数应同步翻倍，当时的大模型被严重训练不足。"
needs_review: false
node_kind: paper
---

## 背景

2020 年，Kaplan 等人的 Scaling Laws 给出一个简单有力的直觉：固定算力下，模型越大越好。行业由此进入参数竞赛。2022 年，DeepMind 用 400 多个从 7000 万到 160 亿参数的模型，重新做了系统的算力最优实验。

## 核心观点

Chinchilla 摘要直言：当时的大模型「被严重训练不足」，原因是只顾放大参数、训练数据量却保持不变。他们发现，算力最优训练时模型规模与训练 token 数应同步翻倍；用同样算力训练的 700 亿参数 Chinchilla，全面超过 2800 亿参数的 Gopher。结论：数据与参数同等重要，此前大量参数被浪费了。

## 为什么今天还要读

它纠正了一整代人的训练配方，让「小模型 + 海量数据」成为 2023 年后的主流路线，也让高质量数据取代参数成为最稀缺的资源。它同时是「论文结论会被下一代实验修正」的最佳案例——包括它自己后来也被新数据挑战。
