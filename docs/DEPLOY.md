# 部署指南（零基础版）

## 0. 先纠正一个概念：静态网站不需要你"买服务器"

- **服务器**：一台一直开着、对外提供服务的电脑（云厂商的虚拟机/容器）。
- **静态网站**：页面和图片都是提前生成好的文件，不需要后端程序、不需要数据库。
- 所以本项目**不需要自己管服务器**，只需要一个「**静态托管平台**」：把构建出来的 `dist/` 文件夹放到它的全球 CDN 上，它给你一个 HTTPS 网址。
  常见平台：**Netlify、Vercel、GitHub Pages**。它们替你完成了"服务器"的工作。

以后你听到「部署」= 把 `dist/` 上传/发布到托管平台；「域名」= 别人访问的网址；「备案」= 在中国大陆用自有域名对外提供网站时的实名登记（用 `*.netlify.app` 这类平台子域名则不需要）。

---

## 1. 最快上线：Netlify Drop（5 分钟，不需要 Git）

适合先让大家看到效果。

1. 本地构建：
   ```bash
   npm install
   npm run build
   ```
   > 构建产物在 `dist/` 文件夹（里面有 index.html、assets/、og-image.png、robots.txt 等）。
2. 打开 <https://app.netlify.com/drop>（需要登录一次，GitHub/邮箱均可）。
3. 把 `dist` 文件夹直接拖进网页 → 几秒后得到一个公网地址，如 `https://ai-evolution-graph.netlify.app`。
4. 以后内容更新：重新 `npm run build` 再拖一次（或按第 2 节关联 Git 自动部署）。

**注意**：Netlify 在国内访问速度一般；如果主要给国内用户看，见第 5 节。

---

## 2. 长期推荐：GitHub Pages（你的账号 `ELKANZHANG04`）

> 我查了一下：GitHub 上 **`ELKANZHANG04`（没有下划线）** 存在（名字 Elkan_Zhang，2026-08 注册，目前 0 个公开仓库）；`ELKAN_ZHANG04`（带下划线）不存在。以下按 `ELKANZHANG04` 写。

1. 在 GitHub 新建公开仓库，例如 `ai-evolution-graph`（**不要**勾选初始化 README，保持空仓库）。
2. 本机配置好 Git 后，在项目根目录执行：
   ```bash
   git remote add origin https://github.com/ELKANZHANG04/ai-evolution-graph.git
   git push -u origin main
   ```
3. 仓库 → **Settings → Pages → Build and deployment → Source: GitHub Actions**。
   项目里已经带了 `.github/workflows/deploy.yml`（校验 → 测试 → 构建 → 发布 Pages），每次 push 到 `main` 会自动上线。
4. 等 1–2 分钟，访问：`https://elkanzhang04.github.io/ai-evolution-graph/`
5. 项目用的是相对路径资源 + hash 路由，部署到子路径不需要改配置。

> 你之前说 GitHub 打不开：这是网络问题，不影响别人访问你的 Pages。你可以在能访问 GitHub 的网络环境（或代理/加速器）执行 push；也可以让我在能联网的会话里协助。

---

## 3. 自动部署（可选）：Vercel

- 打开 <https://vercel.com> → 用 GitHub 登录 → Import 仓库 → 框架选 Vite → Deploy。
- 之后每次 push 自动构建；有 PR 预览地址（适合"边用边改"）。
- `vercel.json` 已配好。Vercel 在国内访问速度一般。

---

## 4. 绑定自己的域名（可选）

1. 买域名（阿里云/腾讯云/Cloudflare 均可，几十元/年）。
2. 在托管平台（Netlify/Vercel/GitHub Pages）添加自定义域名，按提示到域名商加一条 CNAME/A 记录。
3. 平台自动签发 HTTPS 证书。
4. 中国大陆用户建议域名做 **ICP 备案**（否则国内 CDN 可能被阻断/限速）。

---

## 5. 让大家"能搜到"（SEO）——上线之后要做的事

先上线拿到公网地址，然后：

1. 把地址填进 `site.config.json` 的 `siteUrl`，重新 `npm run build`：
   ```json
   { "siteUrl": "https://your-site.example.com" }
   ```
   构建会自动生成 `robots.txt`、`sitemap.xml`，并把 canonical / og:url 注入页面。
2. 提交搜索引擎（免费）：
   - **Google Search Console**：<https://search.google.com/search-console> → 添加资源 → 验证 → 提交 `sitemap.xml`。
   - **Bing Webmaster Tools**：<https://www.bing.com/webmasters>（可复用 Google 验证）。
   - **百度搜索资源平台**：<https://ziyuan.baidu.com> → 添加站点 → 提交 sitemap。
3. 目前是"单页应用 + hash 路由"（地址里的 `#/mainline`），搜索引擎大多只认真索引入口页。要更好地被搜到，需要升级「路径路由 + 静态预渲染」，见 [SEO.md](SEO.md)。

---

## 6. 每日更新是怎么做到的？能不能不靠这个对话框？

**当前**：每日 08:30 的更新任务运行在 **DSH 这个会话/客户端**里（由会话内的定时任务触发）。所以：

- 这个 App/会话关掉后，任务不会执行；
- 数据更新 = 重新构建 `dist/` + 重新发布，静态网站自己不会变。

**想真正无人值守，有三条路**：

| 方案 | 需要什么 | 适合 |
|---|---|---|
| A. 保持 DSH 开着，我每天在会话里跑 | DSH 客户端开机 | 现在（零配置） |
| B. GitHub Actions 定时任务 | 仓库 + 能访问 GitHub + 一个 LLM API Key（让 CI 起草条目） | 长期推荐，免费 |
| C. 自己的电脑定时任务（launchd）+ 脚本 | 电脑常开 + LLM API Key | 不想用 GitHub |

B/C 都需要一个模型 API Key 来"读新闻 → 起草条目"；只部署静态网站不会自动更新内容。你决定后我可以把对应的定时脚本/工作流写好。
