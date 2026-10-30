---
id: memgpt-2023
type: event
title: "MemGPT：把记忆做成操作系统"
title_en: "MemGPT: Towards LLMs as Operating Systems"
date: "2023-10-12"
importance: 6
categories: [model, agent]
summary: "Packer 等提出 MemGPT：借操作系统「虚拟内存」的思路，让 LLM 通过函数调用在上下文窗口与外部存储之间移动数据，用有限窗口维持长期对话与文档分析能力。"
significance: "它把「记忆」从模型能力问题改写为系统设计问题：上下文窗口不必装下全部历史，模型可以主动管理自己的记忆层级。此后 agent 的分层记忆、检索记忆与写入/遗忘策略，大多沿用了这一框架。"
quote: ""
speaker: ""
occasion: ""
my_comment: "MemGPT 最有启发的类比是：上下文窗口不是硬盘，而是内存——该换页的时候就得换页。"
tags: [memgpt, memory, virtual-context, agent]
sources:
  - "https://arxiv.org/abs/2310.08560"
relations: []
needs_review: false
thought_chain: memory
thought_role: advance
---

## 背景

对话越长，历史越难塞进上下文窗口；简单截断会丢信息，全文塞入又贵且稀释注意力。把「记住更多」寄托在更大的上下文窗口上，也只是把问题推迟。

## 核心观点

MemGPT 借鉴操作系统的分层内存：主上下文是「内存」，外部存储是「磁盘」，模型通过函数调用主动在两者之间读写，并用中断机制在用户与自身流程之间切换。它在长文档分析与多轮对话等任务上验证了这套「虚拟上下文管理」。

## 为什么今天还要读

它把记忆从「模型能力的副产品」变成「agent 的基础设施」：记忆的读写、压缩与淘汰需要策略，而不是一味增大窗口。今天带记忆功能的助手产品，几乎都在实现某个版本的 MemGPT。
