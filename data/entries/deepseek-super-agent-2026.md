---
id: "deepseek-super-agent-2026"
type: "event"
title: "DeepSeek 开源 Super-agent：让 Agent 自己找 Bug 提 PR"
title_en: "DeepSeek Open-Sources Super-agent Architecture"
date: "2026-10-31"
importance: 7
categories: [agent, opensource, model]
summary: "10 月 31 日 DeepSeek 公开 Personal Agent 的底座架构 Super-agent 并放出原型代码：Router 调度 + Worker 执行的双层结构、订阅直通、两级事件过滤、异步 ReAct 与 Watchdog 自愈；官方称在约 300 条消息、20 项请求的模拟环境中，任务完成时间中位数 12.4 分钟、95 分位 15.7 分钟，优于传统单会话方案（95 分位 29.5 分钟）。"
significance: "它把 Agent 竞争的焦点从「单次任务能力」推向「长期在线、多任务并行、主动发现问题的系统底座」：跨 IM/GitHub/邮件的持续上下文和投机执行，意味着 Agent 开始从工具变成「同事」。这也是国产厂商首批公开的 Personal Agent 架构之一。"
quote: ""
speaker: ""
occasion: ""
my_comment: "12.4 分钟是内部模拟环境数据；真正要看的是开源原型在多平台权限、安全隔离和长跑稳定性上的工程成色。"
tags: [国内, DeepSeek, Agent, 开源, 多任务, 长期在线]
sources:
  - "https://www.qbitai.com/2026/10/506904.html"
  - "https://github.com/deepseek-ai/dsh-superagent-prototype"
relations: []
needs_review: false
node_kind: concept
added_at: 2026-10-31
---

