# M4 提案：思想看板「持续讨论」改造 + 最新动态极简版

> 状态：已实施并验收（见 docs/M4-ACCEPTANCE.md）。用户反馈（2026-10-30）原文要点见 §1。本文是三个数据 curator、board-engineer、viz-engineer、qa-factchecker 的共同依据。

## 1. 用户反馈（逐条对应改动）

1. 思想一定是要被**不断讨论**才有价值；有些主题只有 2–3 年前的几次思想，现在没有新事件——要多找**被讨论、新的、被不断探索**的思想。
2. 「架构与范式」等主题不能停在 2020，要更新到 2025–2026。
3. 「最新动态」主要突出**新**，不要超过半年。
4. 创新雷达要**融入各个主题**；如果已自成一派，就不需要每个都标雷达，主题上体现「新」即可。大部分创新是原有路径上的创新，不是凭空新主题。
5. 最新动态只放两部分：**最近 3–5 天新入库的「事件」与「思想」**，其中一些按新定义标创新雷达；**删掉**「最近事件（7/30/全部）」「候选晋升池」「独立创新雷达」三块。
6. 标签风格延续，**保留影响力分数**（importance/10）。

## 2. 新定义（写进 DECISIONS）

### 2.1 思想主题的「价值 = 持续被讨论」

- 每个主题必须呈现为**连续的讨论线**：2012（或该主题起点）→ 2026，步骤按时间排列；允许有稀疏年份，但不允许「最后一步停在两年前」。
- 验收线：每个主题 **≥1 条 2025-01-01 之后**的步骤；**≥2 条 2024-01-01 之后**的步骤；步骤总数 ≥6。
- 主题头部显示活跃度：最新年份、近 18 个月条数、年份活动条（连续讨论一眼可见）。
- 筛选器加「持续活跃 / 待补充」：按「近 18 个月是否有新条目」分组，让缺口可见而不是藏起来。

### 2.2 创新雷达（收窄后的定义）

- 创新雷达 = **在既有路径上出现的新方向/新方法**，尚未被主流吸收，值得关注。
- 它**不是**「新主题」：条目 `innovation: true` 必须挂在某主题的既有步骤之间，且该主题必须有 ≥2 条非雷达步骤承载它。
- 同一方向不重复标：一个方向只标**代表条目**（最早提出或最清晰表述的那条），同方向的后续工作不再逐条标雷达。
- 一旦该方向**自成一派**（已成独立主题/子领域），不再逐条标雷达，改由主题头部「新方向：<名称>」标注（来源：`thought_pin: 'top'` 的条目）。
- UI：去掉全局「创新雷达」筛选 chip 与独立栏目；雷达以**主题内小标签 + 主题头聚合**呈现。

### 2.3 最新动态 = 只放「最近 5 天入库」

- 只展示 `added_at` 在最近 **5 天**内的条目，分两块：**新入库 · 事件**（event/product）与**新入库 · 思想**（insight）。
- 条目内联标签：影响力分数、类型、类别、创新雷达（若 `innovation: true` 且是新入库代表条目）、NEW。
- 附注「每日 08:30 自动更新」；空态显示最近一次入库日期。
- 删除：时间窗 tab、候选晋升池、独立创新雷达、主线容量等页头统计。

## 3. 数据规范（curator 必读）

- 只写 `data/entries/*.md`，一文件一条；id 全局唯一 kebab-case，建议 `<slug>-<year>`。
- **不要写 `added_at`**，除非该条目是「今天/近 5 天新入库」的新闻（2026-10-26 之后发生）。补历史不得写 added_at，否则会污染最新动态。
- 必填：id/type/title/title_en/date/importance/categories/summary/significance；`needs_review` 必填 boolean。
- insight 必须含 quote/speaker/occasion，且再写 `thought_chain` + `thought_role` + `thought_claim`(≤120字) + `thought_summary`(≤600字)。
- event/product 也可进主题：写 `thought_chain` + `thought_role`（多数 advance；奠基性用 thesis；修正用 revision；反驳用 rebuttal）。
- 主题 id 只能取：`architecture` `scaling` `software` `worldmodel` `alignment` `opensource` `agents` `interaction` `generative-decision` `memory` `evaluation`。
- `innovation: true` 收窄使用：只在「旧路径上的新方向代表条目」上标，并补 `maturity`（paper/prototype/product）与 `why_underrated`(≤400字)。目标：全库雷达 ≤8 条，且**任何主题不得只剩雷达条目**。
- 重要性锚点：10 只给 AlexNet/Transformer/ChatGPT 级；8–9 全库 ≤30%；刷新条目一律 5–7，宁低勿高。
- 来源：只写真实可访问 URL（论文页/官方博客/权威媒体）；拿不准就不写 sources，并 `needs_review: true`，**禁止编造**。
- 事实：日期、机构、数字必须可核；2025–2026 事件用 web_search 验证；无法验证就不收。
- 正文：每条附 `## 背景 / ## 核心观点 / ## 为什么今天还要读`（每段 2–4 句即可，不必逐字引用原文）。
- 关系 `relations` 可留空；若写，`to` 必须是已存在条目 id（可 grep data/entries 确认）。

## 4. 数据缺口清单（按主题）

