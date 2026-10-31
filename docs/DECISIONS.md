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
- M2（已交付 2026-10-29）：107 条（97 + 10 奠基）+ **影响图谱（全局时间泳道 + 聚焦思维导图）** + 奠基时代折叠区 + 每日更新机制上线；验收见 docs/M2-ACCEPTANCE.md。
- M3：最新动态 + 思想库 + 搜索与组合筛选 + 移动端打磨。
- M4：CLI（add-entry/remove-entry/validate）+ 关于页完整版 + 部署配置 + CI + 1000 条压测 + 详情页二期。

## 10. M2 升级：影响图谱（思维导图式）× 时间轴（2026-10-29 用户要求）

用户追加："不局限于线性排列，将节点与节点之间的关系有意义的相互连接起来，像思维导图一样；界面可以放大缩小；节点模块可以点击进去看详情。"

决策：**不做二选一，而是双视图互补**：

### 10.1 时间轴（保留，默认）
面积 = 影响力、密度节奏，是产品定位的核心，不替换。

### 10.2 影响图谱（新增，导航第二项 `#/graph`）
- **全局模式**：节点位置 `x = 时间（按日期在年份内插值）`，`y = 类别泳道（10 类固定顺序）`；节点面积 ∝ importance；关系连线带箭头（上游 → 下游）；支持滚轮缩放 0.4–3x、拖拽平移、重置/适配视图；hover 高亮邻接节点与边；点击节点 → 详情抽屉。
- **聚焦模式（思维导图）**：点击节点或「以此为中心」后，该节点居中：上游（被依赖/被受启发/奠基来源）向左按跳数分层，下游（受其影响）向右按跳数分层，深度 1–2 跳；其余节点隐藏或淡化；可一路下钻；面包屑/「返回全局」退出。这是"思维导图"体验的核心。
- 复用：同一份数据、`src/generated/graph.json`、类别图例筛选（隐藏类别淡化）、EntryDrawer、URL 深链（`#/graph?focus=transformer-2017&entry=berkeley-2018`）。
- 实现：ECharts `graph` 按需引入（`layout: 'none'` + 构建期/前端预计算坐标 + `roam: true`）；布局是纯函数（`src/lib/layout/graph-layout.ts`），可单测。
- 移动端：< 900px 降级为「影响链列表」（聚焦节点的上游/下游分组列表 + 可点击），并提示桌面体验更佳。

### 10.3 关系方向语义（构建期归一化，硬性）
| relations.type | 语义 | 边方向（source → target） |
|---|---|---|
| 基于 | 本条目基于目标 | target → 本条目 |
| 启发 | 本条目受目标启发 | target → 本条目 |
| 开源衍生 | 本条目衍生自目标 | target → 本条目 |
| 奠基 | 本条目为目标奠基 | 本条目 → target |
| 竞争 | 对称 | 双向 |
| 人才流动 | 人才从本条目相关方流向目标 | 本条目 → target（标注） |

> 数据自检注意：现有 22 条中有 2 处方向存疑（attention-2014→seq2seq-2014「基于」、sutton→scaling-laws「启发」），M2 数据整理时修正。

### 10.4 关系视觉
- 边颜色/线型 = 关系类型（基于 蓝实线、启发 紫虚线、竞争 红、开源衍生 绿点线、奠基 灰、人才流动 琥珀弧线），并配关系图例。
- 箭头指向影响力方向；未聚焦时边的透明度低，hover/选中高亮 1–2 跳上下游闭包，其余淡化至 8%。


### 10.6 M2 组件契约（GraphPage 已由 Lead 写好，props 必须严格匹配）

```ts
// src/components/graph/InfluenceMap.tsx（viz-engineer 负责）
export interface InfluenceMapProps {
  nodes: GraphNode[];              // src/generated/graph.json
  edges: GraphEdge[];              // 已归一化为 上游→下游，direction/bidirectional 可用
  hiddenCategories: Category[];    // 隐藏类别：节点/边淡化，不重排
  selectedId: string | null;       // 当前详情抽屉条目
  focusId: string | null;          // null=全局模式；非 null=聚焦思维导图模式
  onSelect: (entryId: string) => void;   // 单击节点
  onFocusChange: (entryId: string | null) => void; // 双击节点 / 返回全局
}
export function InfluenceMap(props: InfluenceMapProps): JSX.Element

// src/components/graph/MobileInfluenceList.tsx（viz-engineer 负责）
export interface MobileInfluenceListProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  focusId: string | null;
  hiddenCategories: Category[];
  onSelect: (entryId: string) => void;
  onFocusChange: (entryId: string | null) => void;
}
```

