---
id: quo-vadis-world-modeling-2026
type: insight
title: "世界模型的下一个方向：给 agent 的信息代理"
title_en: "Quo Vadis, World Modeling?"
date: "2026-08-03"
importance: 6
categories: [thought, model]
summary: "立场论文提出「以 agent 为中心的世界代理」：世界模型不只预测物理状态，还提供 agent 可用的信息转换（执行结果、检索经验或技能、验证信号），并梳理六类功能形态与三层使用方式。"
significance: "它把世界模型从「更准的视频预测」拓展为「为持续学习的 agent 提供反馈」，为 2026 年世界模型与 agent 训练的合流提供概念框架；也提示评估世界模型的标准应是「对 agent 是否有用」，而不只是生成质量。"
quote: "In this work, we conceptualize Agent-Centric Interactive World Proxies, shifting the fundamental paradigm from physical state transitions to agent-usable information transitions, such as execution outcomes, retrieved experiences or skills, and verification signals"
speaker: "Yu Yang et al."
occasion: "论文《Quo Vadis, World Modeling?》（arXiv:2608.02713，2026-08-03）"
my_comment: "当世界模型的用户从「人」变成「agent」，评价标准就从像不像世界，变成有没有用。"
tags: [world-model, agent, interactive-proxy, evaluation]
sources:
  - "https://arxiv.org/abs/2608.02713"
relations:
  - to: lecun-world-model-2022
    type: 启发
    note: "在世界模型传统之上，把「可预测世界」重写为「可服务 agent 的信息代理」"
needs_review: false
node_kind: paper
thought_chain: worldmodel
thought_role: revision
thought_claim: "世界模型的价值，是给 agent 提供可用的反馈"
thought_summary: "论文把世界模型重新定义为「以 agent 为中心的世界代理」：从预测物理状态转向提供执行结果、经验技能与验证信号等信息转换，并提出六类形态与三层使用方式。"
---

## 背景

经典世界模型关注「预测未来物理状态」，评估也围绕画面或状态预测精度。但当 agent 需要持续改进时，它真正缺的往往不是更清晰的未来画面，而是可执行的反馈：这一步做了什么、结果如何、是否验证通过。

## 核心观点

论文提出 Agent-Centric Interactive World Proxies：把世界模型的核心从物理状态转换，改写为 agent 可用的信息转换——执行结果、检索到的经验或技能、验证信号等。作者按反馈模态划分出动力学、空间、执行、记忆/经验、技能、奖励/验证六类代理，并给出三层用途：推理时指导（丰富上下文）、训练时优化（奖励、批评、合成 rollout）、agent 与代理共同演化。

## 为什么今天还要读

它把世界模型的讨论从「生成得更真」拉回「对 agent 更有用」，为 2026 年世界模型与 agent 训练的合流提供了清晰框架。对做 agent 的团队而言，这意味着可以把昂贵的环境交互替换成低成本的世界代理；对研究者而言，它给出了新的评估维度——代理的输出是否真的让 agent 变得更好。
