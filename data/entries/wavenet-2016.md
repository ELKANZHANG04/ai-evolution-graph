---
id: wavenet-2016
type: event
title: "WaveNet 语音合成"
title_en: "WaveNet: A Generative Model for Raw Audio"
date: "2016-09-12"
importance: 6
categories: [model]
summary: "DeepMind 提出 WaveNet，用空洞因果卷积逐样本生成原始音频波形，把语音合成的自然度大幅推近人类水平。"
significance: "WaveNet 证明自回归生成模型可以直接建模高采样率音频，其主观音质评分首次接近真人录音，重新定义了 TTS 的技术路线。空洞卷积与波形生成的思想后来外溢到语音、音乐与通用序列建模。"
quote: ""
speaker: ""
occasion: ""
my_comment: "把「生成一张图」换成「生成 16000 个采样点每秒」，WaveNet 让人第一次听到神经网络的语气。"
tags: [wavenet, speech-synthesis, autoregressive, deepmind]
sources:
  - "https://arxiv.org/abs/1609.03499"
relations: []
needs_review: false
node_kind: paper
---
