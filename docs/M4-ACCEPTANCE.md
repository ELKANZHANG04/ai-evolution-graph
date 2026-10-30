# M4 验收记录：思想「持续讨论」× 创新雷达收窄 × 最新动态极简（2026-10-30）

> 需求来源：docs/PROPOSAL-M4.md §1（用户反馈逐条）。定义见 docs/DECISIONS.md §13。

## 1. 交付内容

### 数据（182 条，本轮新增 46 条）

- 11 个思想主题全部补成 2011→2026 的连续讨论线，每个主题 ≥7 步、最新步骤 ≥2025、架构与交互等关键主题到 2026。
- 新增 40 条 insight（观点卡），涉及 2023–2026 的讨论（含 MMLU/HELM/Chatbot Arena/SWE-bench 四条评估基线的补齐，由 Lead 补写）。
- 创新雷达从 14 条收窄到 **8 条**，全部挂在主题既有路径上；同一方向只保留代表条目。
- 最新动态数据源：新增条目的 `added_at`（当前 17 条在最近 5 天内）。

### 思想看板 v4（src/components/thoughts/、src/pages/ThoughtBoardPage.tsx）

- 主题头：`N 步 · M 观点 · 最新 YYYY-MM · 近 18 个月 K 条` + 活跃度徽标（持续活跃/待补充）+ 2012→2026 年份活动条。
- 筛选：全部主题 / 持续活跃 / 待补充 / 11 个主题；删除全局「创新雷达」筛选。
- 主题头聚合「新方向」（来自 `thought_pin: 'top'`），雷达徽标只在代表条目上出现（6 个徽标 / 3 个置顶）。
- 卡片新增影响力分数（90/90 张卡片显示 x/10）。
- 新增 `src/lib/thoughtFreshness.ts`（纯函数 + 单测）。

### 最新动态 v3（src/pages/FeedPage.tsx）

- 只保留两块：「新入库 · 事件」「新入库 · 思想」，数据窗口 = 最近 5 天 `added_at`。
- 删除：7/30/全部时间窗、最新事件列表、候选晋升池、独立创新雷达栏目、主线容量统计。
- 卡片保留日期/入库日期/类型/影响力分数/类别/创新雷达/NEW 标签。

### SEO 静态页（scripts/build-seo-pages.ts）

- `/p/thoughts/`：主题头增加步数/最新月份/近 18 个月/新方向聚合，雷达只标代表条目。
- `/p/feed/`：改为「最近 5 天新入库」的事件/思想两块。

## 2. 验收命令与结果

```bash
export PATH="$PWD/.tooling/node-runtime/bin:$PATH"
npm run validate   # ✓ 0 error / 0 warning（182 个文件，178 条有效）
npm run typecheck  # ✓ 0 error
npm run test       # ✓ 5 files / 42 tests passed
npm run build      # ✓ 187 个静态 SEO 页 + sitemap 188 URL
npm run qa:ui      # ✓ 73/73 通过
```

## 3. 主题新鲜度（validate 输出）

| 主题 | 步骤 | 雷达 | 最新 | 近 18 个月 |
|---|---|---|---|---|
| 架构与范式 | 11 | 1 | 2026-09 | 2 |
| 交互范式 | 9 | 1 | 2026-06 | 4 |
| 生成式决策 | 8 | 2 | 2026-10 | 3 |
| 记忆与持续学习 | 7 | 1 | 2025-11 | 2 |
| 评估与安全 | 7 | 2 | 2026-10 | 2 |
| 规模与泛化 | 7 | 0 | 2025-10 | 1 |
| 软件形态 | 9 | 0 | 2026-04 | 3 |
| 世界模型 vs 语言模型 | 10 | 1 | 2026-10 | 6 |
| 对齐与安全 | 7 | 0 | 2025-08 | 2 |
| 智能体与交互 | 8 | 0 | 2026-09 | 1 |
| 开源与闭源 | 7 | 0 | 2025-08 | 2 |

## 4. 截图

- `docs/screenshots/thoughts-v4.png`（思想看板，1440×900）
- `docs/screenshots/feed-v3.png`（最新动态，1440×900）
- `docs/screenshots/m4-thoughts-stale.png`（待补充筛选空态）
- `docs/screenshots/m4-thoughts-filtered.png`（单主题筛选）

## 5. 遗留 / 下一步

- 数据事实核查：本轮新增 2025–2026 条目均有 sources；抽查 arxiv 2026 论文（SwiLA / SWA-vs-LA / Quo Vadis World Modeling）日期、作者、摘要与引文一致。
- 仍建议人工过目 `needs_review: true` 的 24 条（多为 2026 新入库与部分经典日期存疑）。
- 国内托管选型 / 百度 sitemap 提交仍待用户确认（见 docs/STATUS.md）。
