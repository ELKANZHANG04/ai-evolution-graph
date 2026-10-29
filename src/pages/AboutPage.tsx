import { META } from '../lib/data';
import { formatBuiltAt } from '../lib/format';
import { IMPORTANCE_ANCHORS } from '../theme/importance';

const FIELDS: Array<[string, string, string]> = [
  ['id', '必填', '唯一 kebab-case 标识，文件名与之一致'],
  ['type', '必填', 'event（突破事件）/ insight（观点/思想）/ product（产品发布）'],
  ['title / title_en', '必填', '中文标题 / 英文标题'],
  ['date', '必填', 'YYYY-MM-DD，决定时间轴位置'],
  ['importance', '必填', '1–10 整数，锚点见下表，长期一致、禁止通胀'],
  ['categories', '必填', '10 类多选；第一个为主类别（决定颜色）'],
  ['summary / significance', '必填', '两句话事实摘要 / 为什么重要'],
  ['quote / speaker / occasion', 'insight 必填', '观点原文 / 谁说的 / 场合'],
  ['tags', '必填', '关键词数组，用于搜索'],
  ['sources', '必填（可空）', '真实 URL 数组；不确定就留空，禁止编造'],
  ['relations', '必填（可空）', '指向其他条目的关系：奠基/基于/启发/竞争/开源衍生/人才流动'],
  ['needs_review', '必填', '事实/日期/来源不确定时标 true，详情页显示「待核对」'],
  ['node_kind', '可选', 'model/paper/company/person/concept，关系图谱节点类型'],
];

export function AboutPage() {
  return (
    <div className="about-page">
      <header className="about-hero">
        <h1>关于「AI 演进图谱」</h1>
        <p>
          一个面向「想看懂 AI 世界的人」的知识面板：回答 AI 怎么发展过来的、最近发生了什么、哪些思想值得记住这三个问题。
          核心视觉隐喻是<b>块面积 = 影响力</b>——不读文字，仅凭块的大小与疏密就能感知 AI 发展的节奏与重心。
        </p>
      </header>

      <section className="about-section">
        <h2>数据与当前状态</h2>
        <dl className="about-stats">
          <div>
            <dt>条目总数</dt>
            <dd>{META.count}</dd>
          </div>
          <div>
            <dt>年份跨度</dt>
            <dd>{META.firstDate?.slice(0, 4)}–{META.latestDate?.slice(0, 4)}</dd>
          </div>
          <div>
            <dt>有来源链接</dt>
            <dd>
              {META.withSources}/{META.count}
            </dd>
          </div>
          <div>
            <dt>待核对</dt>
            <dd>{META.needsReview}</dd>
          </div>
          <div>
            <dt>构建时间</dt>
            <dd style={{ fontSize: 13 }}>{formatBuiltAt(META.builtAt)}</dd>
          </div>
        </dl>
        <p style={{ marginTop: 12 }}>
          数据源是仓库里的 <span className="mono">data/entries/*.md</span>（YAML frontmatter + 可选正文），构建期校验并编译成静态
          bundle；无后端、无数据库，可部署到任意静态托管，也可本地 <span className="mono">npm run dev</span>。
          每日增量更新：抓取 → 起草（标 <span className="mono">needs_review</span>）→ 核验 → 入库 → 重建。
        </p>
      </section>

      <section className="about-section">
        <h2>影响力评分锚点（1–10）</h2>
        <table className="about-table">
          <thead>
            <tr>
              <th>分数</th>
              <th>含义</th>
              <th>锚点</th>
            </tr>
          </thead>
          <tbody>
            {IMPORTANCE_ANCHORS.map((anchor) => (
              <tr key={anchor.range[0]}>
                <td className="anchor-score" style={{ color: anchor.color }}>
                  {anchor.range[0] === anchor.range[1] ? anchor.range[0] : `${anchor.range[0]}–${anchor.range[1]}`}
                </td>
                <td>
                  {anchor.label}
                  <div style={{ color: 'var(--text-3)', fontSize: 12 }}>{anchor.meaning}</div>
                </td>
                <td>{anchor.anchors}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p style={{ marginTop: 12, color: 'var(--text-3)', fontSize: 12 }}>
          评分长期锚定、禁止通胀：校验脚本会对「10 分条目过多」「8–9 分占比超过 30%」发出告警。
        </p>
      </section>

      <section className="about-section">
        <h2>数据模型</h2>
        <table className="about-table">
          <thead>
            <tr>
              <th>字段</th>
              <th>必填</th>
              <th>说明</th>
            </tr>
          </thead>
          <tbody>
            {FIELDS.map(([field, required, note]) => (
              <tr key={field}>
                <td className="mono" style={{ color: 'var(--text)' }}>
                  {field}
                </td>
                <td>{required}</td>
                <td>{note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="about-section">
        <h2>数据质量红线</h2>
        <ul className="about-list">
          <li>不确定的事实、数字、日期 → 标 needs_review，并在详情页显示「待核对」角标。</li>
          <li>不确定的来源链接一律留空，禁止编造 URL。</li>
          <li>近 6 个月的事件如不确定，宁缺毋滥。</li>
          <li>关系图谱中的 relations 必须指向真实存在的条目，构建期强制校验。</li>
          <li>每日更新优先收录新思想/新动向，观点类条目必须有原文、说话人与场合。</li>
        </ul>
      </section>

      <section className="about-section">
        <h2>贡献方式</h2>
        <ul className="about-list">
          <li>
            新增：<span className="mono">npm run add-entry</span>（交互式生成符合 schema 的模板）或直接复制{' '}
            <span className="mono">data/entries/_template.md</span>。
          </li>
          <li>
            校验：<span className="mono">npm run validate</span> 检查 schema、id 唯一性、relations 指向、日期格式与评分通胀。
          </li>
          <li>
            构建：<span className="mono">npm run data:build</span> 重新编译数据 bundle；<span className="mono">npm run build</span>{' '}
            产出静态站点。
          </li>
          <li>写作用域：data/entries 只放条目；前端代码在 src/；脚本在 scripts/。</li>
        </ul>
      </section>

      <section className="about-section">
        <h2>技术栈</h2>
        <p>
          Vite + React + TypeScript 纯静态站点；时间轴主视图使用等宽年份列 + squarified treemap（d3-hierarchy 布局、手写
          SVG 渲染），关系图谱与年度下钻使用 ECharts（按需引入）；hash 路由与搜索均为零依赖实现，便于静态托管。
        </p>
      </section>

      <section className="about-section">
        <h2>免责声明</h2>
        <p>
          本站内容为个人知识整理，尽力核实但可能存在事实、日期或解读偏差；标有「待核对」的条目尤其如此。欢迎指出错误。
          本站不构成任何投资或决策建议。
        </p>
      </section>
    </div>
  );
}
