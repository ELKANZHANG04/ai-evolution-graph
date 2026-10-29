---
id: word2vec-2013
type: event
title: "word2vec 词向量"
title_en: "Efficient Estimation of Word Representations in Vector Space"
date: "2013-01-16"
importance: 7
categories: [architecture, model]
summary: "Mikolov 等在 arXiv 发表 word2vec：用浅层神经网络在超大语料上高效训练词向量，CBOW 与 Skip-gram 两种结构都把词语映射到连续向量空间，并展示出 king - man + woman ≈ queen 式的语义线性关系。"
significance: "词向量把离散的词语符号变成可计算的连续表示，让语义相似度第一次能被工程化利用，是 NLP 深度化的第一块基石。skip-gram 加负采样的训练方式足够快，word2vec 迅速成为工业界标配，并把「预训练表示」的思路带进 NLP。"
quote: ""
speaker: ""
occasion: ""
my_comment: "词向量的加法算术，是那几年最容易向非技术听众解释的 AI demo。"
tags: [word2vec, word-embeddings, nlp, representation-learning]
sources:
  - "https://arxiv.org/abs/1301.3781"
relations: []
needs_review: false
node_kind: paper
---
