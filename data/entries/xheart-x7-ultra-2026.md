---
id: "xheart-x7-ultra-2026"
type: "event"
title: "XHEART X7 Ultra：让大模型定义芯片"
title_en: "XHEART X7 Ultra"
date: "2026-10-29"
importance: 6
categories: [hardware, model]
summary: "国产芯片公司 XHEART（新芯航途）发布面向十亿参数级智驾大模型的车规芯片 X7 Ultra：700 TOPS，官方称量产 Transformer 模型实测计算利用率 98.7%、内存带宽消耗较行业旗舰下降 80%、推理能效提升 100%；X7 系列量产 8 个月出货 20 万颗、搭载 10 款量产车型、拿下 40 余款车型订单。"
significance: "「先理解大模型再设计芯片」是国产芯片在细分场景里绕开通用 GPU 正面竞争的一条路径：用模型侧的真实数据反推架构，把算力利用率与内存带宽做成卖点。智驾是国产大模型芯片最先跑出规模的车规场景。"
quote: ""
speaker: ""
occasion: ""
my_comment: "98.7% 利用率是厂商口径，需要第三方与真实车队验证；但它至少说明「模型—芯片协同设计」在工程上可行。"
tags: [国内, 芯片, 智驾, 车规, 大模型定义芯片]
sources:
  - "https://www.163.com/dy/article/LAGAB30J0511ABV6.html"
  - "https://www.163.com/dy/article/LAEAUNQ50527EIDC.html"
relations: []
needs_review: false
node_kind: model
added_at: 2026-10-30
---

## 背景

智驾从「小模型流水线」转向端到端大模型后，通用芯片在带宽、精度与能效上开始吃紧。XHEART 选择用合作方 Momenta 的量产模型数据来反向定义芯片架构。

## 核心观点

X7 Ultra 面向十亿参数级智驾大模型：超大核 NPU、专用算子加速、NPU 内部并行、整网内存零拷贝工具链；官方给出 700 TOPS、计算利用率 98.7%、内存带宽 -80%、能效 +100%，并称 X7 系列 8 个月出货 20 万颗。

## 为什么今天还要读

它是「模型定义芯片」这条路径的国产样本：在通用算力受限的背景下，垂直场景 + 软硬协同可能是更现实的突破口。
