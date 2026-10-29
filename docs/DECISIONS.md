# AI 演进图谱 · 决策记录（DECISIONS）

> 本文件是团队（Lead + 协作者）的共同事实来源。任何与本文件冲突的实现，以本文件为准；需要改决策时先改这里。

## 0. 项目一句话

纯静态、可长期增量维护的「AI 演进图谱」：用**块面积 = 影响力**这一视觉隐喻，让人不读字就能感知 2012 年至今 AI 发展的节奏、重心与密度；辅以关系图谱、最新动态、思想库解释「为什么」与「谁影响了谁」。

## 1. 用户新增要求（2026-10-29 确认）

1. **一天一更新**：数据要能每天增量更新；用户已授予联网权限。更新流程：抓取 → 起草（`needs_review: true`）→ 核验 → 入库 → 自动按日期/重要性归位 → 重建。本期由 Lead 作为执行者（每日定时），部署后迁移到 CI 定时任务。
2. **自动归位 + 手动增删**：位置由 `date` + `importance` 决定，禁止手工摆放；手动新增用 `npm run add-entry`，删除用 `npm run remove-entry`（或直接改/删 .md 文件）。
3. **界面必须一目了然、交互性强**：首屏三要素（时间轴天际线、图例、数据新鲜度）必须一眼可见；hover / 点击 / 缩放 / 平移 / 年份跳转 / 键盘 / 图例筛选都要可用。
4. **详情入口第二期强化**：M1 先交付基础「详情抽屉」；独立详情页 / 分享页放到第二期（M4 之后）。
5. **思想条目要细**：`type: insight` 必须写清 quote / speaker / occasion，正文（Markdown body）写 300–800 字深度解读（背景、上下文、为什么值得记住、对今天 AI 的启示）；每日更新中思想/观点类条目优先收录。
6. **奠基时代（<2012）简述**：8–10 条一句话摘要，不展开长文（省 token 给近期动态与思想）。
7. **部署**：GitHub 暂时打不开 → 本期只预置部署配置（Vercel / GitHub Pages / CI），不实际上传。

## 2. 数据格式决策：一条目一 Markdown（YAML frontmatter + 可选正文）

选择理由：单条目 diff 小、多人/多 Agent 并行编辑零冲突、人工与 LLM 都可低错编辑、正文承载深度解读；构建期再编译成 JSON bundle（`src/generated/`，不入库）。
拒绝统一 JSON：1000+ 条目时 diff 噪音大、易冲突、手写易错。

## 3. 数据契约

数据源：`data/entries/<id>.md`（文件名 = id；`_` 开头文件忽略，如 `_template.md`）。

frontmatter 字段（详见 `src/lib/schema.ts`）：

| 字段 | 必填 | 说明 |
|---|---|---|
| `id` | ✅ | 唯一，kebab-case，须与文件名一致 |
| `type` | ✅ | `event`(突破事件) / `insight`(观点思想) / `product`(产品发布) |
| `title` / `title_en` | ✅ | 中文标题 / 英文标题 |
| `date` | ✅ | `YYYY-MM-DD`，决定时间轴位置 |
| `importance` | ✅ | 1–10 整数，锚点见 `src/theme/importance.ts`，禁止通胀 |
| `categories` | ✅ | 多选，枚举 10 类；**第一位为主类别**（决定卡片/节点主色） |
| `summary` | ✅ | 两句话以内的事实摘要 |
| `significance` | ✅ | 为什么重要（2–3 句） |
| `quote` / `speaker` / `occasion` | insight 必填 | 观点原文 / 谁说的 / 场合 |
| `my_comment` | ❌ | 可选短评 |
| `tags` | ✅ | 关键词数组，用于搜索 |
| `sources` | ✅（可空） | 真实 URL 数组；**没把握就留空**，禁止编造 |
| `relations` | ✅（可空） | `{to: <entry id>, type: 奠基/基于/启发/竞争/开源衍生/人才流动}` |
| `needs_review` | ✅ | 事实/日期/来源不确定 → `true` |
| `node_kind` | ❌ | `model/paper/company/person/concept`，图谱节点形状用；缺省按 type+categories 派生 |
| `added_at` | ❌ | 入库日期（每日更新写入，用于 NEW 标记）；种子数据可缺省 |

正文（`---` 之后）：可选 Markdown，用于深度解读；详情抽屉展示。insight 必须写。

