---
id: diffusion-policy-2023
type: event
title: "Diffusion Policy：用扩散模型生成动作"
title_en: "Diffusion Policy: Visuomotor Policy Learning via Action Diffusion"
date: "2023-03-07"
importance: 6
categories: [model, agent]
summary: "Chi 等提出 Diffusion Policy：用扩散模型生成机器人动作序列，把视觉运动策略学习写成去噪过程，在 4 个机器人操作基准的 12 个任务上平均比当时最优方法提升 46.9%。"
significance: "它把扩散模型从图像生成搬到行动生成，天然处理多模态动作分布，训练也更稳定，成为 VLA 之前机器人策略学习的主流方法之一。也说明生成式建模正在从「内容」扩展到「行为」。"
quote: ""
speaker: ""
occasion: ""
my_comment: "机器人动作天然是多解的：绕过杯子可以从左也可以从右。扩散模型恰好擅长表达这种「多峰」分布。"
tags: [diffusion-policy, imitation-learning, robotics, diffusion]
sources:
  - "https://arxiv.org/abs/2303.04137"
relations: []
needs_review: false
thought_chain: generative-decision
thought_role: advance
---

## 背景

机器人模仿学习长期用回归或高斯策略预测动作，但人类演示的动作分布往往是多峰的——同一个任务有多种合理做法。单峰回归会把多种做法平均成不存在的「中间动作」，导致执行失败。

## 核心观点

Diffusion Policy 把策略表示为动作序列上的扩散过程：从噪声出发，迭代去噪得到一条可行的动作轨迹。它因此能表达多模态动作分布、适配高维动作空间，训练也更稳定。论文在 4 个操作基准的 12 个任务上平均比当时最优方法提升 46.9%。

## 为什么今天还要读

它让「生成」从图像、文本走进控制领域，为后来的 VLA 与通用机器人策略提供了方法论。也提醒我们：决策不一定是选一个动作，也可以是从分布里「生成」一条轨迹。
