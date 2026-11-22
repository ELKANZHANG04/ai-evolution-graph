---
id: "karpo-decision-31b-2026"
type: "event"
title: "MachinePulse 开源 Karpo Decision 31B：专给 Agent 做低延迟决策"
title_en: "MachinePulse Karpo Decision 31B"
date: "2026-11-21"
importance: 5
categories: [model, agent, opensource]
summary: "11 月 21 日，MachinePulse AI 开源 Karpo Decision 31B：一个专门为 Agent 提供高频、低延迟决策能力的 31B 模型，用于判断「网页下一步点哪个按钮」「任务是否完成」「几十个工具里该调哪个」。在《城市扫描仪》挑战中，Karpo 从 36 场活动中筛出 10 个符合预算/通勤条件的地点只用 2.6 秒，Gemini 3.5 Flash 用了 14.96 秒；36 道题准确率 100%。模型面向浏览器 Agent 等场景，强调速度与成本。"
significance: "Agent 的瓶颈正从「大模型会不会做」转向「每一步决策够不够快/便宜」：Karpo 把决策拆成独立小模型，用 31B 专才替代通用大模型做高频判断，是「Agent 系统分层」的一次实践。若这类决策模型成熟，浏览器/桌面 Agent 的延迟与 token 成本会显著下降。"
quote: ""
speaker: ""
occasion: ""
my_comment: "2.6s vs 14.96s 是特定挑战/硬件口径；31B 决策模型的泛化与工具调用可靠性需更多基准。"
tags: [海外, MachinePulse, Karpo, 决策模型, 浏览器Agent, 开源]
sources:
  - "https://www.qbitai.com/2026/11/511791.html"
  - "https://github.com/"
relations: []
needs_review: false
node_kind: model
added_at: "2026-11-22"
---