数据质量红线（硬性）：
- 不确定的事实、数字、日期 → `needs_review: true`；
- 不确定的来源链接一律留空，**禁止编造 URL**；
- 近 6 个月事件不确定宁缺毋滥；
- 10 分只给范式级（AlexNet / Transformer / ChatGPT）；8–9 分占比不得超过全库 30%。

## 4. 技术选型决策

- **Vite + React + TypeScript**（React 19 / Vite 8 / TS 7，已装）；纯前端静态站，无后端。
- **时间轴主视图 = 等宽年份列 + 列内 treemap（squarified）**，不用气泡图（半径→面积感知失真、高密度期重叠不可读）。
  - `x` = 等宽年份列（2012 → 今年；奠基条目在 <2012 折叠区，M2 加入）；
  - 列高 ∝ 该年影响力总和（全局统一比例尺 `k`）；列内块面积 = `k × importance` → **全局严格 area ∝ importance**；
  - 每列内部按 importance 降序排列（重要块靠左上，符合阅读顺序）。
  - 交互：hover tooltip、点击开详情、图例筛选（非命中类别 dim 到 6%）、横向缩放 1–3x、拖拽平移、年份 chip 跳转、键盘 `←/→` 平移、`Esc` 关抽屉。
- **关系图谱**（M2）：ECharts `graph`；构建期预计算确定性力导向坐标（避免抖动），点击节点高亮上下游影响链闭包。
- **路由**：自研 hash 路由（`#/timeline?entry=chatgpt-2022`），不引第三方路由；Vercel / GitHub Pages 深链零配置。
- **搜索**：不引第三方库，内存 substring + 加权匹配（M3）。
- **ECharts**：仅用于关系图谱 + 年份下钻 treemap（按需 import，控制体积）。时间轴主视图用手写 SVG（可精确控制面积/动画/交互，原生 treemap 无法表达等宽时间列）。

## 5. 视觉规范（深色）

CSS 变量（`src/styles/global.css`）：

| Token | 值 | 用途 |
|---|---|---|
| `--bg` | `#0B0E14` | 页面底色 |
| `--bg-elev` | `#121722` | 卡片/面板 |
| `--bg-elev-2` | `#161C28` | 悬浮/输入框 |
| `--border` | `#1F2733` | 分隔线 |
| `--border-strong` | `#2C3646` | 强调边框 |
| `--text` | `#E6EAF2` | 主文字 |
| `--text-2` | `#A7B2C4` | 次文字 |
| `--text-3` | `#6F7C90` | 弱文字 |
| `--accent` | `#6EA8FE` | 强调/链接 |
| `--warn` | `#F5A524` | 待核对 |
| `--radius` | `10px` | 常规圆角 |

字体：系统 UI 字体栈（中文优先 PingFang SC / Microsoft YaHei），数字/日期用 `--font-mono`。

类别固定色（唯一定义在 `src/theme/categories.ts`，禁止别处硬编码）：

| 类别 | 色值 | 类别 | 色值 |
|---|---|---|---|
| architecture 架构 | `#A78BFA` | multimodal 多模态 | `#FB923C` |
| model 模型 | `#60A5FA` | agent 智能体 | `#FACC15` |
| product 产品 | `#2DD4BF` | hardware 硬件 | `#C2A27A` |
| opensource 开源 | `#4ADE80` | thought 思想 | `#F472B6` |
| alignment 对齐 | `#F87171` | org 组织 | `#94A3B8` |

## 6. 组件契约（M1）

### 6.1 时间轴（viz-engineer 负责）

`src/components/timeline/TimelineCanvas.tsx`

```ts
export interface TimelineCanvasProps {
  entries: Entry[];              // 全量条目；年份列与面积只由该数组决定
  hiddenCategories: Category[];  // 被隐藏类别：dim，不重排（保持"面积=影响力"稳定）
  selectedId: string | null;     // 当前选中的条目 id（高亮描边）
  onSelect: (entry: Entry) => void;
}
```

必须实现：
- `src/lib/layout/treemap.ts`：纯函数布局（基于 `d3-hierarchy` 的 `treemapSquarify` 或自研 squarify），输入 `items: {id, weight}[]` + 矩形区域，输出每个 item 的 `{x,y,w,h}`；支持 gap（块间距 2–3px）；**面积守恒**（输出面积和 ≈ 输入区域面积，误差 < 0.5%）；按 weight 降序排列；零/极小尺寸安全。
- 年份列：等宽；列高由该年总影响力按全局比例尺决定，块**底部对齐**。
- 自适应：组件填满父容器（ResizeObserver），桌面高度 ≥ 420px；窄屏（< 768px）由页面切换为 `MobileTimeline`（纵向年份列表 + 卡片，按年份升序，点击卡片 `onSelect`）。
- 标签：块足够大（宽 ≥ 56 且高 ≥ 30）时块内显示标题（1–2 行截断）；否则 hover tooltip。
- 交互：wheel 缩放（1x–3x，列宽变化）、拖拽平移、年份 chip 跳转、`←/→` 平移、hover tooltip（标题/日期/影响力/类别）、click 选中、选中块白色描边 + 外发光。
- 皮肤：使用 CSS 变量 + 类别色；字体系统栈；动画 ≤ 180ms（respect `prefers-reduced-motion`）。