| 主题 | 现状 | 目标（约） | 建议补的路径（可替换为更准确的） |
|---|---|---|---|
| architecture 架构与范式 | 2 步，停在 2020 | +6，最新 2026 | FlashAttention/GQA（高效注意力）、Mixtral/MoE 复兴、Mamba/SSM、DeepSeek-V3、Llama 4/混合专家、2025–26 架构讨论（线性注意力/扩散 LM）+ 1 条 2025+ insight |
| scaling 规模与泛化 | 4 步，停在 2024 | +4，最新 2026 | GPT-4.5、o3/test-time scaling、DeepSeek-R1、2025+ 关于 scaling 是否见顶的讨论 |
| software 软件形态 | 3 步 | +4，最新 2026 | Codex、Cursor、Claude Code、vibe coding（Karpathy 2025-02）、spec-driven（已有）、2026 软件 agent 化 |
| worldmodel 世界模型 | 3 步（配置 3） | +4，最新 2026 | Sora、Sora 2、V-JEPA 2、Genie 4（2026-10-27，已入库可挂 theme）、1 条 2026 讨论 |
| interaction 交互范式 | 5 步全是雷达 | +7 非雷达，最新 2026 | ChatGPT（2022）、GPT-4o 实时语音（2024-05）、Character.ai、ElevenLabs、Apple Intelligence/Siri、2025–26 端侧实时交互；全双工 5 条收敛为 1 条代表雷达 + 其余正常步骤 |
| generative-decision 生成式决策 | 3 步全是雷达 | +6 非雷达 | Decision Transformer、Gato、RT-2、Diffusion Policy、o1 推理规划、2025–26 agent planning；雷达留 1–2 条代表 |
| memory 记忆与持续学习 | 2 步全是雷达 | +5 非雷达 | RAG（2020）、GPT-4 长上下文（2023）、MemGPT（2023）、Titans/长期记忆、2025+ 讨论；雷达留 1–2 条 |
| evaluation 评估与安全 | 2 步全是雷达 | +5 非雷达 | MMLU（2020）、HELM（2022）、Chatbot Arena（2023）、SWE-bench（2023）、METR/红队、2025+ 评估讨论；雷达留 1–2 条 |
| alignment 对齐与安全 | 2 步，停在 2022 | +6，最新 2026 | RLHF/InstructGPT、宪法 AI（已有）、weak-to-strong（2023-12）、EU AI Act（2024-08）、OpenAI Model Spec 更新（2026-10-29 已入库可挂）、2025+ 可扩展监督讨论 |
| agents 智能体与交互 | 2 步，停在 2024 | +6，最新 2026 | Computer Use（2024-10）、Claude Code（2025-02）、Operator（2025-01）、A2A（2025-04）、OpenAI Dots（2026-09 已入库可挂）、1 条 2025+ insight |
| opensource 开源与闭源 | 2 步，停在 2024 | +4，最新 2026 | LLaMA（2023）、Mistral 7B、Llama 4（2025-04）、DeepSeek-R1、Mistral Large 4（2026-10-29 已入库可挂）、Qwen3 |

> 表格是「缺口提示」，不是必须逐条照抄；优先选**真实、可核、能体现讨论延续**的条目。已有条目通过改 frontmatter 加 `thought_chain` 挂进主题，比新造条目更省。

## 5. UI 规格

### 5.1 思想看板 v4（board-engineer）

- 页头 stats：主题数 / 观点卡数 / 年份覆盖 / 最新讨论时间；删「创新雷达」统计。
- 筛选：全部主题 · 持续活跃 · 待补充 · 各主题 chip（保留序号与计数）。
- 主题头：标题、问题、描述；meta = `N 步 · M 观点 · 最新 YYYY-MM · 近 18 个月 K 条` + 活跃度徽标（持续活跃 / 待补充）+ 年份活动条（每年一个刻度，有点=有讨论，最近年份高亮）。
- 主题头聚合「新方向」：由 `thought_pin: 'top'` 条目得出，显示 `新方向：全双工语音` 之类（取 title/claim 精简）。
- 卡片：保留角色箭头/主张/概括/原文展开；**新增 ImportanceBadge（x/10）**；雷达徽标只在「新入库（added_at ≤30 天）或代表条目」上显示，不再逐条铺满。
- 去掉 FILTER_RADAR、radarMode 相关逻辑与 CSS；新增 `/持续活跃/` 等筛选。
- 新建 `src/lib/thoughtFreshness.ts`（纯函数 + 单测）：`themeFreshness(chain, today)` → latestDate、recentCount(18mo)、yearBuckets、status(active/stale)、newDirections。

### 5.2 最新动态 v3（viz-engineer）

- 页头一句话 + 数据更新于 + 最近 5 天入库数；无其他统计块。
- 两个 section：「新入库 · 事件」「新入库 · 思想」，各列条目（按 added_at desc，其次 date desc）。
- 卡片保留现有标签体系：日期、入库日期、类型、影响力分数、类别 chips、创新雷达（仅代表条目）、NEW。
- 删时间窗 tab、候选晋升池、独立创新雷达、主线容量统计；空态：「最近 5 天暂无新入库 · 每日 08:30 自动更新」+ 最近一次入库日期。
- 保留 `#/thoughts` 入口链接。

## 6. 验收

- `npm run validate` 0 error；`npm run test` 全绿；`npm run build` 成功；`npm run qa:ui` 更新后全绿。
- 每个主题最新年份 ≥2025，近 18 个月 ≥1 条；arch 主题 ≥2026。
- 无主题「只有雷达条目」；全库 innovation ≤8。
- 最新动态只出现 added_at 近 5 天条目，且只分事件/思想两块。
- 截图：`docs/screenshots/thoughts-v4.png`、`feed-v3.png`（无头 Chrome，1440 宽）。