文件归属：`src/lib/layout/graph-layout.ts`（+test）、`src/components/graph/**` 归 viz-engineer；`src/pages/GraphPage.tsx`、`src/styles/app.css` 归 Lead。

### 10.5 后续（M3 之后）
时间轴可选叠加「关系弧线」：默认视图也能看到连接（hover 块高亮弧线），作为 M2 之后的增强项，不阻塞当前里程碑。

## 11. M2.5 信息架构改版：主线优先 × 思想看板（2026-10-29 用户反馈）

用户试玩 M1/M2 后的反馈：
> 事件的确很多，页面体量很大、重点不突出、文字看不见；想要思维导图或更好的交互逻辑，让主线、突破点很清楚；论文、思想演进和模型实践同样重要；科学家言论不用放在图里，用看板实现，体现前后人思想不断递进/推翻。

### 11.1 新信息架构（导航）
| 导航 | 路由 | 定位 |
|---|---|---|
| **主线**（默认） | `#/mainline` | 只讲大脉络：24 个里程碑 × 5 个章节，大卡片大字；突破点（≥9 分）高亮；其余事件压缩为章节底部背景刻度 |
| 全量数据 | `#/explore?mode=timeline｜graph` | M1 时间轴与 M2 影响图谱降级为二级探索视图（保留全部交互） |
| 思想看板 | `#/thoughts` | 言论/思想从图中移出：每条链"命题 → 推进 → 修正/反驳"，大字号引用原文 + 说话人 + 场合 |
| 最新动态 | `#/feed` | M3 交付（7/30 天窗口） |
| 关于 | `#/about` | 数据模型、评分、更新机制 |

兼容旧深链：`#/timeline` → `#/explore?mode=timeline`，`#/graph` → `#/explore?mode=graph`。

### 11.2 主线视图设计
- 数据驱动：条目 frontmatter 增加可选 `mainline: true`（目前 24 条，见 data/entries），章节配置在 `src/lib/mainline.ts`（5 章：深度学习复兴 / Transformer 与预训练 / 规模化与大模型 / 生成式 AI 爆发 / 推理、开源与智能体）。
- 纵向叙事：每章 = 章节标题 + 一句话概述 + 里程碑卡片网格（min 220px，标题 15px、意义 12.5px、限 2–3 行）；卡片含年份、类型徽标、影响力、类别 chips、与主线内其他节点的关系提示。
- 突破点：importance ≥ 9 的卡片金色描边/光晕 + 「突破」角标；页面提供「仅看突破点」开关。
- 体量不消失：每章底部显示"另有 N 条背景事件"+ 极简刻度（hover 可看标题，点击可看详情），不抢主线焦点。
- 交互：点击卡片开详情抽屉；键盘 Enter/Space；`sm` 以下单列。

### 11.3 思想看板设计（v2，2026-10-29 用户反馈后升级）
- 数据：`type: insight` 的可选字段 `thought_chain`（7 个主题 id）、`thought_role`（thesis/advance/revision/rebuttal）、`thought_claim`（一句话主张）、`thought_summary`（2–3 句概括）；主题与步骤配置在 `src/lib/thoughtChains.ts`（架构与范式 / 规模与泛化 / 软件形态 / 世界模型 vs 语言模型 / 对齐与安全 / 智能体与交互 / 开源与闭源）。
- 布局：顶部 sticky 主题筛选条（全部 + 7 主题，单选可回退）；7 个纵向主题分区，每区 = 编号 + 标题 + 关键问题 + 主题概括 + 步骤横向链（4–5 步时横向滚动并有显式提示，≤900px 纵向 ↓）；步骤按日期排序，箭头取 step.arrow，角色色区分。
- 卡片（思想优先）：主标题 = `thought_claim`（17px/700）→ `thought_summary`（13px，3 行）→ speaker/occasion（单行）→ **原文降级为 2 行斜体、可「展开原文」**（展开 8 行，不误触卡片点击）→「看详情 →」；事件/实践步骤用紧凑卡（标题 + 摘要，无原文区）。
- 点击卡片/相关实践 chips 打开完整详情抽屉（原文、正文解读、来源、关联条目）。
- 后续（M3）：按人物/立场筛选、继续补名言。

