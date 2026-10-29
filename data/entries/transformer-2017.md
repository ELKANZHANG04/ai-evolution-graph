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
  - to: "palm-2022"
    type: "奠基"
    note: "PaLM 采用 Transformer 解码器架构"
  - to: "gato-2022"
    type: "奠基"
    note: "Gato 使用统一 Transformer 序列建模"
  - to: "whisper-2022"
    type: "奠基"
    note: "Whisper 使用 Transformer 编码器-解码器"
  - to: "gemini-1-2023"
    type: "奠基"
    note: "Gemini 基于 Transformer 架构"
  - to: "mistral-7b-2023"
    type: "奠基"
    note: "Mistral 7B 为 Transformer 架构开源模型"
  - to: "qwen-2023"
    type: "奠基"
    note: "Qwen 为 Transformer 架构开源模型"
  - to: "falcon-2023"
    type: "奠基"
    note: "Falcon 为 Transformer 架构开源模型"
  - to: "dalle-1-2021"
    type: "奠基"
    note: "DALL·E 使用 Transformer 生成图像 token"
  - to: "seq2seq-2014"
    type: "启发"
    note: "Transformer 用注意力替代 RNN，接续 Seq2Seq 编码器-解码器思路"
mainline: true
needs_review: false
node_kind: paper
---
