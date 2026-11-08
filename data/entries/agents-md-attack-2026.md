---
id: "agents-md-attack-2026"
type: "event"
title: "AGENTS.md 被武器化：下载一个 Markdown 就能让 AI Agent 执行恶意指令"
title_en: "AGENTS.md Prompt Injection Attack"
date: "2026-11-07"
importance: 6
categories: [alignment, agent]
summary: "11 月 7 日，安全机构 Forever Security 披露一种新型攻击：用户只是打开网页，恶意 AGENTS.md 文件就被自动下载到 ~/Downloads；当用户随后在该目录运行 Codex/Claude 等 AI 编程助手时，Agent 会自动把该文件当作最高优先级指令，修改全局配置、关闭沙箱、下载恶意 npm 包，甚至把本地 API Token 打包外传。攻击不需要用户点击「确定下载」或执行脚本，利用的是 Agent 对 AGENTS.md/项目指令文件的信任机制。"
significance: "Agent 的「读取项目文件」能力正在变成新的攻击面：提示词注入不再局限于聊天框，而是通过文件系统、下载目录与编码 Agent 的自动上下文加载实现。它说明 Agent 安全不能只做模型层对齐，还需要文件来源标记、指令文件权限、沙箱与人工确认；对开发者工具与 IDE 厂商是直接的产品安全要求。"
quote: ""
speaker: ""
occasion: ""
my_comment: "攻击链依赖「用户在该目录启动 Agent」；但下载目录正是高频入口，风险被严重低估。AGENTS.md 需要像可执行文件一样被对待。"
tags: [海外, Agent安全, 提示词注入, AGENTS.md, Codex, ClaudeCode]
sources:
  - "https://www.qbitai.com/2026/11/508244.html"
  - "https://www.darkreading.com/application-security/in-the-wild-attack-ai-agents-trust-markdown"
relations:
  - to: "cursor-claude-extension-backdoor-2026"
    type: "启发"
    note: "AI Agent 供应链/扩展攻击的延续"
needs_review: false
node_kind: concept
added_at: "2026-11-08"
---
