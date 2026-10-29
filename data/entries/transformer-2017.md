---
id: transformer-2017
type: event
title: "Transformer 架构提出"
title_en: "Attention Is All You Need"
date: "2017-06-12"
importance: 10
categories: [architecture, model]
summary: "Google 团队提出完全基于自注意力与位置编码的 Transformer，抛弃循环与卷积结构，在 WMT'14 英德翻译上取得 28.4 BLEU 的新 SOTA。"
significance: "自注意力可高度并行，训练能吃下更多数据与算力，Transformer 由此成为 GPT、BERT 乃至今天所有主流大模型的共同底座。它把 NLP 从「任务专用结构」推向「通用可扩展架构」，是深度学习时代影响最大的一次架构收敛。"
quote: ""
speaker: ""
occasion: ""
my_comment: "论文标题的断言「注意力就是你所需要的一切」，在七年后的每一块 GPU 上被反复验证。"
tags: [transformer, self-attention, architecture, nlp]
sources:
  - "https://arxiv.org/abs/1706.03762"
relations:
  - to: attention-2014
    type: 基于
    note: "继承注意力思想，但用自注意力彻底取代循环结构"
needs_review: false
node_kind: paper
---
