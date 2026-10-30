# 项目状态（2026-10-30）

> 上下文压缩后的唯一恢复入口。只记"现在怎样 + 下一步做什么"。每次状态变化就更新这里，不再往对话里堆历史。

## 一句话

「AI 演进图谱」静态站已上线、可被搜索引擎收录、可自行改数据；用户在 VS Code 里 commit + push 即发布。

## 线上

| 项 | 值 |
|---|---|
| 仓库 | https://github.com/ELKANZHANG04/ai-evolution-graph（public） |
| 站点 | https://elkanzhang04.github.io/ai-evolution-graph/ |
| SEO 索引页 | 同上 `/p/`（187 页） |
| sitemap | 同上 `/sitemap.xml`（188 URL） |
| 发布链 | push `main` → Actions：install → validate:strict → test → build → Pages（约 1–2 分钟） |
| 当前版本 | M4 改版（思想持续讨论 + 创新雷达收窄 + 最新动态极简），本地待推送 |

## 功能现状（全部已验收）

- 主线（默认页）：27/32 里程碑，5 章，突破点高亮；章节页=全事件列表+时间轴+影响图谱
- 思想看板 v6：每个主题一张思维导图（11 张；根→子方向→思想，35 分支/90 节点），默认导图视图、可切回看板；叶子=年份/类型/影响力/两行标题，hover 摘要、点击详情；支持缩放/长分支横滚；移动端降级分支列表；不再有角色/活跃度/雷达徽标，视觉强调只由重要性决定
- 最新动态 v4：单一「最近入库」流（不再拆事件/思想），窗口=近 5 天入库 + 事件近 180 天；按时间倒序；每条标类型与影响力分数；创新雷达仅中性小标签
- 搜索：加权、高亮、类别/年份/影响力筛选、URL 状态、`/` 快捷键
- 每日更新：会话内 08:30 定时（新闻+创新信号 → 校验/构建 → `curate:apply` 主线晋升淘汰）
- 数据：191 条（180 条 2012+ / 11 条奠基），41 insight，24 needs_review，来源覆盖 98%；11 个思想主题共 90 步；本轮新增 9 条国内覆盖（Kimi K3.1 Pro、讯飞星火 X2.6、国产算力份额/订单、XHEART 芯片、DeepInfer、高德 λ0、星辰 TaaS、LingDT、大模型融资）
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
npm run test        # 单测（42 个）
npm run curate      # 主线治理 dry-run
npm run qa:ui       # 无头 Chrome 验收（75 项，含导图视图）
```

## 环境提醒

- Node 在 `.tooling/node-runtime/bin/node`，pnpm 在 DSH 依赖目录（PATH 里没有 node）。
- 本运行环境**访问不了 github.com**：push 必须用户在 VS Code 点同步；`api.github.com`、`*.github.io` 可用来验证线上。
- 站点在 GitHub Pages 子路径下，静态页内链必须带 `/ai-evolution-graph/` 前缀（构建脚本已自动加前缀 + 有防回归断言）。
- 用户非技术：讲解要分步、少术语；改动前先说明"改哪、影响什么、怎么回退"。

## 文档地图

`docs/DECISIONS.md`（为什么这样做，§13–§16 是本轮定义）· `docs/SOURCES.md`（信息源清单：国内媒体/厂商/算力/市场）· `docs/PROPOSAL-M4.md`（本轮方案）· `docs/M4-ACCEPTANCE.md`（本轮验收）· `docs/UPDATE.md`（加条目）· `docs/DEPLOY.md`（发布/部署）· `docs/SEO.md` · `docs/DOMESTIC-LAUNCH.md`（国内上线）· `docs/BEGINNER-GUIDE.md` · `docs/M1–M3.5-ACCEPTANCE.md`（各里程碑验收）
