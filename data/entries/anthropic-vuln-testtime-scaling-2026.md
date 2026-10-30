---
id: anthropic-vuln-testtime-scaling-2026
type: insight
title: "安全审计是下一个 test-time compute 战场"
title_en: "Security Auditing as a Test-Time Compute Problem"
date: "2026-10-27"
importance: 6
categories: [thought, alignment]
summary: "Anthropic 在漏洞研究复盘中提出：用并行扫描 agent、按「新增漏洞贡献」度量扫描器并动态覆盖代码库，能显著提高发现数量；漏洞发现正在从专家手工活变成可扩展的推理时算力问题。"
significance: "它给「规模化监督」提供了一个可操作的样板：不只训练更强的模型，还要在推理时组织大量专业 agent 并行工作；这对防守方是杠杆，对攻击者同样成立。"
quote: "Test-time compute scaling and scanner diversity substantially increase how many vulnerabilities you find."
speaker: "Anthropic Frontier Red Team"
occasion: "Anthropic 研究博客《Discovering and exploiting vulnerabilities in critical, real-world software with Claude》（2026-10）"
my_comment: "同一个思路可以外推到对齐评估、代码审查、科学假设验证——凡是「找问题」的工作，都能变成并行 agent + 推理时算力。"
tags: [security, test-time-compute, red-team, agents, evaluation]
sources:
  - "https://www.anthropic.com/research/discovering-vulnerabilities-with-claude"
relations:
  - to: anthropic-claude-vuln-research-2026
    type: 启发
    note: "本文是该漏洞研究的方法论小结"
needs_review: false
node_kind: concept
thought_chain: evaluation
thought_role: thesis
thought_claim: "安全审计正在变成可并行扩展的推理时算力问题"
thought_summary: "不只训练更强的模型，还要在推理时组织大量专业 agent 并行扫描、按贡献度量每个扫描器并动态覆盖；这为「规模化监督」提供了可操作样板。"
innovation: true
maturity: prototype
why_underrated: "安全研究仍以专家手工为主；「并行 agent + test-time compute」的系统化范式刚刚被证明有效，尚未成为默认工程实践。"
added_at: 2026-10-30
---

## 背景

2026 年 10 月，Anthropic 披露其内部研究模型在 Chrome、Safari、Android、Windows 与 Linux 上发现多条完整攻击链。比漏洞本身更值得记录的，是他们在方法层面的两条结论：第一，推理时算力扩展与扫描器多样性会显著增加发现数量；第二，修复存量漏洞只是一半问题，另一半是降低新漏洞进入代码库的速率（他们在 PR 阶段用 Claude Code 插件做安全审查）。

## 核心观点

传统漏洞挖掘依赖少数资深专家逐点深挖；而「并行扫描 agent + 按贡献度量 + 动态覆盖」把这件事改写成一个可调度的算力问题：可以部署大量角色不同的扫描器（覆盖型、目标型、威胁模型型），按每个扫描器新增的有效漏洞来分配注意力，并在 PR 时持续扫描，而不是等年度渗透测试。这与「规模化监督」一脉相承——监督能力本身也需要被工程化、可并行、可度量。

## 为什么今天还要读

当模型能自己发现并组合漏洞、还能写出可运行 exploit，「谁来审计」就成了比「谁能用」更紧迫的问题。把审计做成推理时算力问题意味着：防守方可以靠部署密度和时间差争取优势，而这一优势是可以用工程手段积累的。
