---
id: imagen-2022
type: event
title: "Google Imagen"
title_en: "Imagen: Photorealistic Text-to-Image Diffusion Models with Deep Language Understanding"
date: "2022-05-23"
importance: 6
categories: [multimodal, model]
summary: "Google 发布 Imagen：用一个冻结的大语言模型（T5-XXL）编码文本，再用级联扩散模型生成 1024×1024 图像，在 COCO 上取得当时最佳的零样本 FID，并提出 DrawBench 评测集。"
significance: "Imagen 证明了「语言理解越强，图像生成越好」：大规模文本编码器是文生图质量的关键变量，而不只取决于视觉端。它推动 Google 在文生图方向持续投入，也让人工偏好评测成为生成模型评估的标配，为 Imagen 系列与后来的 Gemini 图像能力铺路。"
quote: ""
speaker: ""
occasion: ""
my_comment: "Imagen 的结论很反直觉：提升文生图最有效的一步，可能是把文本模型做大。"
tags: [imagen, text-to-image, diffusion, t5]
sources:
  - "https://arxiv.org/abs/2205.11487"
  - "https://imagen.research.google/"
relations:
  - to: "ddpm-2020"
    type: "启发"
    note: "Imagen 采用扩散模型路线生成图像"
  - to: t5-2019
    type: 基于
    note: "用冻结的 T5-XXL 作为文本编码器"
needs_review: false
node_kind: model
---