### 11.3.1 交付状态（2026-10-29）

M2.5 已交付：主线视图、思想看板、全量数据二级页、旧深链兼容；验收见 docs/M2.5-ACCEPTANCE.md。

M2.6 已交付（2026-10-29）：思想看板升级为 7 个主题（16 条引文，主张优先、原文可展开）、主线章节入口 + 主题页（全部事件列表 + 本章时间轴/影响图谱）、全量数据并入主题页（导航 4 项）；验收见 docs/M2.6-ACCEPTANCE.md。

### 11.4 组件契约
```ts
// src/components/mainline/MainlineView.tsx（viz-engineer）
{ chapters: MainlineChapterData[]; selectedId: string | null; breakthroughOnly: boolean; onSelect(entry: Entry): void }

// src/components/thoughts/ThoughtBoard.tsx（board-engineer）
{ chains: ThoughtChainData[]; selectedId: string | null; onSelect(entry: Entry): void }
```
文件归属：`src/components/mainline/**` 归 viz-engineer；`src/components/thoughts/**` 归 board-engineer；页面/路由/数据层/样式 tokens 归 Lead。

### 11.5 全量视图调整
- 影响图谱节点排除 `type: insight`（言论进看板，不进图），减少噪音。
- 时间轴保留全部（含思想条目），作为"全量数据"查阅。


## 12. M3.5 动态化：最新动态 × 主线治理 × 创新雷达（2026-10-29 用户反馈）

用户要求："最新动态就是要新，可以不足为奇；积累超过某数量就把重要的归类到主线，然后开始末位淘汰——这部分是搜集新闻、理解世界动向，是动态的，而不是历史书。创新雷达可以合并到思想看板并标注出来；很新的路就摆在当前思想主题第一个；和最新动态联动。"

### 12.1 动态流（#/feed）
- 定位：活新闻流 + 创新信号流；允许小新闻（importance 3–7），但必须真实、新鲜。
- 排序：最近新增按 `added_at` 倒序；最新事件按 `date` 倒序（7/30/全部）。
- 状态徽标：主线 / 候选晋升 / 创新 / 待核对 / NEW。
- 页面展示：最近新增、最新事件（时间窗）、候选晋升池、创新雷达（联动思想看板）。
- 数据要求：每日新增条目必须写 `added_at`（今天），未核实写 `needs_review: true`。

### 12.2 主线动态化（晋升 / 末位淘汰）
- 容量：`MAINLINE_CAP = 32`（src/lib/curation.ts）。
- 晋升：重要度 ≥ 8、非主线、非待核对、非 insight 的事件（按重要度/日期排序）补入主线空位。
- 淘汰：主线超过容量时，按重要度由低到高、同分按更早日期淘汰；**10 分条目永不淘汰**。
- CLI：`npm run curate`（dry-run）/ `npm run curate:apply`（写入并产出 `docs/reviews/curation-<date>.md`）。
- 每日更新任务（08:30）在入库后自动执行 `curate.ts --apply`，然后重建站点。

### 12.3 创新雷达（并入思想看板）
- 不单独成页；思想看板卡片加「创新雷达」徽标 + 成熟度（论文/原型/产品），筛选条加「创新雷达」chip。
- 新增可选 frontmatter 字段：`innovation: true`、`maturity: paper|prototype|product`、`why_underrated`、`thought_pin: 'top'`。
- 很新的路线：`thought_pin: 'top'` 置顶到所属思想主题第一条（builder 先置顶、再按日期）。
- 新主题（11 个）：architecture / scaling / software / worldmodel / alignment / opensource / agents / **interaction 交互范式 / generative-decision 生成式决策 / memory 记忆与持续学习 / evaluation 评估与安全**。
- 与动态联动：动态页展示最新创新条目；创新卡片显示 NEW（added_at 近 7 天）并可点开详情。
- 采集：每日更新增加"低热度信号扫描"（arXiv/会议/官方研究博客），默认 needs_review。

### 12.4 主题关系展示（下一步，方案已给）
见 docs/PROPOSAL-M3.md：推荐「主题关系图 + 问题线」组合，待用户确认后实施。

## 13. M4 改版：思想「持续讨论」× 创新雷达收窄 × 最新动态极简（2026-10-30 用户反馈）

