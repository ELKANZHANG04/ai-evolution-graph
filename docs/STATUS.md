# 项目状态（2026-11-02）

> 上下文压缩后的唯一恢复入口。只记"现在怎样 + 下一步做什么"。每次状态变化就更新这里，不再往对话里堆历史。

## 一句话

「AI 演进图谱」静态站已上线、可被搜索引擎收录、可自行改数据；用户在 VS Code 里 commit + push 即发布。

## 线上

| 项 | 值 |
|---|---|
| 仓库 | https://github.com/ELKANZHANG04/ai-evolution-graph（public） |
| 站点 | https://elkanzhang04.github.io/ai-evolution-graph/ |
| SEO 索引页 | 同上 `/p/`（228 页） |
| sitemap | 同上 `/sitemap.xml`（229 URL） |
| 发布链 | push `main` → Actions：install → validate:strict → test → build → Pages（约 1–2 分钟） |
| 当前版本 | M4.7 我的灵感 v3（星标叠加主线网络 + 位置解读），2026-11-02 每日更新部署 |

## 功能现状（全部已验收）

- 主线（默认页）：27/32 里程碑，5 章，突破点高亮；章节页=全事件列表+时间轴+影响图谱
- 思想看板 v6：每个主题一张思维导图（11 张；根→子方向→思想，35 分支/90 节点），默认导图视图、可切回看板；叶子=年份/类型/影响力/两行标题，hover 摘要、点击详情；支持缩放/长分支横滚；移动端降级分支列表；不再有角色/活跃度/雷达徽标，视觉强调只由重要性决定
- 最新动态 v4：单一「最近入库」流（不再拆事件/思想），窗口=近 5 天入库 + 事件近 180 天；按时间倒序；每条标类型与影响力分数；创新雷达仅中性小标签
- **我的灵感 v3**（`#/stars`）：任意条目点 ☆ 加星（localStorage 本地保存，不上传）。星标不再是互连乱网，而是**叠加到主线网络**：27 个主线里程碑按 5 阶段排成骨架，每条星标先找主线锚点，接得上的连到里程碑节点，接不上的作为「新方向」单独成带（虚线临时挂靠）；星标可拖动、主线节点会为它轻微让位（过渡动画）；点击节点看详情。
  - 网络方框下方是**「星标在主线中的位置」**：每条一句话说明它接在哪、属于哪一阶段、是延续还是突破；优先用构建期 GLM-4.7-Flash 生成（`ai-links.json` 的 position/mainline 字段，CI 每次部署按日期倒序补最近 24 条，高峰 429 时串行退避/降级模型，覆盖不到的部分自动用「核心思想 + 规则锚点」兜底）；不显示任何 AI 标注。
  - 下方保留**主题簇自动分类**（≥2 条成簇 + 次主题并入 + 其他线索，随星标动态调整），每条标出「关联之处」。
  - 种子 `src/data/ai-links.json` 已补齐 223 条（含 2026-11-02 新增 12 条）；CI 未配置密钥/额度不足时页面仍完整可用，仅位置文案降级。
- 搜索：加权、高亮、类别/年份/影响力筛选、URL 状态、`/` 快捷键
- 每日更新：会话内 08:30 定时（新闻+创新信号 → 校验/构建 → `curate:apply` 主线晋升淘汰）
- 数据：223 条（212 条 2012+ / 11 条奠基），40 insight，32 needs_review，来源覆盖 98%；11 个思想主题共 90 步；11-02 新增 12 条（LongCat-2.5、DeepSeek 1055 亿融资、Anthropic IPO、Rubin 出货、AI 标准落地、Meta×傅里叶人形机器人、简智融资、Claude 游戏克隆限制、AWM、辉羲 IPO、Claude Ultra、西湖世界模型中心），关键动态均有 2 个以上来源
- 数据治理：`MAINLINE_CAP=32`，重要性≥8 可晋升，满则淘汰最低分（10 分保护）

## 未决（不阻塞，等用户拍板）

1. 国内托管选型：EdgeOne Pages / CloudBase（免备案先上）vs 域名+ICP备案+OSS/COS+CDN
2. 百度/搜狗/360 提交 sitemap（需用户站长账号；`npm run seo:push` 需 `BAIDU_TOKEN`）
3. 是否做主题关系图 + 问题线（方案 docs/PROPOSAL-M3.md）
4. 是否真·路径路由 + 预渲染（让每条记录有独立可收录 URL，SEO 更强）

## 常用命令

```bash
npm run dev         # 本地开发
npm run build       # 完整构建（含 SEO 静态页 + sitemap）
npm run validate    # 数据校验
npm run test        # 单测（59 个）
npm run curate      # 主线治理 dry-run
npm run qa:ui       # 无头 Chrome 验收（89 项，含主线网络与星标）
npm run ai:links    # 可选：用 GLM-4.7-Flash 生成语义关键词/主线位置（需 ZHIPU_API_KEY）
```

## 环境提醒

- Node 在 `.tooling/node-runtime/bin/node`，pnpm 在 DSH 依赖目录（PATH 里没有 node）。
- github.com 访问**可能很慢/间歇失败**：push 加 HTTP/1.1 与重试；`api.github.com`、`*.github.io` 可用来验证线上。
- 站点在 GitHub Pages 子路径下，静态页内链必须带 `/ai-evolution-graph/` 前缀（构建脚本已自动加前缀 + 有防回归断言）。
- 用户非技术：讲解要分步、少术语；改动前先说明"改哪、影响什么、怎么回退"。

## 文档地图

`docs/DECISIONS.md`（为什么这样做，§13–§20；§20 是灵感 v3 定义）· `docs/SOURCES.md`（信息源清单：国内媒体/厂商/算力/市场）· `docs/PROPOSAL-M4.md`（本轮方案）· `docs/M4-ACCEPTANCE.md`（本轮验收）· `docs/UPDATE.md`（加条目）· `docs/DEPLOY.md`（发布/部署）· `docs/SEO.md` · `docs/DOMESTIC-LAUNCH.md`（国内上线）· `docs/BEGINNER-GUIDE.md` · `docs/M1–M3.5-ACCEPTANCE.md`（各里程碑验收）
