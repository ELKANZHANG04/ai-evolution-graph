/**
 * 构建后的静态 SEO 页面（dist/p/**）：让百度等不执行 JS 的搜索引擎也能读到内容。
 * 交互版仍是 SPA（#/ 路由），这些页面是"可被收录的内容页"，每页都有回到交互版的入口。
 *
 * 用法：tsx scripts/build-seo-pages.ts（在 vite build 之后执行）
 */
import fs from 'node:fs';
import path from 'node:path';
import { CATEGORY_META } from '../src/theme/categories';
import type { Category, Entry, Meta } from '../src/lib/types';

const ROOT = process.cwd();
const DIST = path.join(ROOT, 'dist');
const GENERATED = path.join(ROOT, 'src', 'generated');

interface SiteConfig {
  siteName: string;
  siteNameEn: string;
  siteUrl: string;
  description: string;
  locale: string;
  author: string;
}

interface ChapterData {
  id: string;
  title: string;
  en: string;
  dateStart: string;
  dateEnd: string;
  description: string;
  entries: string[];
}

interface ThoughtStepData {
  id: string;
  role: string;
  arrow: string;
}

interface ThoughtChainData {
  id: string;
  title: string;
  question: string;
  description: string;
  steps: ThoughtStepData[];
  context: string[];
}

const config: SiteConfig = JSON.parse(fs.readFileSync(path.join(ROOT, 'site.config.json'), 'utf8'));
const entries: Entry[] = JSON.parse(fs.readFileSync(path.join(GENERATED, 'entries.json'), 'utf8'));
const meta: Meta = JSON.parse(fs.readFileSync(path.join(GENERATED, 'meta.json'), 'utf8'));
const chapters: ChapterData[] = JSON.parse(fs.readFileSync(path.join(GENERATED, 'chapters.json'), 'utf8'));
const thoughts: ThoughtChainData[] = JSON.parse(fs.readFileSync(path.join(GENERATED, 'thoughts.json'), 'utf8'));

const byId = new Map(entries.map((entry) => [entry.id, entry]));
const siteUrl = (config.siteUrl || '').replace(/\/+$/, '');
/** 部署子路径（GitHub Pages: /ai-evolution-graph）；站内链接必须带这个前缀 */
const basePath = siteUrl ? new URL(siteUrl).pathname.replace(/\/+$/, '') : '';
const today = new Date().toISOString().slice(0, 10);

/** 站内链接：basePath + 路径 */
function link(pathname: string): string {
  return `${basePath}${pathname}`;
}

