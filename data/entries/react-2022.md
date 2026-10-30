---
id: react-2022
type: event
title: "ReAct：边推理边行动"
title_en: "ReAct: Synergizing Reasoning and Acting in Language Models"
date: "2022-10-06"
importance: 7
categories: [agent, model]
summary: "Yao 等提出 ReAct：让语言模型交替生成推理轨迹与行动，边想边调用工具、观察结果再修正，在 HotpotQA、ALFWorld 等语言与决策任务上优于既有基线，并提升可解释性。"
significance: "ReAct 确立了现代 agent 的基本循环：思考—行动—观察。它把规划从一次性输出变成与环境耦合的过程，是此后 function calling、浏览器与电脑操作 agent 的思想原型。"
quote: ""
speaker: ""
occasion: ""
my_comment: "ReAct 之后，「会调用工具」不再是一个功能点，而是模型与世界交互的默认协议。"
tags: [react, tool-use, reasoning, agent]
sources:
  - "https://arxiv.org/abs/2210.03629"
relations: []
needs_review: false
thought_chain: generative-decision
thought_role: advance
---

## 背景

2022 年的语言模型已经会推理（思维链）也会行动（生成 API 调用），但两条线是分开的：要么先想完再做，要么直接出动作、不解释。真实任务往往需要在行动中学到新信息，再调整下一步。

## 核心观点

ReAct 让模型在同一个输出流里交替生成「思考」与「动作」：思考帮助模型规划、追踪进度和处理异常，动作让模型查询知识库或操作环境并拿到观察结果，再进入下一轮。在 HotpotQA、ALFWorld 等任务上，它同时赢过纯推理与纯行动基线。

## 为什么今天还要读

它是今天所有 agent 框架的公共祖先：规划不再是写完就不变的草稿，而是在行动反馈中持续被修订的过程。理解 ReAct，就理解了「为什么 agent 需要工具与环境」。
