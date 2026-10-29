# 每日更新流程（UPDATE）

目标：**每天更新一次**，新事件/新思想按 `date`（时间轴位置）与 `importance`（面积/评分）自动归位，无需手工摆放。
本期执行者：Lead（Agent）。部署到 GitHub/Vercel 后迁移为 CI 定时任务（见 §5）。

## 1. 触发时间

- 本地/会话期：每天 **08:30（Asia/Shanghai）** 定时任务。
- 部署后：GitHub Actions `schedule: cron: '30 0 * * *'`（UTC 00:30 = 北京时间 08:30），见 M4 配置。

## 2. 单次更新步骤

1. **抓取候选**（Web）：官方博客优先、权威媒体次之。
   - OpenAI：https://openai.com/news/
   - Anthropic：https://www.anthropic.com/news
   - Google DeepMind：https://deepmind.google/discover/blog/
   - Meta AI：https://ai.meta.com/blog/
   - Google AI：https://blog.google/technology/ai/
   - Hugging Face：https://huggingface.co/blog
   - arXiv 最新：https://arxiv.org/list/cs.CL/recent 、https://arxiv.org/list/cs.LG/recent
   - Hacker News AI：https://news.ycombinator.com/
   - 中文源（可选）：机器之心、量子位、智源社区
2. **筛选**：仅收最近 24–72 小时、与 AI 直接相关、影响力 ≥ 4 分的条目；思想/观点类优先（用户强调「新思想非常细、非常有价值」）。
3. **起草**：写入 `data/entries/<id>.md`：
   - `date` = 事件公开日期（不是抓取日期）；
   - `added_at` = 今天（用于 NEW 标记）；
   - `needs_review: true`（草稿必须待核对；核验后可改 false）；
   - `sources` = 真实可访问 URL；无法确认 → 留空 + needs_review；
   - `type: insight` 必须写 quote / speaker / occasion + 300–800 字正文深度解读。
4. **核验**：至少 1 个可信来源确认事实与日期；数字/版本号务必核对；拿不准就保留 needs_review。
5. **校验 + 构建**：
   ```bash
   npm run validate        # 0 error
   npm run data:build      # 编译 bundle
   ```
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

- 不确定的事实、数字、日期 → `needs_review: true`；
- 来源链接不确定 → 留空，**禁止编造 URL**；
- 近 6 个月事件不确定 → 宁缺毋滥；
- relations 必须指向库内已存在的条目；
- 思想条目必须写清楚「谁、在什么场合、说了什么」，并附深度解读。
