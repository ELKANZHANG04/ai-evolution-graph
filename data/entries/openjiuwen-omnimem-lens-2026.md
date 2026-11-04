---
id: "openjiuwen-omnimem-lens-2026"
type: "event"
title: "openJiuwen 上线 OmniMem-Lens：让 Agent 按「事件」记住长视频"
title_en: "openJiuwen OmniMem-Lens"
date: "2026-11-04"
importance: 5
categories: [agent, multimodal]
summary: "11 月 4 日，openJiuwen AgentMemory 0.2.0 上线多模态记忆能力 OmniMem-Lens：不再按固定秒数切分长视频，而是用视觉（画面变化）与听觉（ASR 说话人/话题切换）双轨证据定位真实事件边界，再建立 L0 原文、L1 目录、L2 索引三层记忆单元。官方称召回精度最高提升 45.7%，在线问答时延最高降低 97%；L1/L2 已文本化、向量化，可接入主流向量数据库，已有 RAG/Agent 技术栈几乎零改造。"
significance: "Agent 的长视频记忆从「按秒切片」转向「按事件组织」，这是多模态 Agent 从演示走向真实长任务的关键基础设施；事件级记忆与三层索引也便于审计与回溯。它补上了 Agent 在监控、发布会、会议等长视频场景的短板。"
quote: ""
speaker: ""
occasion: ""
my_comment: "45.7% / 97% 是官方测试口径；真实场景的事件边界判定、跨语言与嘈杂环境仍是难点。"
tags: [国内, openJiuwen, AgentMemory, 多模态记忆, 长视频, RAG]
sources:
  - "https://www.qbitai.com/2026/11/507533.html"
  - "https://pandaily.com/huawei-openjiuwen-agentmemory-0-2-0-omnimem-lens-audio-visual-long-video-memory"
relations:
  - to: "deepseek-creator-mode-2026"
    type: "竞争"
    note: "Agent 基础设施（记忆/插件）的竞争"
needs_review: false
node_kind: concept
added_at: "2026-11-04"
---
