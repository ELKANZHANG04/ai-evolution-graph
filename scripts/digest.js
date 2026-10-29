/**
 * digest.js —— 预留：每日更新的「自动起草」入口（本期不实现）
 *
 * TODO（M4 之后 / 部署到 CI 后实现）：
 * 1. 读取待抓取来源清单（官方博客 RSS / arXiv / Hacker News 等）。
 * 2. 抓取最近 24h 的候选条目，输出候选 JSON（标题、URL、发布时间、摘要）。
 * 3. 若配置了 LLM API Key（如环境变量 LLM_API_KEY），调用模型起草条目：
 *    - 严格输出 frontmatter + 正文（type/summary/significance/quote/speaker/occasion）；
 *    - needs_review 一律 true，added_at 为当天；
 *    - 不确定的 sources 留空，禁止编造 URL。
 * 4. 写入 data/entries/（或 opens a PR），交由人工审核：
 *    - 人工核对事实/日期/来源 → 把 needs_review 改为 false；
 *    - 运行 npm run validate 与 npm run build。
 * 5. 失败安全：任何一步失败不得写入半成品条目；日志写 docs/reviews/。
 *
 * 本期（M1–M4）每日更新由 Agent 人工把关：见 docs/UPDATE.md。
 */

// TODO: 实现上述流程
console.log('[digest] 占位脚本：本期不实现自动抓取，请参考 docs/UPDATE.md 的人工审核流程。');
