---
id: stable-diffusion-2022
type: event
title: "Stable Diffusion 开源"
title_en: "Stable Diffusion: High-Resolution Image Synthesis with Latent Diffusion Models"
date: "2022-08-22"
importance: 8
categories: [opensource, multimodal, model]
summary: "Stability AI 与慕尼黑大学 CompVis 团队公开发布 Stable Diffusion：基于潜在扩散模型、在 LAION 图文数据上训练，权重开放，普通消费级 GPU 即可生成 512×512 图像。"
significance: "开放权重让文生图从研究演示变成大众工具，LoRA、ControlNet、ComfyUI 等生态在数月内爆发，「本地跑模型」成为创作者与研究者的默认选项。它也把生成内容的版权、安全与算力民主化争论推到了台前。"
quote: ""
speaker: ""
occasion: ""
my_comment: "Stable Diffusion 的开放权重是生成式 AI 开源阵营的里程碑：它让「人人可微调」从口号变成消费级显卡上的现实。"
tags: [stable-diffusion, latent-diffusion, text-to-image, open-weights]
sources:
  - "https://arxiv.org/abs/2112.10752"
  - "https://stability.ai/news/stable-diffusion-public-release"
  - "https://github.com/CompVis/stable-diffusion"
relations:
  - to: clip-2021
    type: 基于
    note: "使用 CLIP 类文本编码器（OpenCLIP ViT-L/14）把文本条件注入扩散模型"
mainline: true
needs_review: false
node_kind: model
---
