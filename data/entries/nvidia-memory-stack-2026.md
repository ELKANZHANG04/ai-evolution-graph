---
id: "nvidia-memory-stack-2026"
type: "event"
title: "英伟达提出 AI 内存全栈协同：HBM 仅增 3%，每美元智能体吞吐量最高 30 倍"
title_en: "NVIDIA AI Memory Full-Stack Design"
date: "2026-11-05"
importance: 6
categories: [hardware, model]
summary: "11 月 5 日，英伟达发布技术解读，提出 AI 内存「全栈协同设计」：把 GPU、CPU、网络、存储与软件作为整体优化，用 NVFP4 压缩模型权重与 KV 缓存、在 NVL72 内把权重分散到最多 72 颗 GPU、用 Vera CPU 的大容量 LPDDR 缓冲暂停上下文、由 Dynamo 软件把不活跃上下文迁移到 CMX 存储，并让 RAG 索引留在 CPU/存储侧。英伟达援引 SemiAnalysis AgentX 基准称：在每用户 125 token/s 下，Vera Rubin NVL72 相比 GB300 NVL72 的每美元智能体吞吐量最高提升 30 倍，而单 GPU 的 HBM 容量仅增加约 3%；GB300 NVL72 相比 H200 在 100 token/s 下每美元吞吐量最高提升 10 倍。"
significance: "AI 算力竞争从「堆 HBM 容量」转向「每字节、每瓦特产出多少有效 token」：在 HBM 供应紧张、Agent 长上下文推高内存需求的背景下，压缩、分层与卸载成为比扩显存更现实的路径。它也为 Rubin 平台的溢价叙事提供了「内存效率」而非「显存容量」的支撑。"
quote: ""
speaker: ""
occasion: ""
my_comment: "30 倍是特定 AgentX 工作负载下的官方引用，不是通用训练/推理加速；实际收益取决于模型、上下文与软件栈适配。"
tags: [海外, 英伟达, Rubin, HBM, KV缓存, Agent, 内存]
sources:
  - "https://www.ithome.com/1/023/025.htm"
  - "https://www.sohu.com/a/1097837595_114760"
relations:
  - to: "nvidia-rubin-shipment-2026"
    type: "基于"
    note: "Rubin 平台的内存效率优化"
needs_review: false
node_kind: model
added_at: "2026-11-06"
---
