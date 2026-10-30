---
id: alexnet-2012
type: event
title: "AlexNet 夺冠 ImageNet"
title_en: "ImageNet Classification with Deep Convolutional Neural Networks (AlexNet)"
date: "2012-09-30"
importance: 10
categories: [architecture]
summary: "Krizhevsky、Sutskever 与 Hinton 用两块消费级 GPU 训练 8 层卷积网络 AlexNet，在 ILSVRC-2012 图像分类中把 top-5 错误率降到 15.3%，比第二名低约 10 个百分点。"
significance: "这是深度学习在主流基准上第一次以碾压性优势胜出，直接终结了手工特征时代，计算机视觉全面转向卷积网络。它也确立了「大数据 + GPU + 深网络」这一此后十年的基本范式，被视为深度学习复兴的起点。"
quote: ""
speaker: ""
occasion: ""
my_comment: "同一套方法论随后在语音、翻译、检测上被反复复制；AI 产业的算力叙事，从这里正式开场。注：ILSVRC-2012 结果于 2012 年 10 月公布，本条目日期取通行的 2012-09-30，精确到日存疑。"
tags: [alexnet, cnn, imagenet, gpu, deep-learning]
thought_chain: architecture
thought_role: thesis
sources:
  - "https://papers.nips.cc/paper_files/paper/2012/hash/c399862d3b9d6b76c8436e924a68c45b-Abstract.html"
relations:
  - to: backpropagation-1986
    type: 基于
    note: "深层 CNN 的端到端训练依赖反向传播"
needs_review: true
mainline: true
node_kind: paper
---
