---
id: chatbot-arena-2023
type: product
title: "Chatbot Arena：用人类盲测排行取代静态基准"
title_en: "Chatbot Arena: An Open Platform for Evaluating LLMs by Human Preference"
date: "2023-05-03"
importance: 7
categories: [product, model, thought]
summary: "LMSYS 团队上线 Chatbot Arena：用户匿名与两个随机模型对话、投票选出更好的回答，再用 Elo/Bradley-Terry 模型汇总成实时排行榜。它把评测从「固定试卷」变成「持续进行的众包对战」。"
significance: "Chatbot Arena 解决了静态基准的两个难题：题目会被刷、能力无法覆盖开放对话。它让「人类偏好」成为可规模化的评测信号，也让模型排名变成每周更新的公共话题；同时带来了风格偏好、刷票与可复现性等新争议。"
quote: ""
speaker: ""
occasion: ""
my_comment: "Arena 是「评测即产品」的典型：排行榜本身成了流量入口，也成了厂商发布新模型时必争的位置。"
tags: [chatbot-arena, evaluation, human-preference, elo, lmsys]
sources:
  - "https://lmsys.org/blog/2023-05-03-arena/"
  - "https://arxiv.org/abs/2403.04132"
relations: []
needs_review: false
node_kind: concept
thought_chain: evaluation
thought_role: advance
---

## 背景

2023 年开源与闭源模型密集发布，静态基准很快被「针对性优化」污染；同时，真实使用中的对话质量很难用单题准确率衡量。

## 核心观点

Chatbot Arena 用最朴素的众包方式收集偏好：用户不知道对面是哪个模型，只看回答投票；投票结果用 Elo 类模型汇总成动态排名。它的优势是覆盖面广、持续更新、贴近真实对话；代价是偏好偏差（长回答、格式花哨可能占优）、可复现性弱、刷票风险。

## 为什么今天还要读

它标志着评测范式从「考试成绩」转向「真实偏好」，也把评测变成了持续运营的公共基础设施。今天讨论模型强弱时引用的 Arena 分数，正来自这套机制。