用户原话要点：
- "思想一定是要被不断被讨论的才是有价值的……有些主题之下只有两三年前的几次思想，现在都没有新事件发生。我希望你多找被讨论、新的、被不断探索的思想。"
- "架构与范式这类主题难道就不要更新了吗，就停在 2020？"
- "最新动态这里主要突出新，不要超过半年。"
- "创新雷达……我希望是融入到各个主题当中。如果已自成一派，就不需要每个都标创新雷达，主题上体现新即可……大部分是在原有的某条路径上创新。"
- "最新动态模块只需要放两个部分：最近 3–5 天新入库的事件/思想，其中有一些按新的定义标注为创新雷达就可以，不需要额外的『最近事件』『候选晋升池』『创新雷达』栏目。标签风格可延续，标注影响力和分数是特别好的。"

### 13.1 思想主题的准入：持续被讨论

- 主题价值来自**持续的讨论**，不是静态收藏。每个主题应呈现从起点到 2026 年的演进线：
  - 每个主题 `steps ≥ 6`；
  - 最新步骤 `date ≥ 2025-01-01`（关键主题到 2026）；
  - 2024-01-01 之后 `≥ 2` 条。
- 看板呈现：主题头显示「最新 YYYY-MM · 近 18 个月 N 条」+ 年份活动条 + 活跃度徽标（持续活跃 / 待补充）；筛选器支持按活跃度查看，让缺口可见。
- **排序：主题内按时间倒序**——最左为最新，向右逐步回溯到更早的讨论（2026-10-30 用户要求）。`thought_pin` 只作为「新方向」标注，不再参与排序，避免新旧交错。
- 数据约束由 `scripts/lib/load-entries.ts` 的跨字段检查与 `scripts/validate.ts` 的新鲜度表兜底（警告级，不阻塞 CI）。

### 13.2 创新雷达（收窄，取代 §12.3 的宽口径）

- 定义：**既有路径上出现的新方向/新方法**，还没被主流吸收，值得关注。
- 必须挂在某个思想主题的既有步骤之间；该主题至少有 2 条非雷达步骤托底——不允许主题只剩雷达条目。
- 同一方向只标**代表条目**（最早提出 / 表述最清晰的那条），后续工作不再逐条标。
- 已**自成一派**（形成独立主题/子领域）的方向，不再逐条标雷达；改由主题头「新方向：<名称>」聚合标注（来源：`thought_pin: 'top'` 条目）。
- 全库雷达上限 8 条；`innovation: true` 必须同时具有 `thought_chain`、`maturity`、`why_underrated`（校验器强制）。
- UI：删除全局「创新雷达」筛选与独立栏目，雷达徽标只在主题内以聚合标签 + 代表条目徽标出现；卡片统一显示影响力分数（importance/10）。

### 13.3 最新动态（取代 §12.1 的多样式信息流）

- 定位：**只展示最近 5 天新入库**（`added_at`）**且事件本身发生在近 180 天内**的条目，突出"新"，不做历史回放——补录的旧内容即使 `added_at` 是今天，也不进「最新」。
- 结构只有两块：**新入库 · 事件**（event/product）与**新入库 · 思想**（insight）；条目内联标注影响力分数、类型、类别、创新雷达、NEW。
- 删除：时间窗 tab（7/30/全部）、最新事件列表、候选晋升池、独立创新雷达栏目、页头主线容量/候选池统计。
- 空态：显示「最近 5 天暂无新入库」与最近一次入库日期。
- 主线治理（§12.2）仍每日执行，但不再占用最新动态页的版面。

> 完整执行方案（数据缺口、UI 规格、验收线）见 `docs/PROPOSAL-M4.md`。

## 14. M4.1 修订：思想卡去标签化 × 最新动态统一流（2026-10-30 用户反馈）

用户原话要点：
- "最新动态……模型发布、事件、思想这些并不想割裂开。想延续主线页的主题+简明表示，同时标出贡献度这种，但是又想抓住每一个思想。"
- "思想看板持续活跃和待补充两个标签是多余的。每一个思想按照主线那种标注就可以，不能出现 6 分的比 7 分的更醒目这种情况。"
- "推进反驳修正这类标签可以不要，他们体现在标题和贡献度（重要度）中就可以。"

### 14.1 思想看板 v5：标注与主线一致，视觉强调只服从重要性

