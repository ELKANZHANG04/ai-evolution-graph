# 新手调试指南（工具 + 5 个常用场景）

## 一、名词速查

| 名词 | 一句话解释 | 你的项目里对应什么 |
|---|---|---|
| 本地开发 | 在自己电脑上跑起来看效果 | `npm run dev` → http://127.0.0.1:5173 |
| dev server | 本地开发服务器（只给本机看，别人访问不到） | Vite dev server |
| 构建 | 把源码打包成可发布的静态文件 | `npm run build` → `dist/` |
| 部署 | 把 `dist/` 放到公网上 | Netlify / Vercel / GitHub Pages |
| 域名 | 别人访问的网址 | `*.netlify.app` 或你自己的域名 |
| HTTPS | 加密的网站协议（浏览器显示小锁） | 托管平台自动提供 |
| CDN | 把文件缓存到离用户近的节点，加快访问 | 三个托管平台都自带 |
| 后端 | 需要服务器运行的接口/数据库 | 本项目**没有**，纯静态 |
| 服务器 | 一台持续对外服务的机器 | 托管平台替你管，不用自己买 |

## 二、工具清单

1. **Chrome 开发者工具（DevTools）**：浏览器里按 `F12` 或 `Cmd+Option+I`。最常用的是 6 个面板：
   - **Elements**：看页面结构、实时改 CSS（刷新恢复，适合试颜色/间距）
   - **Console**：看报错（红色）与日志；页面白屏先看这里
   - **Network**：看资源加载、接口请求、文件是否 404、加载耗时
   - **Application**：看本地存储、缓存
   - **Performance / Lighthouse**：看性能与 SEO 评分
   - **设备模式**（左上角手机图标）：模拟手机尺寸，检查移动端
2. **VS Code**：编辑代码/内容（Markdown 文件可直接改）。
3. **终端（Terminal）**：执行 `npm run dev` / `npm run build` 等命令。
4. **Git**（可选）：给改动存档、回滚；也是自动部署的前提。
5. **截图/录屏**：反馈问题时附上截图，定位最快。

## 三、5 个实际调试场景

### 场景 1：页面打不开 / 白屏
1. 确认本地服务在跑：终端里 `npm run dev` 是否显示 `http://127.0.0.1:5173`；
2. 浏览器打开该地址；
3. F12 → Console，看红色报错；
4. 常见原因：依赖没装（`npm install`）、端口被占、代码语法错误。

### 场景 2：样式不对 / 文字看不清
1. F12 → 选中元素（Elements 左上箭头）→ 右侧 Styles 面板改 `font-size` / `color` / 间距，实时预览；
2. 满意后把改动写进对应 CSS 文件（`src/styles/app.css` 或组件自己的 CSS）；
3. 移动端效果：点设备模式选 iPhone → 刷新看真实布局。

### 场景 3：数据没更新 / 搜不到某条
1. 先跑 `npm run validate` 看数据格式对不对；
2. 再跑 `npm run data:build`（生成 `src/generated/*.json`）；
3. F12 → Network → 刷新，看 `entries.json` 是否是新内容；
4. 搜索/筛选问题可看 Network 里有没有 404，或 Console 报错。

### 场景 4：上线后样式/功能不对（本地正常）
1. 99% 是"部署的是旧构建"或"资源路径问题"：重新 `npm run build` → 重新部署；
2. F12 → Console/Network 看 404（比如 `assets/xxx.js` 加载失败）；
3. GitHub Pages 子路径部署：项目已用相对路径 `base: './'`，通常无需改。

### 场景 5：想让页面被搜索引擎收录
1. 先看 [DEPLOY.md](DEPLOY.md) 第 5 节；
2. 上线后提交 sitemap 到 Google/Bing/百度；
3. 更快被收录需要「路径路由 + 静态预渲染」，见 [SEO.md](SEO.md)。

## 四、内容怎么改（不需要写代码）

- 一条知识 = `data/entries/` 下的一个 Markdown 文件（YAML frontmatter + 正文）。
- 新建：`npm run add-entry`（交互式）或复制 `data/entries/_template.md`。
- 修改后：`npm run validate`（校验）→ `npm run dev` 看效果。
- 删除：`npm run remove-entry <id>`（归档到 `data/archive/`，不物理删除）。
- 评分、字段规则见 [DECISIONS.md](DECISIONS.md) 与「关于」页。

## 五、安全提示

- 不要把任何 API Key、密码写进代码或提交到 Git；
- 需要密钥时放 `.env` 文件（已被 `.gitignore` 忽略），并在托管平台的后台配置环境变量；
- 公开仓库上线前确认没有个人信息/隐私数据。
