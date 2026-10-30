# 项目状态（2026-10-30）

> 用途：上下文压缩后快速恢复状态；每次大改动后更新。

## 线上

- 仓库：https://github.com/ELKANZHANG04/ai-evolution-graph（public）
- 线上地址：https://elkanzhang04.github.io/ai-evolution-graph/
- 静态内容索引（给搜索引擎）：https://elkanzhang04.github.io/ai-evolution-graph/p/
- sitemap：https://elkanzhang04.github.io/ai-evolution-graph/sitemap.xml （142 个 URL）
- 部署方式：push 到 `main` → GitHub Actions（`.github/workflows/deploy.yml`：安装→校验→测试→构建→Pages）
- 首次部署失败原因（已修）：Pages 未开启；另修复了干净 clone 下 `mainline.ts` 循环依赖导致 Build 失败（commit 134be84）

## 功能状态

- **主线**（默认）：24→27 个里程碑（动态晋升）、5 章、突破点高亮、背景事件可展开标题、章节入口进主题页
- **主题页**：全部事件列表 + 本章时间轴 + 本章影响图谱（全量数据并入）
- **思想看板**：11 主题、27 观点卡、创新雷达徽标/筛选、新路线置顶、原文可展开
- **最新动态**：最近新增（added_at）/ 7·30 天 / 全部、候选晋升池、主线容量 27/32、创新雷达区
- **全局搜索**：加权 + 高亮 + 类别/年份/影响力筛选 + URL 状态 + `/` 快捷键
- **每日更新**：会话内定时 08:30（新闻 + 创新信号 → 校验/构建 → `curate:apply` 主线治理）
- **数据**：136 条（109+ 2012 至今 + 10 奠基；27 insight）；needs_review 22；来源覆盖 ~97%
- **SEO**：141 个静态内容页（`/p/mainline`、`/p/thoughts`、`/p/feed`、`/p/about`、`/p/entry/<id>`）+ sitemap/canonical/OG/JSON-LD；百度主动推送脚本 `npm run seo:push`
- **国内上线**：路径已给出（腾讯云 EdgeOne Pages / CloudBase 免备案先上；正式走域名+ICP备案+OSS/COS+CDN），见 docs/DOMESTIC-LAUNCH.md

## 待确认（不阻塞）

1. 主题关系图 + 问题线是否开工（方案见 docs/PROPOSAL-M3.md）
2. 主线容量 32 是否合适
3. 每日创新扫描 + 自动晋升/淘汰是否照此执行（当前是）
4. 国内托管平台选择 / 域名 / 是否备案

## 常用命令

```bash
npm run dev            # 本地开发
npm run build          # 完整构建（含 SEO 静态页 + sitemap）
npm run build:clean    # 清空生成目录后完整构建（模拟 CI）
npm run validate       # 数据校验
npm run test           # 单测
npm run curate         # 主线治理 dry-run
npm run seo:push       # 百度主动推送（需 BAIDU_TOKEN）
npm run qa:ui          # 无头 Chrome 交互验收
```

## 环境注意

- 本机 Node 在 `.tooling/node-runtime/bin/node`（PATH 里没有 node）；pnpm 在 DSH 目录。
- 当前运行环境**无法访问 github.com**（push 需要用户在 VS Code/本机操作）；api.github.com 与 *.github.io 可访问，可用于线上验证。
- 站点部署在 GitHub Pages 子路径，所有静态页站内链接必须带 `/ai-evolution-graph/` 前缀（构建脚本已自动处理 + 防回归断言）。
