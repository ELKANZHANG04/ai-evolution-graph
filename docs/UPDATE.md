# 每日更新流程（UPDATE）

目标：**每天更新一次**，新事件/新思想按 `date`（时间轴位置）与 `importance`（面积/评分）自动归位，无需手工摆放。
本期执行者：Lead（Agent）。信息源清单见 `docs/SOURCES.md`（国内媒体/厂商/算力/市场），每日必须覆盖国内方向。部署到 GitHub/Vercel 后迁移为 CI 定时任务（见 §5）。

## 1. 触发时间

- 本地/会话期：每天 **08:30（Asia/Shanghai）** 定时任务。
- 部署后：GitHub Actions `schedule: cron: '30 0 * * *'`（UTC 00:30 = 北京时间 08:30），见 M4 配置。

## 2. 单次更新步骤

1. **抓取候选**（Web）：完整源清单见 `docs/SOURCES.md`，每天必须国内 + 海外两边都扫。
   - 海外官方：OpenAI / Anthropic / Google DeepMind / Meta AI / Google AI / Hugging Face；
   - 论文：arXiv cs.CL、cs.LG、cs.AI 最新；
   - 海外社区与媒体：Hacker News、TechCrunch、The Information；
   - **国内科技媒体（微信公号 + 官网）**：机器之心、量子位、腾讯科技、新智元、智东西、36 氪、晚点 LatePost、科技日报/中国科技网、DeepTech 深科技、硅星人、甲子光年；
   - **国内市场与资本**：证券时报、21 世纪经济报道、第一财经、财新、界面新闻、同花顺/券商研报摘要（注明「券商观点」）、投资界；
   - **国内厂商一手**：DeepSeek、阿里通义、月之暗面 Kimi、智谱、字节 Seed/豆包、腾讯混元、百度文心、科大讯飞、MiniMax、阶跃星辰、商汤、高德/阿里 ATH、蚂蚁数科、华为昇腾、寒武纪、摩尔线程、沐曦、壁仞、海光、中芯国际、长鑫存储；
   - 微信公众号无稳定列表页：用官网/网易号/搜狗微信发现线索，引用时以官网正文 URL 作为 `sources`。
2. **筛选**：仅收最近 24–72 小时、与 AI 直接相关、影响力 ≥ 4 分的条目；思想/观点类优先（用户强调「新思想非常细、非常有价值」）。
   **覆盖清单（每天逐项扫，不可遗漏国内方向）**：
   - 国内模型：发布/开源/权重放出、能力或价格变化；
   - 国内市场：融资/IPO、价格战、商业化与收入、大厂资本开支；
   - AI 算力：国产芯片产品与订单、超节点/集群、IDC 份额、出口管制与供应链（HBM/光模块/存储）、智算中心与电力；
   - 政策与监管：备案、标准、算力券、地方政策；
   - 具身智能/终端：机器人基座模型、车规芯片、AI 手机/PC；
   - 全球前沿：模型、论文、agent、评测与安全。
   国内方向每天至少检查一轮；有重要动态必须入库，确无动态要在汇报里写明「已扫描，无重要新增」。
3. **起草**：写入 `data/entries/<id>.md`：
   - `date` = 事件公开日期（不是抓取日期）；
   - `added_at` = 今天（用于 NEW 标记）；
   - `needs_review: true`（草稿必须待核对；核验后可改 false）；
   - `sources` = 真实可访问 URL；无法确认 → 留空 + needs_review；
   - `type: insight` 必须写 quote / speaker / occasion + 300–800 字正文深度解读。
4. **核验**：至少 1 个可信来源确认事实与日期；数字/版本号务必核对；拿不准就保留 needs_review。
5. **校验 + 构建 + 主线治理**：
   ```bash
   npm run validate        # 0 error
   npm run data:build      # 编译 bundle
   npm run curate:apply    # 候选晋升 + 满额末位淘汰（写 docs/reviews/curation-<date>.md）
   npm run build
   ```
   另：每日更新需做一次「创新信号扫描」（0–2 条新想法入库，按 DECISIONS §13.2 的收窄定义，详见 docs/PROPOSAL-M4.md）：
   - 只找「旧路径上的新方向/新方法」，**不新增主题**，挂到已有主题的既有步骤之间；
   - `innovation: true` 只给同一方向的**代表条目**（全库上限 8 条），必须同时写 `maturity` + `why_underrated`；
   - 方向已自成一派 / 已是常规路线 → 不加 innovation，作为普通步骤入库；
   - 很新的路线可加 `thought_pin: 'top'` 置顶。
6. **自动归位**：时间轴按 `date` 排序、按年分列、列内按 `importance` 降序 treemap 排布——不需要任何手工坐标。
7. **汇报**：当天新增 N 条、其中待核对 M 条、覆盖类别、来源数。用户在界面顶部看到「更新于」与 NEW 标记。

## 3. 评分（每日新增条目同样适用）

按 `src/theme/importance.ts` 锚点，**禁止通胀**：

- 10：开启范式/时代（仅 AlexNet / Transformer / ChatGPT 级）；
- 8–9：里程碑突破（行业级）；
- 6–7：重要进展（新 SOTA、重要开源、显著能力跃升、现象级产品）；
- 4–5：值得注意；
- 1–3：小启发。

新增条目校验会自动检查：10 分条目数 > 5 或 8–9 分占比 > 30% 时告警。

## 4. 手动增删

- 新增：`npm run add-entry`（交互式，生成合法模板）或复制 `data/entries/_template.md`。
- 修改：直接编辑 Markdown。
- 删除：`npm run remove-entry <id>`（归档到 `data/archive/`，不物理删除，便于追溯）。
- 每次改动后跑 `npm run validate`；提交前 `npm run build` 必须通过。

## 5. 部署后的自动化（M4 预置，本期不启用）

1. GitHub Actions 每日 08:30 运行 `scripts/digest.js`（预留）：
   - 抓取源 → 候选列表（JSON）；
   - 若配置了 LLM API Key，则起草 Markdown 草稿（带 `needs_review: true`）；
   - 直接提交到 `data/entries/` 或开 PR 供人工审核。
2. 人工审核：把 `needs_review` 改为 false、核对来源。
3. CI 校验通过后触发 Vercel/GH Pages 构建发布。

> `scripts/digest.js` 本期只保留 TODO 注释，不实现自动抓取（用户要求本期每日更新由 Agent 人工把关质量）。

## 6. 质量红线（更新时必须遵守）

- **国内模型 / 市场 / AI 算力三类方向每天必扫**：不得只看海外；有重要动态必须入库（源清单见 docs/SOURCES.md），无动态要明确说明已扫描；
- 国内数字（份额、融资额、出货量、增速）必须注明来源与口径；券商研报标注「券商观点」，不当作既成事实；
- 思想主题要**持续被讨论**：每个主题最新步骤 ≥ 2025，且 2024 年后 ≥ 2 条（validate 会打印主题新鲜度表）；
- 创新雷达是「旧路径上的新方向」：必须有 `thought_chain`/`maturity`/`why_underrated`，且所属主题至少有 2 条非雷达步骤托底；全库 ≤ 8 条；
- 最新动态只展示最近 5 天 `added_at` 的入库条目（事件/思想两块），且事件日期须在近 180 天内；补历史不写 `added_at`；
- 不确定的事实、数字、日期 → `needs_review: true`；
- 来源链接不确定 → 留空，**禁止编造 URL**；
- 近 6 个月事件不确定 → 宁缺毋滥；
- relations 必须指向库内已存在的条目；
- 思想条目必须写清楚「谁、在什么场合、说了什么」，并附深度解读。
