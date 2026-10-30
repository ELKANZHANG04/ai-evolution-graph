# SEO：让网站被搜到的路线图

## 一、现状与限制

当前站点是 **SPA（单页应用）+ hash 路由**：所有页面都是同一个 HTML，通过 `#/mainline`、`#/thoughts` 这类片段切换。

- Google/Bing 能执行 JS，**可能**索引到部分内容，但片段（`#` 后面的部分）通常视为同一个页面；
- 百度对 JS 渲染支持弱，基本只能抓到入口页的静态 HTML；
- 所以现在"能搜到"≈ 只能搜到首页标题/描述，内容页很难被单独搜到。

已经做的基础：`sitemap.xml` + `robots.txt` 自动生成（`site.config.json` 填公网地址后）、canonical、Open Graph 分享图、中文 title/description/keywords。

## 二、已实现的"轻量 SEO 静态化"（2026-10-30）

在不改动交互路由的前提下，构建时已生成 **141 个静态内容页**（`dist/p/**`，不依赖 JS）：
- `/p/` 内容索引、`/p/mainline/` 主线、`/p/thoughts/` 思想看板、`/p/feed/` 动态快照、`/p/about/` 关于；
- 每条条目一个页面 `/p/entry/<id>/`（标题/日期/摘要/意义/原文/来源/关联条目 + 回到交互版入口）；
- sitemap 自动扩展为 **142 个 URL**，`robots.txt` 允许抓取，每页带 canonical/OG/JSON-LD；
- `BAIDU_TOKEN=... npm run seo:push` 可批量主动推送。

> 这已经能满足"百度能读到内容、每页可被收录"。下面第 1–3 步是更彻底的长期方案（路径路由 + 预渲染 + 交互页独立 URL），可在 M4 做。

## 三、升级路线（建议按顺序）

### 第 1 步：路径路由（替换 hash）
- 地址从 `#/mainline` 变成 `/mainline`、`/thoughts`、`/chapter/scaling-era`、`/entry/chatgpt-2022`。
- 托管平台配置：Vercel 用 rewrites；Netlify 用 `_redirects`；GitHub Pages 用 `404.html` 回退。
- 好处：每个页面有独立 URL，才能被单独收录、分享。

### 第 2 步：构建期静态预渲染（关键）
- 对每个路由生成一个"带完整 HTML 内容"的静态页（预渲染），而不是只有 `<div id="root"></div>`。
- 做法：用 `vite-prerender` / 自写 Node 脚本，在 `vite build` 后用无头浏览器或 React SSR 渲染每条路由 → 写入 `dist/<route>/index.html`。
- 这一步让搜索引擎**不执行 JS 也能读到内容**（对百度尤其重要）。

### 第 3 步：条目独立页 + sitemap 展开
- 为每条条目生成 `/entry/<id>` 静态页（标题、日期、摘要、来源、关联条目）。
- sitemap 从 1 个 URL 扩展到：首页 + 5 个章节页 + 11 个主题 + 130+ 条条目（自动生成，每日更新后重建）。
- 这是"能被搜到"的主力内容。

### 第 4 步：基础 SEO 完善
- 每页独立 `<title>` / description / canonical / og:image；
- 结构化数据（JSON-LD：Article / FAQ / BreadcrumbList）；
- 图片 alt、语义化标签、内链；
- 性能（Lighthouse ≥ 90）、移动端适配。

### 第 5 步：提交搜索引擎
| 平台 | 地址 | 说明 |
|---|---|---|
| Google Search Console | search.google.com/search-console | 验证后提交 sitemap，几天~几周收录 |
| Bing Webmaster | bing.com/webmasters | 可导入 Google 验证 |
| 百度搜索资源平台 | ziyuan.baidu.com | 提交 sitemap；海外站点收录慢 |
| 360/搜狗 | 各自站长平台 | 可选 |

## 四、国内用户与访问速度

- Netlify/Vercel 在国内访问速度不稳定，搜索引擎可收录但用户体验一般；
- 面向国内建议：**国内云静态托管**（腾讯云 COS、阿里云 OSS、又拍云等）+ **自定义域名 + ICP 备案**；
- 备案需要域名实名与主体信息，通常 1–3 周；这是国内公开网站的常见门槛。

## 五、预期时间

- Google/Bing：提交后数天到数周开始收录，内容页陆续增加；
- 百度：2–8 周起，取决于站点权重与更新频率（我们每天更新，有利）；
- 新域名/新站点通常有 1–3 个月"观察期"，持续更新 + 外链（GitHub、知乎、公众号等）会加速。

## 六、下一步（我可以直接做）

1. 路径路由 + `404.html`/rewrite 配置；
2. 构建时预渲染 5 个主页面（主线/思想看板/动态/关于/章节页）；
3. 条目独立页 + sitemap 自动展开；
4. 每页 meta/JSON-LD；
5. 部署后提交搜索平台的步骤截图指引。

> 这些不会影响现有交互，属于"M4 收尾 + 可被搜索"的关键改造。等站点先上线、拿到公网地址后开始最合适。
