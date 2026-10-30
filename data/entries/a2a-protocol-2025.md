---
id: a2a-protocol-2025
type: event
title: "Google 发布 Agent2Agent 协议"
title_en: "Announcing the Agent2Agent Protocol (A2A)"
date: "2025-04-09"
importance: 6
categories: [agent, opensource]
summary: "Google 发布 Agent2Agent（A2A）开放协议，让不同厂商、不同框架的 agent 互相发现能力、委派任务并交换结果，联合 50 多家企业启动生态，后续捐赠给 Linux 基金会。"
significance: "MCP 解决「agent 连工具」，A2A 试图解决「agent 连 agent」，两者一起把 agent 生态从单体产品推向可互操作的网络。协议标准化也意味着 agent 的身份、授权与责任边界将成为新的治理议题。"
quote: ""
speaker: ""
occasion: ""
my_comment: "当 agent 之间开始互相派活，「谁授权、谁负责」就从工程细节变成了制度问题。"
tags: [a2a, protocol, agent, interoperability, google]
sources:
  - "https://developers.googleblog.com/en/a2a-a-new-era-of-agent-interoperability/"
relations:
  - to: mcp-protocol-2024
    type: 启发
    note: "与 MCP 形成互补：MCP 接工具，A2A 接 agent"
needs_review: false
node_kind: concept
thought_chain: agents
thought_role: advance
thought_claim: "协议化：agent 之间也要能互相发现与委派任务"
thought_summary: "A2A 定义 agent 之间发现能力、委派任务、交换结果的开放协议，目标是跨厂商互操作；它与 MCP 形成「工具层 + agent 层」的协议组合，并已进入基金会治理。"
---

## 背景

MCP 在 2024 年底解决了「模型如何接工具」的标准化问题，但企业里有大量专业 agent，彼此仍像孤岛。当 agent 数量增长，跨系统协作成了新的瓶颈。

## 核心观点

A2A 用「agent card」描述能力，用任务（task）作为协作单元，支持同步与异步、流式结果与多轮交互，让一个 agent 可以把子任务安全地委托给另一个 agent。Google 联合 50 多家伙伴发布，随后把协议捐赠给 Linux 基金会，转向开放治理；此后 A2A 与 MCP 的关系被概括为「A2A 管 agent 之间，MCP 管 agent 与工具」。

## 为什么今天还要读

它预示着 agent 生态的下一层竞争不在单个 agent 多强，而在谁能定义 agent 之间如何协作、如何认证、如何追责。协议是基础设施，也是权力。

