---
id: seq2seq-2014
type: event
title: "Seq2Seq 序列到序列学习"
title_en: "Sequence to Sequence Learning with Neural Networks"
date: "2014-09-10"
importance: 7
categories: [architecture]
summary: "Sutskever、Vinyals 与 Le 用两个多层 LSTM 构成编码器–解码器：先把源语言句子编码成定长向量，再解码出目标语言，在 WMT'14 英法翻译上取得当时最佳的 BLEU 34.8。"
significance: "它让神经机器翻译第一次在标准任务上稳定超过统计机器翻译，并确立了「编码器–解码器 + 定长语义向量」这一通用序列建模范式。这一骨架接上注意力机制后，直接演化为今天机器翻译与大模型的基础结构。"
quote: ""
speaker: ""
occasion: ""
my_comment: "定长向量的信息瓶颈很快被注意力打破，但「先编码、再解码」的骨架一直用到了 Transformer。"
tags: [seq2seq, lstm, machine-translation, encoder-decoder]
sources:
  - "https://arxiv.org/abs/1409.3215"
relations: []
needs_review: false
node_kind: paper
---
