# M2 验收清单

> 交付范围：数据扩到 80–120 条（含 2024–2026 近期）+ 10 条奠基简述 + **影响图谱（全局时间泳道 + 聚焦思维导图）** + 奠基时代折叠区 + 每日更新机制上线

## 一、如何验收

```bash
npm install
npm run dev     # http://127.0.0.1:5173
```

重点看两个入口：`#/timeline`（时间轴 + 奠基折叠）与 `#/graph`（影响图谱）。

## 二、影响图谱（本次核心，按用户 2026-10-29 要求）

- [ ] **全局模式**：节点按「时间 × 类别泳道」排列（不是线性堆叠），节点间有方向的关系连线；年份刻度在顶部；节点面积/直径 ∝ 影响力
- [ ] 关系视觉：颜色/线型按类型区分（基于/启发/竞争/开源衍生/奠基/人才流动），箭头指向影响方向；图例可对照
- [ ] hover 节点：tooltip（标题/日期/影响力/类别/上游数/下游数），邻接节点与边高亮，其余淡化
- [ ] **缩放/平移**：滚轮 0.4–3x、拖拽、重置/适配视图
- [ ] **单击节点 → 详情抽屉**（复用 M1 抽屉，含来源/关联/复制引用）
- [ ] **双击节点 → 聚焦思维导图**：以它为中心，上游在左、下游在右，按 1–2 跳分层；中心突出；再次双击可下钻；「返回全局」可退出
- [ ] 类别图例筛选生效（淡化不重排）
- [ ] URL 深链：`#/graph?focus=transformer-2017&entry=bert-2018` 刷新后状态一致
- [ ] 移动端 390×844：降级为「上游 / 此条目 / 下游」影响链列表，可点击看详情
- [ ] 性能：100+ 节点/边交互流畅、无 console 错误

## 三、时间轴（M1 回归 + 增强）

- [ ] 22+ 条 → 80–120 条后，**面积仍严格 ∝ importance**（面积守恒测试 + 抽查 10 分/4 分块）
- [ ] 年份列连续（2012–2026，空年份保留空列）；2023 后密集、2026 收尾
- [ ] **奠基时代折叠区**：<2012 条目（图灵测试、达特茅斯、感知机、反向传播、LSTM、深蓝、ImageNet 等 ~10 条）折叠为一行摘要，点击展开列表，点击条目打开详情
- [ ] 图例筛选 / hover tooltip / 缩放平移 / 年份跳转 / 详情抽屉回归通过

## 四、数据

- [ ] `npm run validate` 0 error
- [ ] 2012 至今条目 80–120 条；奠基条目 10 条（一句话简述，不展开长文）
- [ ] 必含条目逐项覆盖：AlexNet、GAN、Seq2Seq、Attention、ResNet、AlphaGo、Transformer、GPT-1/2/3、BERT、Scaling Laws、AlphaFold2、CLIP、Codex/Copilot、RLHF(InstructGPT)、Stable Diffusion、ChatGPT、GPT-4、LLaMA、MCP、o1、Sora、DeepSeek-V3、DeepSeek-R1、Cursor、Perplexity、Character.AI、NotebookLM、Sutton《苦涩的教训》、Karpathy Software 2.0/3.0、LeCun 世界模型
- [ ] insight 条目 ≥4 条，且每条有 quote / speaker / occasion + 300–800 字正文深度解读
- [ ] 来源覆盖 ≥ 95%；no needs_review 条目有「待核对」角标；来源抽查可打开
- [ ] 评分分布：10 分条目仅范式级（≤5）；8–9 分占比 ≤30%（扩库后应回落）
- [ ] relations 全部指向库内条目、方向语义符合 DECISIONS §10.3

## 五、工程与每日更新

- [ ] `npm run typecheck` / `npm test` / `npm run build` 全绿
- [ ] `npm run qa:ui` 通过（时间轴 + 影响图谱 + 移动端）
- [ ] 每日更新机制：docs/UPDATE.md + 每日 08:30 定时任务（已创建），流程可复现
- [ ] README / DECISIONS / UPDATE 文档与实际一致

## 六、已知不在 M2 范围

- 最新动态流、思想库页面、全局搜索与组合筛选（M3）
- 时间轴关系弧线叠加（M3+ 增强）
- CLI 完善、关于页完整版、部署 CI、1000 条压测、独立详情页（M4）

## 七、交付自检结果（2026-10-29）

| 检查 | 结果 |
|---|---|
| `npm run validate -- --strict` | 0 error / 0 warning |
| `npm run typecheck` | 0 error |
| `npm test` | 32 passed（schema 7 + treemap 8 + graph-layout 17） |
| `npm run build` | 通过；首屏 JS 432 KB → gzip 139 KB；图谱 chunk 懒加载 490 KB → gzip 167 KB |
| `npm run qa:ui`（无头 Chrome） | 22/22 通过 |
| 数据规模 | 107 条（2012 至今 97 + 奠基 10） |
| 关系 | 105 条 relation（影响图谱 97 节点 / 102 条边） |
| 来源覆盖 | 2012 至今 93/97（96%）；奠基条目部分为简述+待核对 |
| insight | 4 条（Karpathy 2.0/3.0、Sutton、LeCun），均含 quote/speaker/occasion + 深度解读 |
| 评分分布 | 10 分 3 条；8–9 分 25 条（23.4%，低于 30% 警示线） |
| needs_review | 18 条（10 条奠基 year-only 日期 + 8 条其它不确定项） |
| 移动端 | 时间轴纵向列表、影响链列表、全屏抽屉，无横向溢出 |
| 已知限制 | 全局图谱在 2023–2025 密集区节点较拥挤（可用滚轮放大/聚焦解决）；时间轴关系弧线叠加留待 M3 |

截图：`docs/screenshots/m2-{timeline,foundation,graph-global,graph-focus,graph-mobile}.png`
