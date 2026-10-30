---
id: openai-realtime-api-2024
type: event
title: "OpenAI 发布 Realtime API"
title_en: "Introducing the Realtime API"
date: "2024-10-01"
importance: 6
categories: [product, agent]
summary: "OpenAI 在 DevDay 2024 发布 Realtime API 公测：开发者可通过 WebSocket/WebRTC 直接调用「语音进、语音出」的实时对话能力，并支持打断、函数调用与多模态事件。"
significance: "实时语音从一家产品的体验变成所有应用可接入的基础设施，语音 agent 的构建延迟与工程量同时下降。交互范式的竞争由此从「模型能力」扩展到「实时管线、工具调用与开发者生态」。"
quote: ""
speaker: ""
occasion: ""
my_comment: "把语音对话做成 API，意味着实时交互不再是旗舰产品的特权，而是所有应用的默认能力。"
tags: [realtime-api, speech, developer, agent]
sources:
  - "https://techcrunch.com/2024/10/01/openais-devday-brings-realtime-api-and-other-treats-for-ai-app-developers/"
relations: []
needs_review: false
thought_chain: interaction
thought_role: advance
---

## 背景

高级语音模式证明了实时对话可行，但它仍封闭在 ChatGPT 里。开发者若想自建语音 agent，必须自己拼接语音识别、大模型、语音合成与打断逻辑，延迟高、状态难同步。

## 核心观点

2024 年 10 月 1 日，OpenAI 在 DevDay 上开放 Realtime API 公测：以 WebSocket/WebRTC 承载语音到语音的对话，支持中途打断、函数调用与多模态事件，让第三方应用也能获得类似的高级语音体验。

## 为什么今天还要读

它标志着交互范式的竞争从「谁的模型更会说话」转向「谁的实时管线更可靠、生态更开放」。此后语音 agent、客服与硬件设备的产品形态，大多建立在这类实时 API 之上。