- 每个主题内按时间倒序（最新在左，向右回溯）；不设角色标签、不再画「命题→推进→修正→反驳」箭头。
- 卡片标注与主线里程碑卡一致：年份 / 类型徽标 / 影响力分数（贡献度）/ 一句话主张 / 概括 / 类别 chips。
- 删除：「持续活跃 / 待补充」筛选与主题头状态徽标（用年份活动条表达讨论连续性即可）；置顶「新方向」ribbon、创新雷达/成熟度徽标不再逐条出现。
- 视觉层级只由重要性决定：`importance ≥ 9` 为突破（金色描边），`= 10` 为里程碑（再强一档）；不再用角色色/雷达色制造"低分更醒目"。
- 创新雷达仍在数据层保留，只在主题头以「新方向：…」文字聚合呈现。

### 14.2 最新动态 v4：单一「最近入库」流

- 不再按「事件 / 思想」拆栏；模型发布、事件、思想统一按时间倒序成一条流，保证每个思想都被看见。
- 数据窗口不变：`added_at` 最近 5 天 + 事件日期近 180 天。
- 卡片标注与主线一致：日期 / 入库日期 / 类型 / 影响力分数 / 类别；创新雷达仅保留中性小标签（不抢焦点）。
- 页头统计简化为「数据更新于 + 最近 5 天入库 N」，section 头部给出「事件 X · 思想 Y · 近半年 · 按时间倒序」。

### 14.3 静态 SEO 页同步

- `/p/thoughts/`：卡片去掉角色与雷达标注，改为日期/类型/影响力；主题头保留步数/最新/近 18 个月/新方向。
- `/p/feed/`：改为单一「最近入库」列表。

> 验收：qa:ui 75/75、validate:strict 0 error / 0 warning、42 单测、build 187 个静态页。

## 15. M4.2 思维导图视图：每个主题一张导图（2026-10-30 用户反馈）

用户原话："忽然觉得思想看板最适合做成思维导图，但是又想要保留看板的信息量"；追问后明确："A 是对于每一个主题做一张思维导图哦"、"不需要跨主题（连线）"。

### 15.1 结构

- **每个思想主题一张思维导图**，同一页纵向排布 11 张；不做跨主题连线。
- 三层结构：**根 = 主题**（标题 + 总步数）→ **一级分支 = 子方向**（如「注意力与效率」「卷积时代」「非 Transformer 结构」，共 35 个分支）→ **叶子 = 思想/事件节点**（每个分支一行，时间倒序，最新在左）。
- 叶子卡片：年份、类型（思想/事件/产品）、影响力分数、两行标题；hover 显示完整摘要；点击打开详情抽屉；`importance ≥ 9` 金色边框（与主线一致）。
- 分支与根、分支与叶子之间用贝塞尔曲线连接；根在左、分支纵向排开、叶横向排开，长分支左右滚动。

### 15.2 信息量怎么保留

- 默认**思维导图视图**适合看结构与跨子方向对比；右上切换「看板」保留原有横排卡片视图（完整标题/概括/原文/类别）。
- 主题头仍保留问题句、描述、步数/观点数/最新月份、年份活动条、新方向聚合；导图工具栏提供 − / 适配 / + 缩放与百分比。
- 移动端（≤767px）导图自动降级为「子方向分组列表」，避免横向溢出。

### 15.3 实现

- `src/components/thoughts/ThemeMindMap.tsx`（新）+ `mindmap.css`：纯计算布局（根/分支/叶子坐标 + SVG 曲线），HTML 节点保证可点/可 hover；缩放用 CSS transform。
- `src/lib/thoughtChains.ts`：新增 `THEME_BRANCHES`（主题 → 子方向 → entryIds 的人工配置）与 `ThoughtChainData.branches`；未分配的条目自动归入「其他讨论」；分支内按时间倒序。
- `src/components/thoughts/ThoughtBoard.tsx`：顶部「思维导图 / 看板」切换；默认导图。
- 验收：qa:ui 75/75（含导图 11 张、35 分支、90 节点、125 连线、缩放、筛选、节点开详情、看板回退、移动端降级）。

> 数据结构仍以 `data/entries/*.md` 为唯一来源；分支只是展示层配置，不新增 frontmatter 字段。

## 16. M4.3 国内方向覆盖：模型 × 市场 × 算力（2026-10-30 用户反馈）

用户原话："微信公众号的几家媒体，机器之心、量子位、腾讯科技等几家国内媒体质量是不错的。国内模型、市场、AI 算力（你自己补充这种方向动向，也十分重要，后面更新最新动态的时候不可以遗漏。"

### 16.1 覆盖要求

