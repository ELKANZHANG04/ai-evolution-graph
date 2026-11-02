---
id: "claude-harness-game-policy-2026"
type: "event"
title: "Anthropic 在 Opus 5.5 系统提示词中禁止「复刻他人游戏」"
title_en: "Anthropic Blocks Game Cloning in Claude Code"
date: "2026-11-01"
importance: 5
categories: [alignment, product]
summary: "11 月 1 日，开发者 chasm 发现 Claude Code 开始限制游戏克隆；Anthropic 技术人员与发言人确认，已在 Opus 5.5 的系统提示词中加入两句话：可以构建原创游戏、类型游戏以及用户自有设计/素材的游戏，但不要「重新创建属于别人的特定游戏」，即使改名或声称是原创。该指令通过服务端配置字段「tengu_heron_brook」下发，属于提示词层软约束，并非硬性版权过滤器。"
significance: "前沿模型公司开始把版权/IP 风险写进系统提示词，但软约束难以阻止改写、移植与规避；它暴露了 Agent 时代「能力越强、责任边界越模糊」的治理难题，也可能推动平台层内容过滤与版权方合作。"
quote: ""
speaker: ""
occasion: ""
my_comment: "两句话的系统提示词挡不住所有克隆，真正的约束仍要落在产品层检测与法律执行上。"
tags: [海外, Anthropic, Claude Code, 版权, AI治理, 提示词]
sources:
  - "https://www.qbitai.com/2026/11/507038.html"
  - "https://www.36kr.com/p/4050722097828740"
  - "https://shiftdelete.net/en/claude-code-games"
relations:
  - to: "claude-code-2025"
    type: "启发"
    note: "Claude Code 的游戏克隆能力引发 Anthropic 的版权限制"
needs_review: false
node_kind: concept
added_at: "2026-11-02"
---
