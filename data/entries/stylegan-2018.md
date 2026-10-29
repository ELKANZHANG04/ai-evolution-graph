---
id: stylegan-2018
type: event
title: "StyleGAN 高分辨率人脸生成"
title_en: "A Style-Based Generator Architecture for Generative Adversarial Networks"
date: "2018-12-12"
importance: 6
categories: [architecture, multimodal]
summary: "NVIDIA 提出 StyleGAN，用风格注入与逐层噪声控制生成 1024×1024 高分辨率人脸，首次让 GAN 生成图达到难以与人脸照片区分的程度。"
significance: "StyleGAN 把生成图像的质量与可控性同时推上新台阶，其「映射网络 + 风格调制」结构成为后续生成模型的重要参考。它也让深度伪造与合成数据的社会议题走到台前。"
quote: ""
speaker: ""
occasion: ""
my_comment: "StyleGAN 让「不存在的人」成为一门产业：合成人脸从此同时是技术成就与治理难题。"
tags: [stylegan, gan, image-generation, nvidia]
sources:
  - "https://arxiv.org/abs/1812.04948"
relations:
  - to: gan-2014
    type: 基于
    note: "在 GAN 对抗训练框架上重构生成器的风格调制结构"
needs_review: false
node_kind: paper
---
