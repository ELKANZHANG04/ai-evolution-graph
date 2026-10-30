---
id: computer-use-2024
type: event
title: "Claude 计算机操作能力公开测试"
title_en: "Introducing Computer Use in Claude 3.5 Sonnet"
date: "2024-10-22"
importance: 7
categories: [agent, multimodal]
summary: "Anthropic 发布升级版 Claude 3.5 Sonnet 与 Claude 3.5 Haiku，并首次以公开 beta 形式提供 computer use：模型通过截屏观察屏幕，移动光标、点击与输入，像人一样操作计算机。"
significance: "computer use 把 agent 的操作界面从 API 与工具扩展到整个图形界面，意味着智能体能操作没有开放 API 的软件，也把权限、提示注入与可审计性推到安全前台。它与 2025 年 OpenAI Operator 等产品共同定义了「computer-use agent」这条新赛道。"
quote: ""
speaker: ""
occasion: ""
my_comment: "让模型用鼠标键盘，本质上是把整个软件生态（包括没有 API 的长尾）变成了 agent 的工具箱，代价是攻击面也一起放大。"
tags: [computer-use, agent, anthropic, screen-control]
sources:
  - "https://www.anthropic.com/news/3-5-models-and-computer-use"
relations:
  - to: gpt-4o-2024
    type: 启发
    note: "延续实时多模态交互方向，把感知—动作循环用于操作电脑"
needs_review: false
node_kind: model
thought_chain: agents
thought_role: advance
thought_claim: "让模型用鼠标和键盘操作整台电脑"
thought_summary: "Claude 通过截图感知屏幕，并生成鼠标与键盘动作完成任务；这是前沿模型首次以公开 beta 提供通用计算机操作能力，把 agent 的工作面从 API 扩展到图形界面。"
---

## 背景

在 computer use 之前，agent 的工具是 API：开发者要先把每个系统封装成函数。但大量真实软件没有 API，人的工作方式就是「看屏幕、点鼠标、敲键盘」。

## 核心观点

Anthropic 让模型在循环中截屏、推理、输出动作（移动光标、点击、输入、滚动），再由外部程序执行并回传新截图。升级版 Claude 3.5 Sonnet 在该能力上领先，Claude 3.5 Haiku 也同步发布。官方强调这是 beta，存在错误与安全风险：模型可能被网页里的提示注入操纵，因此敏感操作需要人工确认。

## 为什么今天还要读

它定义了 computer-use agent 的基本范式，也提前暴露了此后一整年的产品与安全问题：如何授予权限、如何人工接管、如何审计 agent 的每一步操作。当 agent 真的开始「用电脑」，安全边界就从模型输出转移到了真实世界。