`src/components/detail/EntryDrawer.tsx`

```ts
export interface EntryDrawerProps {
  entry: Entry | null;
  onClose: () => void;
  onNavigate: (entryId: string) => void; // 点击关联条目
}
```

内容顺序：标题（中文 + 英文副标题）、type 徽标 + 日期 + 影响力徽标（分数 + 锚点标签）+ 待核对徽标、类别 chips、一句话摘要、为什么重要（significance）、quote 原文块（insight：quote + speaker + occasion）、我的短评（my_comment）、深度解读（body，简易 Markdown 渲染：段落/小标题/列表/粗体）、来源列表（真实链接，显示 hostname）、关联条目（出边 + 入边，可点击跳转）、底部「复制引用」按钮（`buildCitation`）。Esc 关闭；点击遮罩关闭；打开时焦点移到关闭按钮；移动端为全屏底部抽屉。

### 6.2 公共组件（Lead 负责）

- `src/components/common/ImportanceBadge.tsx` / `ReviewBadge.tsx` / `NewBadge.tsx` / `CategoryChips.tsx`
- `src/components/common/Legend.tsx`（图例：类别色点 + 中文名 + 计数；点击切换隐藏）
- `src/components/common/EmptyState.tsx`

### 6.3 页面（Lead 负责）

- `src/pages/TimelinePage.tsx`：hero 统计条（条目数 / 年份跨度 / 最近更新 / 待核对）+ 图例 + TimelineCanvas/MobileTimeline + EntryDrawer；选中条目由 URL `?entry=` 驱动。
- `src/pages/AboutPage.tsx`：评分锚点表 + 数据模型 + 更新机制 + 免责声明。
- M2/M3 页面（Graph / Feed / Insights）M1 先占位。

## 7. 写作用域（避免并行冲突）

| 角色 | 写作用域 |
|---|---|
| Lead | 根配置、`scripts/`、`src/app`、`src/pages`、`src/components/common/`、`src/lib/{types,schema,data,format,hashRoute}.ts`、`src/theme/`、`src/styles/` |
| data-curator | `data/entries/**`（只写条目文件） |
| viz-engineer | `src/components/timeline/**`、`src/components/detail/**`、`src/lib/layout/**` |
| qa（M2 起） | 只读 + `docs/reviews/**` |

任何人**不要**改别人的文件；需要改接口时先在任务里说明，由 Lead 统一改。

## 8. 开发环境

- 项目根：`/Users/elkan_zhang/Documents/deepseek-harness/AI前沿知识图谱`
- 本机 Node：`.tooling/node-runtime/bin/node`（官方 Node 24，支持原生模块；系统 PATH 里的 Node 不可用）
- 命令前缀：
  ```bash
  export PATH="$PWD/.tooling/node-runtime/bin:$PATH"
  export PNPM="/Users/elkan_zhang/.dsh/dsh-runtimes/dsh-primary-runtime/dependencies/pnpm/bin/pnpm.mjs"
  node "$PNPM" <script>        # 或直接 node_modules/.bin/<bin>
  ```
- 常用：`node_modules/.bin/tsc --noEmit`、`node_modules/.bin/vitest run`、`node_modules/.bin/tsx scripts/validate.ts`、`node "$PNPM" run dev`

## 9. 里程碑（M1 本轮）

- M1：数据 schema + 构建管线 + 时间轴主视图 + 详情抽屉 + 22 条种子（20 核心 + 2 思想）+ 关于页基础版 + 图例/统计条；验收见根目录 `docs/M1-ACCEPTANCE.md`。
- M2：80–120 条完整种子 + 14 条奠基简述 + 关系图谱 + 每日更新流程上线。
- M3：最新动态 + 思想库 + 搜索与组合筛选 + 移动端打磨。
- M4：CLI（add-entry/remove-entry/validate）+ 关于页完整版 + 部署配置 + CI + 1000 条压测 + 详情页二期。
