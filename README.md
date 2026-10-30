# AI 演进图谱 · AI Evolution Graph

> 面向「想看懂 AI 世界的人」的静态知识面板。用**块面积 = 影响力**这一个视觉隐喻，让人不读字就能感知 AI 发展的节奏、重心与密度。

回答三个问题，也对应三级信息层级：

1. **主线**（默认）：AI 一路是怎么发展过来的？只看 24 个里程碑 × 5 个阶段，突破点高亮；
2. **最新动态**（M3）：最近 / 今天发生了什么？每日更新；
3. **思想看板**：哪些思想、观点、产品初衷值得记住？思想如何递进与推翻（言论不进图，用看板呈现）。

导航：`主线` / `思想看板` / `最新动态` / `关于`（全量数据已并入「主题页」，不再单独占一级入口）。

## 核心设计

- **时间轴 = 等宽年份列 + 列内 squarified treemap**：列高 ∝ 该年影响力总和（全局统一比例尺），块面积严格正比于 `importance`（1–10）。2012 的单柱巨块 → 2017 的稀疏巨块 → 2023 后的密集小格，节奏一眼可见。
- **影响图谱（思维导图式）**：全局视图按「时间 × 类别泳道」排列节点，关系连线带方向箭头；双击节点进入以它为中心的思维导图（上游在左、下游在右、按影响跳数分层），可继续下钻；滚轮缩放、拖拽平移、单击开详情。
- **颜色 = 类别**（10 类固定色板，全局统一，见 `src/theme/categories.ts`），图例可点击筛选。
- **数据与前端解耦**：`data/entries/*.md`（YAML frontmatter + 可选正文）是唯一数据源；构建期用 `zod` 校验并编译成静态 JSON bundle；无后端、无数据库。
- **数据诚信红线**：不确定的事实/日期/来源 → `needs_review: true` 并显示待核对角标；不确定的 URL 留空，禁止编造；评分长期锚定、禁止通胀。
- **每日增量更新**：抓取 → 起草（`needs_review`）→ 核验 → 入库 → 自动按日期/重要性归位 → 重建。详见 [docs/UPDATE.md](docs/UPDATE.md)。

## 快速开始

要求 Node.js ≥ 20。

```bash
npm install        # 或 pnpm install
npm run dev        # 构建数据 bundle + 启动 Vite（http://127.0.0.1:5173）
npm run build      # 数据校验 + 类型检查 + 静态产物到 dist/
npm run preview    # 本地预览构建产物
```

常用脚本：

| 命令 | 作用 |
|---|---|
| `npm run data:build` | 把 `data/entries/` 编译成 `src/generated/*.json` |
| `npm run validate` | 校验 schema、id 唯一、relations 指向、日期、评分通胀；`-- --stats` 打印分布 |
| `npm run validate:strict` | CI 用：warning 也视为失败 |
| `npm run add-entry` | 交互式新建一条条目（M4 完善中） |
| `npm run remove-entry` | 删除/归档一条条目（M4 完善中） |
| `npm run curate` | 主线治理 dry-run（候选晋升 / 末位淘汰方案） |
| `npm run curate:apply` | 执行主线治理并写 `docs/reviews/` 记录 |
| `npm test` | 单元测试（treemap 面积守恒等） |
| `npm run typecheck` | TypeScript 类型检查 |

## 界面层级（M2.5）

- `#/mainline`（默认）：只留 24 个里程碑，5 章纵向叙事；突破点金色高亮；其余 69 条事件压缩为背景刻度，可展开看标题。
- `#/chapter?ch=<id>`：主题页——点进主线任一阶段看该主题**全部事件**，并可切「本章时间轴 / 本章影响图谱」（全量数据由此合并，不再单独占导航）。
- `#/thoughts`：思想看板——7 个明确主题，每条链「命题 → 推进 → 修正/反驳」；卡片以一句话主张 + 思想概括为主，原文可展开，点开看完整论证。
- `#/feed`：最新动态——活新闻流：最近新增 / 最新事件（7/30 天/全部）/ 候选晋升池 / 创新雷达；主线容量与晋升状态可见。
- 主线动态化：`npm run curate`（dry-run）/ `npm run curate:apply` —— 重要新事件晋升主线，满额后按重要度末位淘汰（10 分永不淘汰）；每日更新任务会自动执行。
- `#/search`：全局搜索——加权匹配 + 高亮片段 + 类别/年份/影响力组合筛选；页头搜索框按 `/` 聚焦。