- 每日更新必须**国内 + 海外双向扫描**，国内方向不可遗漏；覆盖清单：
  1. 国内模型：发布/开源/权重放出、能力与价格变化；
  2. 国内市场：融资/IPO、价格战、商业化与收入、大厂资本开支；
  3. AI 算力：国产芯片产品与订单、超节点/集群、IDC 份额、出口管制与供应链（HBM/存储/光模块）、智算中心与电力；
  4. 政策与监管：备案、标准、算力券、地方政策；
  5. 具身智能/终端：机器人基座模型、车规芯片、AI 手机/PC；
  6. 全球前沿：模型、论文、agent、评测与安全。
- 有重要动态必须入库（国内优先）；确无动态要在每日汇报里写明「已扫描 XX，无重要新增」。
- 源清单落地为 `docs/SOURCES.md`（国内科技媒体/厂商/财经/算力/政策 + 抓取方式 + 可靠性分级）；`docs/UPDATE.md` 与每日定时任务提示词同步写入该清单。

### 16.2 本轮补充的国内数据（9 条，182 → 191）

- 模型：Kimi K3.1 Pro（3T 级开源权重、百万上下文）、讯飞星火 X2.6（全国产算力训练、端云一体、X2.6-4B 开源）；
- 市场：国产大模型融资升温（阶跃星辰近 25 亿美元、月之暗面 20 亿美元、智谱/MiniMax 港股）；讯飞星辰 TaaS 企业级供给；蚂蚁数科决策模型 LingDT；
- 算力：国产 AI 加速卡份额与订单（昇腾 384 超节点 750+、IDC 国产份额 41%、四家厂商收入高增、大厂资本开支上修）；XHEART X7 Ultra「大模型定义芯片」；DeepSeek 开源推理框架 DeepInfer；高德 λ0 具身全身基座（终端/具身方向）。
- 统一打 `国内` tag，便于搜索与后续筛选；`sources` 全部为可访问的官方/媒体正文 URL。

> 后续每日更新缺国内方向视为未完成；发现遗漏时优先补 24–72 小时内的国内动态，而不是只补海外。

## 17. M4.4 我的灵感：星标 + 自动联系；补全量子位来源（2026-10-31 用户反馈）

用户原话："我想加一个对最新事件加星标的功能，反应的是这个思想对我有启发，我想把加星标的事件建立一个我自己的区域，最终他们自行的产生联系"；"最新事件还是有点不全，量子位这个公众号你也可以关注一下"。

### 17.1 星标（个人灵感收藏）

- 任意条目（最新动态卡片、详情抽屉）都可点 ☆ 加星；星标语义 = **这个思想对我有启发**。
- 纯前端 `localStorage`（key `aeg.stars.v1`），**不上传、不需登录**；换浏览器/清缓存会丢失（在关于页/灵感页文案中说明）。
- 新增导航「我的灵感」（`#/stars`）：星标条目列表（按加星时间倒序）、移除星标、点开详情。

### 17.2 自动联系（最终自行产生联系）

- 星标条目之间自动算联系分（`src/lib/connections.ts`）：
  - 已有引用/影响关系 +4；同一思想主题 +3；共同标签 +2/个（上限 +6，过滤「国内/海外/AI」等泛标签）；同类别 +1；90 天内同期 +1；
  - 分数 ≥2 视为有联系；返回理由文案（如「共同标签：Agent、开源」「属于同一思想主题」）。
- 展示：**灵感网络**（力导向布局 SVG，节点大小=影响力、颜色=类别、连线粗细=联系强度；悬停高亮相邻节点）+ **自动联系 Top 10** 列表（可点击跳详情）+ 每个星标条目显示「N 条联系」。
- 星标越多网络越密；无需手工连线，也不依赖后端推荐。

### 17.3 数据补全（量子位）

- 用户指出最新事件不全，本轮从量子位（QbitAI）补 7 条 2026-10-28～10-31 的动态：DeepSeek 开源 Super-agent、Gemini 4 Carbon、智元 GO-3/WITA-OMNI、百度 APP 四大 AI 升级、联想天禧 AI 4.5、蚂蚁百灵 Ling-3.1-flash、IDC 中国 MaaS 市场。
- `docs/SOURCES.md` 与 `docs/UPDATE.md` 将量子位标注为**每日优先必刷**；每日任务提示词同步强调「量子位/机器之心/腾讯科技 公众号每日必刷，国内模型/市场/算力/终端不可漏」。

