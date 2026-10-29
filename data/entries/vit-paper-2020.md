---
id: vit-paper-2020
type: insight
title: "ViT：视觉不再需要卷积"
title_en: "An Image is Worth 16x16 Words"
date: "2020-10-22"
importance: 6
categories: [thought]
summary: "Google 团队的 ViT 论文证明：对 CNN 的依赖并非必要，把图像切成 16×16 patch 当作 token 序列直接喂给标准 Transformer，就能在图像分类上表现优异。"
significance: "ViT 把「通用架构 + 大数据胜过手工归纳偏置」的赌注从语言推到视觉，证明 Transformer 也能统一处理图像。它成为几乎全部多模态模型（CLIP、DALL·E、Gemini、GPT-4V）的视觉编码器基石。"
quote: "We show that this reliance on CNNs is not necessary and a pure transformer applied directly to sequences of image patches can perform very well on image classification tasks."
speaker: "Alexey Dosovitskiy et al.（Google Research, Brain Team）"
occasion: "论文《An Image is Worth 16x16 Words: Transformers for Image Recognition at Scale》（arXiv:2010.11929，ICLR 2021）"
my_comment: "ViT 的潜台词是：当数据足够大时，归纳偏置会从优势变成负担。"
tags: [vit, transformer, computer-vision, architecture]
sources:
  - "https://arxiv.org/abs/2010.11929"
relations:
  - to: transformer-2017
    type: 基于
    note: "直接复用 Transformer 编码器，把图像 patch 当作 token 序列"
thought_chain: architecture
thought_role: advance
thought_claim: "视觉也不需要卷积，纯 Transformer 同样能打"
thought_summary: "ViT 把图像切成 patch 当作 token，用标准 Transformer 直接分类；在超大规模数据预训练下，它证明对 CNN 的依赖并非必要。"
needs_review: false
node_kind: paper
---

## 背景

Transformer 在 NLP 成功后，视觉领域仍以 CNN 为主，注意力要么与卷积配合，要么只替换其中某些组件。2020 年，ViT 团队决定做一次极端实验：把图像切成 16×16 的 patch，当作 token 序列，直接输入标准 Transformer。

## 核心观点

摘要明确断言：对 CNN 的依赖「并不必要」，纯 Transformer 直接在图像 patch 序列上训练就能在分类任务上表现很好。在超大规模数据预训练后，ViT 以更少的训练算力超过当时最强的卷积网络。它把「大数据 + 通用架构胜过手工归纳偏置」的赌注从语言推到了视觉。

## 为什么今天还要读

ViT 成为 CLIP、DALL·E、Gemini、GPT-4V 等几乎所有多模态模型的视觉编码器基石，宣告「架构收敛」从 NLP 扩展到视觉。理解它，就理解了多模态时代为何共享同一个主干，以及为什么「数据规模」是架构选择的隐藏变量——数据够大时，连卷积的先验都可以让位。