## 目录结构

```
data/entries/          知识库源文件：一条目一个 Markdown（唯一数据源）
scripts/
  build-data.ts        构建期编译：frontmatter → 校验 → src/generated/*.json
  validate.ts          数据校验 CLI
  add-entry.ts         交互式新增条目（M4）
  remove-entry.ts      删除/归档条目（M4）
  digest.js            预留：未来接 URL/文本 + LLM 起草条目（仅 TODO）
src/
  app / pages / components / lib / theme / styles
docs/
  DECISIONS.md         所有设计决策与数据契约（先读这个）
  UPDATE.md            每日更新流程
  M1-ACCEPTANCE.md     M1 验收清单
```

## 数据格式（摘要）

```yaml
id: chatgpt-2022
type: product            # event | insight | product
title: "ChatGPT 发布"
title_en: "ChatGPT Launch"
date: 2022-11-30
importance: 10
categories: [product]    # architecture/model/product/opensource/alignment/multimodal/agent/hardware/thought/org
summary: "两句话以内的事实摘要。"
significance: "为什么重要。"
tags: [openai, chatbot, rlhf]
sources: []              # 真实 URL；没把握就留空
relations: []            # {to: <id>, type: 奠基|基于|启发|竞争|开源衍生|人才流动}
needs_review: false
```

正文（`---` 之后）可选，用于深度解读；`type: insight` 必填。

完整字段与校验规则见 [docs/DECISIONS.md](docs/DECISIONS.md)，评分锚点见应用内「关于」页与 `src/theme/importance.ts`。

## 部署

- **最快上线（无需服务器/Git）**：`npm run build` 后把 `dist/` 拖到 <https://app.netlify.com/drop>，立即得到公网地址。
- **长期推荐**：GitHub Pages（账号 `ELKANZHANG04`；`.github/workflows/deploy.yml` 已配好构建+校验+发布），或 Vercel（`vercel.json` 已配置）。
- **自定义域名 / 搜索引擎提交 / 每日更新的无人值守方案**：见 [docs/DEPLOY.md](docs/DEPLOY.md)。
- **被搜索引擎搜到**：目前是 hash 路由单页应用，收录能力有限；升级路线见 [docs/SEO.md](docs/SEO.md)。
- **新手调试/工具说明**：见 [docs/BEGINNER-GUIDE.md](docs/BEGINNER-GUIDE.md)（Chrome DevTools、本地开发、常见问题）。

上线后把公网地址填进 `site.config.json` 的 `siteUrl`，重新构建会自动生成 `robots.txt`、`sitemap.xml` 与 canonical/OG 信息。

## 当前进度

- [x] M1：数据 schema / 构建管线 / 时间轴主视图 / 详情抽屉 / 22 条种子 / 关于页
- [x] M2：107 条数据（含 2024–2026 近期 + 10 条奠基简述）+ 影响图谱（全局时间泳道 + 聚焦思维导图）+ 每日更新机制
- [x] M2.5：信息架构改版——主线默认视图（24 里程碑 × 5 章节 + 突破点 + 背景刻度）、思想看板、全量数据降级为二级视图
- [x] M2.6：思想看板做深（7 主题 / 16 条引文 / 主张优先、原文可展开）、主线主题页（全部事件 + 本章时间轴/图谱，合并全量数据）
- [ ] M3：最新动态 + 思想库 + 搜索与组合筛选 + 移动端打磨
- [ ] M4：CLI、部署、CI、1000 条压测、详情页二期

## 说明

本站为个人知识整理，尽力核实但可能存在偏差；标有「待核对」的条目请以原始来源为准。不构成任何投资建议。
