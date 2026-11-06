---
id: "openai-gpt6-cyber-2026"
type: "event"
title: "OpenAI 发布 GPT-6 Cyber：Linux 内核挖出 948 个可利用提权漏洞"
title_en: "OpenAI GPT-6 Cyber"
date: "2026-11-05"
importance: 7
categories: [alignment, model]
summary: "当地时间 11 月 5 日，OpenAI 发布专用网络安全模型 GPT-6 Cyber，面向漏洞发现、可利用性验证、攻击路径分析与修复建议。官方称其在 ExploitGym 基准得分 48.5%，较 GPT-5.6 Cyber 的 32.1% 相对提升约 51%，RemoteExploitBench 完成 95% 任务；在真实项目中，它在 Firefox 发现 81 个此前未知的高危漏洞，在 Linux 内核复现 1724 个漏洞并为其中 948 个开发出可用提权利用程序；未经安全提示的越界攻击率为 0.07%（上一代 5.51%），启用安全提示后为 0。OpenAI 将其网络安全风险等级评为 Critical（上一代为 High）。"
significance: "AI 安全能力进入「攻防双用」的临界点：同一模型既能大幅提升漏洞发现与修复效率，也显著降低漏洞利用门槛。Critical 评级与 948 个 Linux 提权利用意味着前沿模型公司必须把网络安全能力纳入发布前评估与访问控制；对开源社区和基础设施维护者则是压力与工具并存。"
quote: ""
speaker: ""
occasion: ""
my_comment: "948 个利用程序是 OpenAI 与安全团队的合作研究，需看补丁覆盖率与误报；「Critical」评级也意味着访问限制会收紧。"
tags: [海外, OpenAI, GPT-6Cyber, 网络安全, 漏洞挖掘, 对齐]
sources:
  - "https://eu.36kr.com/zh/p/4057467760661378"
  - "https://www.qbitai.com/2026/11/507697.html"
  - "https://m.163.com/dy/article/LB1NL5A60512B07B.html"
relations:
  - to: "gpt-6-1-terra-2026"
    type: "基于"
    note: "GPT-6 系列能力向网络安全专用模型延伸"
needs_review: false
node_kind: model
added_at: "2026-11-06"
---
