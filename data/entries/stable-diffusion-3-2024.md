---
id: stable-diffusion-3-2024
type: event
title: "Stable Diffusion 3 发布"
title_en: "Stable Diffusion 3"
date: "2024-06-12"
importance: 6
categories: [opensource, multimodal]
summary: "Stability AI 发布 Stable Diffusion 3（先开放 Medium 版本），采用 MMDiT 架构与 rectified flow 训练，显著改善文字渲染与多主体生成，并公布开源权重计划。"
significance: "SD3 把图像生成的主干从 U-Net 转向 Transformer（DiT 路线），与视频生成、统一多模态模型的技术栈走向收敛。其迟到的开源与许可证争议，也折射出开源生成模型在商业压力下的摇摆。"
quote: ""
speaker: ""
occasion: ""
my_comment: "从 U-Net 到 DiT，扩散模型和语言模型终于在架构上「说同一种语言」。"
tags: [stable-diffusion-3, diffusion, mmdit, stability-ai]
sources:
  - "https://arxiv.org/abs/2403.03206"
  - "https://huggingface.co/stabilityai/stable-diffusion-3-medium"
relations:
  - to: stable-diffusion-2022
    type: 基于
    note: "Stability 同一产品线的下一代扩散模型，改用 rectified flow 与 MMDiT"
needs_review: false
node_kind: model
---