function esc(value: unknown): string {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

const TYPE_LABEL: Record<string, string> = { event: '突破事件', insight: '观点/思想', product: '产品发布' };
const ROLE_LABEL: Record<string, string> = {
  thesis: '命题',
  advance: '推进',
  revision: '修正',
  rebuttal: '反驳',
};

function categoryLabels(categories: Category[]): string {
  return categories.map((category) => CATEGORY_META[category]?.label ?? category).join(' / ');
}

function entryPath(entry: Entry): string {
  return `/p/entry/${entry.id}/`;
}

function entryHref(entry: Entry): string {
  return link(entryPath(entry));
}

function interactiveLink(entry: Entry): string {
  if (entry.mainline) return link(`/#/mainline?entry=${entry.id}`);
  if (entry.type === 'insight') return link(`/#/thoughts?entry=${entry.id}`);
  return link(`/#/feed?entry=${entry.id}`);
}

function layout(options: { title: string; description: string; canonicalPath: string; body: string; jsonLd?: string }): string {
  const canonical = siteUrl ? `${siteUrl}${options.canonicalPath}` : options.canonicalPath;
  const ogImage = siteUrl ? `${siteUrl}/og-image.png` : '/og-image.png';
  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="color-scheme" content="dark" />
<title>${esc(options.title)}</title>
<meta name="description" content="${esc(options.description)}" />
${siteUrl ? `<link rel="canonical" href="${esc(canonical)}" />` : ''}
<meta property="og:type" content="article" />
<meta property="og:site_name" content="${esc(config.siteName)}" />
<meta property="og:title" content="${esc(options.title)}" />
<meta property="og:description" content="${esc(options.description)}" />
<meta property="og:image" content="${esc(ogImage)}" />
<meta name="author" content="${esc(config.author)}" />
<style>
:root{color-scheme:dark}
*{box-sizing:border-box}
body{margin:0;background:#0b0e14;color:#e6eaf2;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif;line-height:1.75;font-size:15px}
a{color:#6ea8fe;text-decoration:none}
a:hover{text-decoration:underline}
.wrap{max-width:900px;margin:0 auto;padding:32px 20px 64px}
.crumb{font-size:12.5px;color:#6f7c90;margin-bottom:18px}
.crumb a{color:#a7b2c4}
h1{font-size:26px;line-height:1.35;margin:0 0 8px;letter-spacing:-.01em}
h2{font-size:18px;margin:30px 0 10px;border-left:3px solid #6ea8fe;padding-left:10px}
h3{font-size:15.5px;margin:20px 0 6px}
p{margin:8px 0}
.muted{color:#a7b2c4}
.small{font-size:12.5px;color:#6f7c90}
.badges{display:flex;flex-wrap:wrap;gap:6px;margin:10px 0}
.badge{font-size:11.5px;padding:2px 9px;border-radius:999px;border:1px solid #2c3646;color:#a7b2c4}
.badge.gold{border-color:rgba(245,197,66,.45);color:#f5c542}
.card{border:1px solid #1f2733;border-radius:12px;background:#121722;padding:16px 18px;margin:12px 0}
.card a.title{font-size:16px;font-weight:600;color:#e6eaf2}
ul{padding-left:20px;margin:8px 0}
li{margin:4px 0}
.cta{display:inline-block;margin-top:14px;padding:9px 16px;border-radius:9px;background:#6ea8fe;color:#061018;font-weight:600;font-size:14px}
.cta:hover{text-decoration:none;opacity:.9}
footer{margin-top:40px;padding-top:16px;border-top:1px solid #1f2733;font-size:12px;color:#6f7c90}
blockquote{margin:10px 0;padding:10px 14px;border-left:3px solid #f472b6;background:#161c28;border-radius:0 8px 8px 0;color:#e6eaf2;font-style:italic}
</style>
${options.jsonLd ? `<script type="application/ld+json">${options.jsonLd}</script>` : ''}
</head>
<body>
<div class="wrap">
<nav class="crumb"><a href="${link('/p/')}">${esc(config.siteName)} · 内容索引</a> / <a href="${link('/')}">交互版</a></nav>
${options.body}
<footer>
${esc(config.siteName)} · ${esc(config.description)}<br/>
数据更新：${esc(meta.builtAt.slice(0, 10))} · 共 ${meta.count} 条 · <a href="${link('/sitemap.xml')}">sitemap</a> · <a href="${link('/')}">打开交互版</a>
</footer>
</div>
</body>
</html>
`;
}

function writePage(routePath: string, html: string): void {
  const dir = routePath === '/p/' ? path.join(DIST, 'p') : path.join(DIST, 'p', routePath.replace(/^\/p\//, '').replace(/\/$/, ''));
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html, 'utf8');
}

function relatedBlock(entry: Entry): string {
  const outgoing = entry.relations
    .map((relation) => ({ relation, target: byId.get(relation.to) }))
    .filter((item): item is { relation: typeof item.relation; target: Entry } => item.target !== undefined);
  const incoming = entries.filter((candidate) => candidate.relations.some((relation) => relation.to === entry.id));
  if (outgoing.length === 0 && incoming.length === 0) return '';
  const items = [
    ...outgoing.map(
      ({ relation, target }) =>
        `<li>${esc(relation.type)} · <a href="${entryHref(target)}">${esc(target.title)}</a></li>`,
    ),
    ...incoming.map(
      (candidate) =>
        `<li><a href="${entryHref(candidate)}">${esc(candidate.title)}</a> · ${esc(candidate.relations.find((relation) => relation.to === entry.id)?.type ?? '')}本条</li>`,
    ),
  ];
  return `<h2>关联条目</h2><ul>${items.join('')}</ul>`;
}

function entryPage(entry: Entry): void {
  const description = entry.summary.slice(0, 160);
  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: entry.title,
    description,
    datePublished: entry.date,
    dateModified: entry.added_at ?? entry.date,
    author: { '@type': 'Person', name: config.author },
    isPartOf: siteUrl ? { '@type': 'WebSite', name: config.siteName, url: `${siteUrl}/` } : undefined,
    inLanguage: 'zh-CN',
  });
  const body = `
<h1>${esc(entry.title)}</h1>
<p class="muted">${esc(entry.title_en)}</p>
<div class="badges">
  <span class="badge">${esc(TYPE_LABEL[entry.type] ?? entry.type)}</span>
  <span class="badge">${esc(entry.date)}</span>
  <span class="badge ${entry.importance >= 9 ? 'gold' : ''}">影响力 ${entry.importance}/10</span>
  <span class="badge">${esc(categoryLabels(entry.categories))}</span>
  ${entry.needs_review ? '<span class="badge">待核对</span>' : ''}
  ${entry.innovation ? '<span class="badge">创新雷达</span>' : ''}
</div>
<p>${esc(entry.summary)}</p>
<h2>为什么重要</h2>
<p>${esc(entry.significance)}</p>
${entry.quote ? `<h2>原文</h2><blockquote>“${esc(entry.quote)}”</blockquote><p class="small">${esc(entry.speaker ?? '')} · ${esc(entry.occasion ?? '')}</p>` : ''}
${entry.body ? `<h2>延伸解读</h2><p>${esc(entry.body.replace(/[#*>_`-]/g, '').replace(/\n{2,}/g, '\n').slice(0, 1200))}</p>` : ''}
${entry.sources.length > 0 ? `<h2>来源</h2><ul>${entry.sources.map((source) => `<li><a href="${esc(source)}" rel="nofollow noopener" target="_blank">${esc(source)}</a></li>`).join('')}</ul>` : ''}
${relatedBlock(entry)}
<a class="cta" href="${interactiveLink(entry)}">在交互图谱中查看 →</a>
`;
  writePage(entryPath(entry), layout({ title: `${entry.title} · ${config.siteName}`, description, canonicalPath: entryPath(entry), body, jsonLd }));
}

function homePage(): void {
  const recent = [...entries].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 20);
  const body = `
<h1>${esc(config.siteName)} <span class="small">${esc(config.siteNameEn)}</span></h1>
<p>${esc(config.description)}</p>
<p class="small">数据更新于 ${esc(meta.builtAt.slice(0, 10))} · ${meta.count} 条条目 · ${meta.needsReview} 条待核对</p>
<h2>内容入口</h2>
<ul>
  <li><a href="${link('/p/mainline/')}">演进主线</a>：${chapters.length} 个阶段、${meta.count} 条中的精选举措</li>
  <li><a href="${link('/p/thoughts/')}">思想看板</a>：${thoughts.length} 个主题的观点演进</li>
  <li><a href="${link('/p/feed/')}">最新动态</a>：最近 5 天新入库的事件与思想</li>
  <li><a href="${link('/p/about/')}">关于与评分标准</a></li>
</ul>
<h2>最近条目</h2>
${recent.map((entry) => `<div class="card"><a class="title" href="${entryHref(entry)}">${esc(entry.title)}</a><p class="small">${esc(entry.date)} · ${esc(categoryLabels(entry.categories))}</p><p>${esc(entry.summary.slice(0, 120))}</p></div>`).join('\n')}
<a class="cta" href="${link('/')}">打开交互版 →</a>
`;
  writePage('/p/', layout({ title: `${config.siteName} · 内容索引`, description: config.description, canonicalPath: '/p/', body }));
}

function mainlinePage(): void {
  const body = `
<h1>AI 演进主线</h1>
<p>${chapters.length} 个阶段、${chapters.reduce((sum, chapter) => sum + chapter.entries.length, 0)} 个里程碑；完整 ${meta.count} 条数据在交互版中。</p>
${chapters
  .map(
    (chapter) => `<h2>${esc(chapter.title)} · ${esc(chapter.dateStart.slice(0, 4))}–${esc(chapter.dateEnd.slice(0, 4))}</h2>
<p class="muted">${esc(chapter.description)}</p>
${chapter.entries
  .map((id) => byId.get(id))
  .filter((entry): entry is Entry => entry !== undefined)
  .map(
    (entry) => `<div class="card"><a class="title" href="${entryHref(entry)}">${esc(entry.title)}</a><p class="small">${esc(entry.date)} · 影响力 ${entry.importance}/10</p><p>${esc(entry.significance)}</p></div>`,
  )
  .join('\n')}`,
  )
  .join('\n')}
<a class="cta" href="${link('/#/mainline')}">打开交互版主线 →</a>
`;
  writePage('/p/mainline/', layout({ title: `AI 演进主线 · ${config.siteName}`, description: 'AI 演进主线的 5 个阶段与里程碑。', canonicalPath: '/p/mainline/', body }));
}

function thoughtsPage(): void {
  const cutoff18 = new Date(Date.now() - 548 * 24 * 3600 * 1000).toISOString().slice(0, 10);
  const cutoff30 = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString().slice(0, 10);
  const sections = thoughts.map((chain) => {
    const steps = chain.steps.map((step) => byId.get(step.id)).filter((entry): entry is Entry => entry !== undefined);
    const latest = steps.map((entry) => entry.date).sort((a, b) => a.localeCompare(b)).at(-1) ?? '—';
    const recent = steps.filter((entry) => entry.date >= cutoff18).length;
    const directions = steps
      .filter((entry) => entry.thought_pin === 'top')
      .map((entry) => (entry.thought_claim ?? entry.title).slice(0, 24));
    const cards = chain.steps
      .map((step) => {
        const entry = byId.get(step.id);
        if (!entry) return '';
        return `<div class="card"><p class="small">${esc(entry.date)} · ${esc(TYPE_LABEL[entry.type] ?? entry.type)} · 影响力 ${entry.importance}/10</p><a class="title" href="${entryHref(entry)}">${esc(entry.thought_claim ?? entry.title)}</a><p>${esc(entry.thought_summary ?? entry.summary)}</p>${entry.quote ? `<blockquote>“${esc(entry.quote)}”</blockquote><p class="small">${esc(entry.speaker ?? '')} · ${esc(entry.occasion ?? '')}</p>` : ''}</div>`;
      })
      .join('\n');
    return `<h2>${esc(chain.title)}</h2>
<p class="muted">${esc(chain.question)}</p>
<p class="small">${esc(chain.description)}</p>
<p class="small">${steps.length} 步 · 最新 ${esc(latest.slice(0, 7))} · 近 18 个月 ${recent} 条${directions.length > 0 ? ` · 新方向：${esc(directions.join(' / '))}` : ''}</p>
${cards}`;
  });
  const body = `
<h1>思想看板</h1>
<p>${thoughts.length} 个主题：每条链从命题出发，经过推进、修正或反驳；主题持续被讨论才有价值。每个主题内按时间倒序（最新在前），标注方式与主线一致：日期 / 类型 / 贡献度（影响力分数）。</p>
${sections.join('\n')}
<a class="cta" href="${link('/#/thoughts')}">打开交互版思想看板 →</a>
`;
  writePage('/p/thoughts/', layout({ title: `思想看板 · ${config.siteName}`, description: 'AI 思想与观点的递进、修正与反驳。', canonicalPath: '/p/thoughts/', body }));
}

function feedPage(): void {
  const cutoff = new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString().slice(0, 10);
  const freshCutoff = new Date(Date.now() - 180 * 24 * 3600 * 1000).toISOString().slice(0, 10);
  const recent = entries
    .filter((entry) => entry.added_at && entry.added_at >= cutoff && entry.date >= freshCutoff)
    .sort((a, b) => b.date.localeCompare(a.date) || b.importance - a.importance);
  const body = `
<h1>最新动态</h1>
<p>模型发布、事件与思想统一成一条「最近入库」流：只收最近 5 天入库、且事件发生在近半年内的内容，按时间倒序，每条标出贡献度（静态快照，每日 08:30 更新）。</p>
<h2>最近入库 <span class="small">${recent.length}</span></h2>
${
  recent.length === 0
    ? '<p class="muted">最近 5 天暂无近半年的新入库。</p>'
    : recent
        .map(
          (entry) => `<div class="card"><p class="small">${esc(entry.date)} · 入库 ${esc(entry.added_at ?? '')} · ${esc(TYPE_LABEL[entry.type] ?? entry.type)} · 影响力 ${entry.importance}/10</p><a class="title" href="${entryHref(entry)}">${esc(entry.title)}</a><p>${esc(entry.summary)}</p></div>`,
        )
        .join('\n')
}
<p class="small">最近一次数据更新：${esc(meta.latestDate)}</p>
<a class="cta" href="${link('/#/feed')}">打开交互版动态 →</a>
`;
  writePage('/p/feed/', layout({ title: `最新动态 · ${config.siteName}`, description: '最近 5 天新入库、事件发生在近半年内的 AI 事件与思想。', canonicalPath: '/p/feed/', body }));
}

function aboutPage(): void {
  const body = `
<h1>关于「${esc(config.siteName)}」</h1>
<p>面向「想看懂 AI 世界的人」的静态知识面板：用块面积 = 影响力感知 AI 发展的节奏与重心；主线只讲里程碑，思想看板解释观点的递进与推翻，最新动态持续更新。</p>
<h2>影响力评分锚点（1–10）</h2>
<ul>
  <li><strong>10 分</strong>：开启范式/时代（AlexNet / Transformer / ChatGPT）</li>
  <li><strong>8–9 分</strong>：里程碑突破（GPT-3、AlphaFold2、GPT-4、o1、DeepSeek-R1、Stable Diffusion、Scaling Laws）</li>
  <li><strong>6–7 分</strong>：重要进展（新 SOTA、重要开源、显著能力跃升、现象级产品）</li>
  <li><strong>4–5 分</strong>：值得注意（有代表性的产品/方法/趋势信号）</li>
  <li><strong>1–3 分</strong>：小启发（有意思的演示、值得记住的观点）</li>
</ul>
<h2>数据与质量</h2>
<p>数据源为仓库里的 Markdown（YAML frontmatter + 正文），构建期校验并编译为静态数据；不确定的事实/日期/来源会标注「待核对」，不编造来源。每日 08:30 增量更新，重要事件按规则晋升主线、主线满额后末位淘汰。</p>
<p class="small">数据更新：${esc(meta.builtAt.slice(0, 10))} · 共 ${meta.count} 条 · 待核对 ${meta.needsReview} 条</p>
<a class="cta" href="${link('/')}">打开交互版 →</a>
`;
  writePage('/p/about/', layout({ title: `关于 · ${config.siteName}`, description: 'AI 演进图谱的数据模型、评分标准与更新机制。', canonicalPath: '/p/about/', body }));
}

function main(): void {
  if (!fs.existsSync(DIST)) {
    console.warn('[seo-pages] dist/ 不存在，请先 vite build');
    return;
  }
  homePage();
  mainlinePage();
  thoughtsPage();
  feedPage();
  aboutPage();
  for (const entry of entries) entryPage(entry);
  // 防回归：检查页面站内链接是否带上了部署子路径（GitHub Pages /repo/）
  const sample = path.join(DIST, 'p', 'entry', entries[0].id, 'index.html');
  const html = fs.readFileSync(sample, 'utf8');
  if (basePath) {
    const bad = html.match(/(?:href|src)="\/(?!ai-evolution-graph\b)[^"]*"/);
    if (bad) {
      throw new Error(`[seo-pages] 站内链接缺少部署前缀 ${basePath}：${bad[0]}`);
    }
  }
  console.log(`[seo-pages] 已生成静态内容页：${entries.length + 5} 个（/p/**）`);
  console.log(`[seo-pages] 链接前缀：${basePath || '(根路径)'}`);
  console.log(`[seo-pages] 生成日期：${today}`);
}

main();
