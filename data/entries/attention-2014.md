---
id: attention-2014
type: event
title: "注意力机制（Bahdanau Attention）"
title_en: "Neural Machine Translation by Jointly Learning to Align and Translate"
date: "2014-09-01"
importance: 7
categories: [architecture]
summary: "Bahdanau、Cho 与 Bengio 在 RNN 编码器–解码器上引入对齐模型，让解码器每一步自适应地聚焦源句的不同位置，显著提升了长句翻译质量。"
significance: "注意力机制解决了定长语义向量的信息瓶颈，成为神经机器翻译的标准组件。它让模型可以显式学习输入与输出的对应关系，也为三年后的 Transformer 铺平了道路——这是现代深度学习中影响最深远的一个小模块。"
quote: ""
speaker: ""
occasion: ""
my_comment: "今天所有大模型里的「注意力」都源出于此，只是它从 RNN 的辅助模块变成了唯一主角。"
tags: [attention, neural-machine-translation, encoder-decoder, bahdanau]
sources:
  - "https://arxiv.org/abs/1409.0473"
relations: []
needs_review: false
node_kind: paper
---
