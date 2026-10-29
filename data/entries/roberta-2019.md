---
id: roberta-2019
type: event
title: "RoBERTa 稳健预训练"
title_en: "RoBERTa: A Robustly Optimized BERT Pretraining Approach"
date: "2019-07-26"
importance: 6
categories: [model]
summary: "Facebook AI 提出 RoBERTa：在 BERT 基础上用更长训练、更大批次、更多数据并去掉下一句预测任务，在 GLUE 等基准上稳定超过 BERT。"
significance: "RoBERTa 用一组训练配方实验说明 BERT 的能力被严重低估，超参数与数据规模比结构改动更能决定性能。它成为预训练模型复现与评测的社区标准基线，也强化了「训练配方本身就是研究」的认知。"
quote: ""
speaker: ""
occasion: ""
my_comment: "同样的结构，换一套训练配方就能涨点——这是 2019 年最实用的一课。"
tags: [roberta, bert, pretraining, nlp]
sources:
  - "https://arxiv.org/abs/1907.11692"
relations:
  - to: bert-2018
    type: 基于
    note: "沿用 BERT 架构，优化预训练数据与训练策略"
needs_review: false
node_kind: model
---
