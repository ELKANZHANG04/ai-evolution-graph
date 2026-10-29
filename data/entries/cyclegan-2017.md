---
id: cyclegan-2017
type: event
title: "CycleGAN 无配对图像翻译"
title_en: "Unpaired Image-to-Image Translation Using Cycle-Consistent Adversarial Networks"
date: "2017-03-30"
importance: 5
categories: [architecture, multimodal]
summary: "Zhu 等提出 CycleGAN，用循环一致性损失在没有成对样本的情况下实现马与斑马、照片与油画等图像风格转换。"
significance: "CycleGAN 把「无需配对数据」的图像翻译变成现实，显著扩展了生成模型的应用边界。循环一致性约束也成为无监督域迁移中被反复借用的核心思想。"
quote: ""
speaker: ""
occasion: ""
my_comment: "没有配对数据也能学会翻译，这个想法比结果图更值得记住。"
tags: [cyclegan, gan, image-translation, unsupervised]
sources:
  - "https://arxiv.org/abs/1703.10593"
relations:
  - to: gan-2014
    type: 基于
    note: "以 GAN 对抗训练为框架，额外加入循环一致性约束"
needs_review: false
node_kind: paper
---
