---
id: resnet-2015
type: event
title: "ResNet 残差网络"
title_en: "Deep Residual Learning for Image Recognition"
date: "2015-12-10"
importance: 8
categories: [architecture]
summary: "He 等提出残差连接，让深层网络学习「输入 + 残差」而非直接拟合映射，成功训练出 152 层 ResNet，以 3.57% 的 top-5 错误率赢得 ILSVRC 2015 图像分类任务。"
significance: "残差让「更深 = 更强」重新成立，解决了深层网络的退化问题，成为此后几乎所有深度网络的标准结构。从 CNN 到 Transformer 的残差流，思路一脉相承；它也是深度学习可扩展性的第二次跃升。"
quote: ""
speaker: ""
occasion: ""
my_comment: "一个恒等映射的加法，换来的是整个领域对深度可扩展性的信心。"
tags: [resnet, residual-connections, cnn, imagenet]
sources:
  - "https://arxiv.org/abs/1512.03385"
relations:
  - to: "vgg-2014"
    type: "启发"
    note: "ResNet 在 VGG 式深层网络基础上引入残差连接"
needs_review: false
node_kind: paper
---
