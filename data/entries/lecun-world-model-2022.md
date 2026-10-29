---
id: lecun-world-model-2022
type: insight
title: "LeCun 的世界模型路线图"
title_en: "A Path Towards Autonomous Machine Learning"
date: "2022-06-23"
importance: 6
categories: [thought]
summary: "Yann LeCun 发表立场论文，提出以联合嵌入预测架构（JEPA）、世界模型与分层规划为核心的自主机器学习蓝图，主张机器应像动物一样通过自监督学习世界模型，而非只做下一 token 预测。"
significance: "这篇论文为「世界模型」研究提供了完整的概念框架，成为此后 V-JEPA、Dreamer 与机器人基础模型等路线的理论参照；它也标志着 LeCun 与主流自回归 LLM 路线公开分歧的起点。"
quote: "How could machines learn as efficiently as humans and animals?"
speaker: "Yann LeCun"
occasion: "立场论文《A Path Towards Autonomous Machine Learning》（OpenReview，2022 年 6 月）"
my_comment: "这篇论文提出的不是又一个模型，而是一张「智能应该由哪些模块组成」的工程图纸。"
tags: [world-model, jepa, self-supervised, lecun]
sources:
  - "https://openreview.net/forum?id=BZ5a1r-kVsf"
relations: []
thought_chain: worldmodel
thought_role: advance
thought_claim: "没有世界模型，就没有真正的通用智能"
thought_summary: "智能体需要在内部建立可预测世界的模型来做规划；纯自回归的 token 预测缺少对世界的结构化理解，难以走向通用智能。"
needs_review: false
node_kind: person
---

## 背景

2022 年 6 月，Yann LeCun 在 OpenReview 发表立场论文《A Path Towards Autonomous Machine Learning》。当时 GPT-3 已经展示出 scaling 的威力，主流路线相信「预测下一个 token」足以通向通用智能。LeCun 却从另一个问题出发：为什么动物和人类只需极少样本就能学会新技能？如果答案不是更大的自回归模型，那机器的学习架构应该长什么样？

## 核心观点

论文给出一个模块化蓝图：感知模块把高维输入压缩成表示；世界模型在抽象表示空间中预测未来状态；代价模块评估「好与坏」；演员模块依据世界模型规划动作；短时记忆维持状态。核心是联合嵌入预测架构（JEPA）——不去重建像素或 token，而是在表示空间预测未来，从而忽略不可预测的细节，学到可用于规划的抽象。LeCun 强调智能体需要在多个时间尺度上分层规划，而世界模型正是让「想象未来」成为可能的那块组件；他还主张自监督学习是机器像动物一样高效学习的关键。

## 为什么今天还要读

这篇论文把「世界模型」从一句口号变成可拆解的系统设计，此后 V-JEPA、Dreamer、机器人基础模型等路线都能在其中找到坐标。它同样是一份路线分歧的宣言：LeCun 后来多次公开质疑自回归 LLM 能否通向 AGI，而这篇论文是他的替代方案底稿。今天读它的价值不在于判断谁对，而在于理解一场仍在进行的方法论竞争：语言模型的「预测下一词」与具身智能的「预测世界状态」，究竟谁更接近通用智能。
