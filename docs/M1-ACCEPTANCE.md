# M1 验收清单

> 交付时间：2026-10-29 · 范围：数据 schema + 构建管线 + 时间轴主视图 + 详情抽屉 + 22 条种子 + 图例/统计条 + 关于页基础版

## 一、如何验收

```bash
npm install
npm run dev          # http://127.0.0.1:5173
```

或直接看构建产物：

```bash
npm run build && npm run preview
```

## 二、验收要点

### 1. 数据管线（硬性）
- [ ] `npm run validate` 0 error；warning 可解释（清单见汇报）
- [ ] `npm run data:build` 成功，`src/generated/{entries,meta,graph}.json` 生成
- [ ] 22 条种子覆盖：AlexNet、GAN、Seq2Seq、Attention、ResNet、AlphaGo、Transformer、GPT-1/2/3、BERT、Scaling Laws、AlphaFold2、CLIP、Codex、RLHF/InstructGPT、Stable Diffusion、ChatGPT、LLaMA、GPT-4
- [ ] 至少 2 条 `type: insight`（Karpathy《Software 2.0》、Sutton《苦涩的教训》），且详情里能看到 quote / speaker / occasion / 深度解读
- [ ] relations 全部指向库内条目，构建期强制校验通过
- [ ] 每条都有真实来源或明确 `needs_review`；抽查 3 个链接可打开

### 2. 时间轴主视图（核心）
- [ ] 横轴按年分区、从 2012 开始，年份标签清晰
- [ ] **块面积与 importance 严格成正比**（单测：面积守恒误差 < 0.5%；肉眼：ChatGPT/AlexNet/Transformer 为最大块）
- [ ] 2023 年列明显比早期年份"矮而密"，2017 列"稀疏巨块"——节奏可见
- [ ] 颜色 = 类别，与图例一一对应；图例点击可筛选（非命中类别变暗、不重排）
- [ ] hover 显示标题 tooltip；点击打开详情抽屉；选中块有白色描边
- [ ] 滚轮缩放 1x–3x、拖拽平移、年份 chip 跳转、`←/→` 键盘平移、双击重置
- [ ] 桌面 1440×900 与移动 390×844 均可用（移动端为纵向时间轴）

### 3. 详情抽屉
- [ ] 标题、日期、影响力（分数+锚点标签）、类别、一句话摘要、「为什么重要」
- [ ] insight 显示 quote 原文块 + speaker + occasion
- [ ] 来源链接可点击（显示域名）；关联条目可点击跳转
- [ ] `needs_review: true` 显示「待核对」徽标
- [ ] 一键复制引用文本；Esc / 遮罩关闭
- [ ] 深链可用：`#/timeline?entry=chatgpt-2022` 刷新后仍打开该条目

### 4. 表面工程
- [ ] `npm run typecheck` 通过
- [ ] `npm test` 通过（treemap 面积守恒等）
- [ ] `npm run build` 通过，产物可 `npm run preview`
- [ ] 关于页展示完整评分锚点表（10/8-9/6-7/4-5/1-3 及锚点）
- [ ] 深色、克制、信息密度优先；中文为主、专有名词英文

## 三、已知不在 M1 范围

- 关系图谱（M2）、最新动态/思想库/搜索筛选（M3）、CLI 完善与部署 CI（M4）、独立详情页（二期）
- 奠基时代（<2012）条目 M2 加入
- 部署：GitHub 暂不可用，只预置配置，未实际上传

## 四、交付自检结果（2026-10-29 11:12）

自动化质量门（全部通过）：

| 检查 | 结果 |
|---|---|
| `npm run typecheck`（tsc 7） | 0 error |
| `npm test`（vitest 5） | 15/15 passed（treemap 面积守恒 8 + schema 7） |
| `npm run validate` | 0 error / 1 warning（8–9 分占比 55%，M1 极端挑选所致，M2 扩库稀释） |
| `npm run build` | 通过；JS 298 KB → gzip 99 KB，CSS 22.6 KB → gzip 5.2 KB |
| `npm run qa:ui`（puppeteer + Chrome） | 14/14：块数/面积、tooltip、点击抽屉、Esc、图例筛选、缩放、年份 chip、关于页锚点表、移动端无溢出/抽屉、无 console 错误 |
| 布局校验（viz 独立验证） | 块面积与 importance 各档内误差 0.00%；列底边对齐；overlay 与块相交数 0（1440×900 与 162% 缩放） |
| 移动端 390×844 | 纵向年份列表 22 卡片、抽屉 100vw、无横向溢出 |

数据状态：22 条（2012–2023）、来源覆盖 22/22、needs_review 2（AlexNet 日期为通行近似值；AlphaFold2 用 CASP14 结果日，Nature 正式发表为 2021-07-15）。

截图：`docs/screenshots/m1-{desktop,drawer,mobile,mobile-drawer,about}.png`。