## 18. M4.5 信源反思 × AI 语义联系（2026-10-31 用户反馈）

用户原话："你要反思一下，为何量子位能关注到的事你原先从官网抓取不到……自行寻找类似的高质量公众号和官网新闻，来互相佐证、更新条目"；"我的灵感收集之后，互相之间联系的方式有些过于简单直接，导致看不出大区别。我觉得是否需要接入 api 大模型来辅助联系呢……你帮我选一个。"

### 18.1 为什么漏（根因）

- 抓取优先级偏向「海外官方博客 + arXiv + HN」：国内模型发布、产品/终端、具身、市场/算力大量首发在中文科技媒体，官方英文渠道不覆盖；
- 只依赖单一日英文 AI 日报，未实际抓取量子位/机器之心等中文首页；
- 搜索 query 以英文为主，中文事件自然召回不足；
- 没有「多源互证」机制，单一来源不足时干脆不收，导致漏报。

**修复**：docs/SOURCES.md §7 固定抓取顺序（国内媒体首页 → 厂商官网 → 海外官方）；重要动态 ≥2 独立来源互证；公众号线索用官网/网易号正文 URL；量子位标注每日优先必刷；每日任务提示词同步。

### 18.2 联系太「平」的问题

规则联系只有 5 类信号，同类事件容易都落在相似分数，缺少「说得清的区别」。两层升级：

1. **规则层加 IDF + 强度分级**：共享标签按稀有度加权（少见标签更有意义），总分分为强（≥11）/中（≥6）/弱；UI 显示强/中/弱与 `N 分`，不再所有线一个样。
2. **AI 语义层（可选，构建期）**：用免费模型为每个条目提取「核心思想 / 3 个抽象主题 / 5 个关键词」，前端据此算语义相似度，叠加到规则分数上，并给出「AI 主题：Agent 长期在线」「AI 关键词：Super-agent、Router」等可读理由。AI 贡献的连线用**金色虚线**区分，列表加 `AI` 徽章。

### 18.3 免费模型选型与密钥

- 选 **智谱 GLM-4.7-Flash**（2026-01-19 发布，30B 总参 / 3B 激活，开源 + BigModel 免费 API；替代 GLM-4.5-Flash）。理由：免费、中文好、够快，官方明确「开源、免费」；用户记得的 GLM-4.0 已被 4.7-Flash 取代。
- **密钥不进浏览器**：AI 语义在 **GitHub Actions 构建期**生成（`scripts/ai-links.ts`，环境变量 `ZHIPU_API_KEY`），产物仅 `src/generated/ai-links.json`（主题/关键词，不含密钥）；前端只读产物。
- 用户只需在 GitHub 仓库 Settings → Secrets and variables → Actions 添加 `ZHIPU_API_KEY`（智谱开放平台 bigmodel.cn 申请），下一次部署自动生效；未配置或 API 失败时自动回退规则联系，不影响站点。
- **2026-11-01 已启用**：用户配置 secret 后触发部署，CI 用 GLM-4.7-Flash 生成「核心思想 / 主题 / 关键词」；线上验证 `#/stars` 已出现金色虚线 AI 连线与 `AI` 徽章。
- **2026-11-01 修复「加了星标仍无金色连线」**：根因——① 首轮 AI 生成覆盖不全（仅约 48/204 条成功，免费 API 批次超时/限流）；② 模型自创主题过于分散（78 个主题覆盖 48 条），几乎无可匹配对；③ 后续重跑又耗尽免费额度，生成结果为空，AI 层被静默关闭。
  修复分三层：
  1. **数据持久化**：AI 语义数据改为仓库内 `src/data/ai-links.json`（种子 76 条，人工校正规范主题）；CI 构建期增量补全，并用 `actions/cache` 在部署之间缓存，**API 失败也不会清空已有数据**。
  2. **生成稳定性**：受控主题词表（18 个规范主题，禁止自创）、批次 8/并发 2/单请求 45s/重试 1、整体 5 分钟预算、最新优先、逐条补漏；失败保留种子。
  3. **匹配与可见性**：关键词模糊匹配（忽略大小写/连字符/包含关系，如 Agent/Agentic）；AI 分 ≥1.5 即可成边；星标卡片直接显示 AI 主题/关键词 chip，状态栏显示已生成条数。
- 本地想预览：`ZHIPU_API_KEY=xxx npm run ai:links && npm run build`。
