---
id: operator-2025
type: event
title: "OpenAI Operator 浏览器智能体"
title_en: "Introducing Operator"
date: "2025-01-23"
importance: 7
categories: [agent, product]
summary: "OpenAI 发布 Operator 研究预览：一个能用自己的浏览器替用户完成网页任务的 agent，面向美国 Pro 订阅用户开放，由新训练的 Computer-Using Agent（CUA）模型驱动。"
significance: "Operator 把 computer-use agent 从 API 能力变成消费级产品，明确「截图感知 + 鼠标键盘动作」的技术路线。它让「agent 替你办事」第一次以订阅功能出现，也把人工接管、敏感操作确认做成了标准产品设计。"
quote: ""
speaker: ""
occasion: ""
my_comment: "Operator 的产品形态比能力更值得记住：它把「什么时候该让人接管」当成核心交互设计，而不是错误处理。"
tags: [operator, openai, agent, browser-use, cua]
sources:
  - "https://openai.com/index/introducing-operator/"
relations:
  - to: computer-use-2024
    type: 竞争
    note: "同一 computer-use agent 方向的产品化竞争"
  - to: gpt-4o-2024
    type: 基于
    note: "基于多模态感知与工具调用能力的 agent 产品化"
needs_review: false
thought_chain: agents
thought_role: advance
thought_claim: "agent 从聊天框走进浏览器，替你点完整个流程"
thought_summary: "CUA 模型通过截图与鼠标键盘动作操作浏览器，可完成订票、填表、购物等任务；Operator 以研究预览形式向美国 Pro 用户开放，并内置人工接管与敏感操作确认机制。"
---

## 背景

2024 年的 agent 大多停留在「生成文本 + 调 API」。让 agent 真正替人完成网页上的事务，需要模型能像人一样看网页、点按钮、处理弹窗与登录，这正是 computer use 路线要解决的问题。

## 核心观点

Operator 的 CUA 模型在「感知—推理—动作」循环中运行：截图进入模型，模型输出点击、输入、滚动等动作，再由浏览器执行。它强调可靠性设计：遇到需要敏感操作（如付款、登录）或不确定时主动请求人工接管。OpenAI 同时开放了 CUA 的 API 预览，让开发者构建自己的 browser agent。

## 为什么今天还要读

Operator 是「agent 即产品」的第一个大众样本：模型能力被包装成一项可订阅的服务，而信任、权限与接管体验成为竞争焦点。此后一年浏览器 agent 的形态与安全讨论，几乎都以它为参照。

