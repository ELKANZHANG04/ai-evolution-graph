---
id: "linger-2026"
type: "event"
title: "DeepSeek V1 作者创业 Linger：把 Personal Agent 放回个人电脑"
title_en: "Linger Personal Agent"
date: "2026-11-21"
importance: 5
categories: [product, agent, opensource]
summary: "11 月 21 日，前 DeepSeek V1 作者、DeepSeek-VL 项目负责人 Tony Zhang 公布新创业项目 Linger：面向个人电脑的 Personal Agent，可直接操作电脑上已有的网页、邮箱、日历，无需重新登录一堆服务；作为中间层支持接入第三方模型。团队称一块 12GB 显存的 RTX 3060 就能跑 125B 参数的 Qwen3.8-Flash-Next，生成速度 45.5 tok/s；路线与当前多数做 App 的 Personal Agent 不同，优先选择电脑端。"
significance: "Personal Agent 的竞争出现「云端 vs 本地」分叉：Linger 把执行环境放在用户电脑、模型可插拔，强调隐私与现有账号/文件的无缝接入。若本地大模型在 12GB 显卡上真的可用，个人 Agent 的部署成本与数据边界都会被重写；但本地算力、权限安全与跨应用兼容性仍是硬仗。"
quote: ""
speaker: ""
occasion: ""
my_comment: "产品细节来自创始团队/媒体，尚未大规模验证；125B 模型在 12GB 显存上运行大概率依赖量化/卸载，45.5 tok/s 需看具体配置。"
tags: [国内, Linger, PersonalAgent, 本地AI, DeepSeek, 开源]
sources:
  - "https://www.qbitai.com/2026/11/511570.html"
  - "https://www.sohu.com/a/1104713949_128075"
relations:
  - to: "deepseek-v3-2024"
    type: "启发"
    note: "DeepSeek V1 作者延续底层模型/Agent 探索"
needs_review: true
node_kind: concept
added_at: "2026-11-22"
---
