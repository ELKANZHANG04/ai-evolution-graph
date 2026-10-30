import fs from 'node:fs';
import path from 'node:path';
import { nodeKindOf } from '../src/theme/categories';
import { MAINLINE_CHAPTERS } from '../src/lib/mainline';
import { buildThoughtChains } from '../src/lib/thoughtChains';
import type { Category, Entry, GraphData, Meta } from '../src/lib/types';
import { RELATION_META } from '../src/theme/relations';
import { crossCheck, ENTRIES_DIR, loadEntries, ROOT } from './lib/load-entries';

const GENERATED_DIR = path.join(ROOT, 'src', 'generated');

function writeJson(file: string, value: unknown): void {
  fs.writeFileSync(path.join(GENERATED_DIR, file), `${JSON.stringify(value)}\n`);
}

function main(): void {
  const loaded = loadEntries();
  const issues = crossCheck(loaded);

  const missingDir = !fs.existsSync(ENTRIES_DIR);
  const errors = [...loaded.flatMap((item) => item.errors.map((message) => `${item.file}：${message}`)), ...issues.errors];
  const warnings = [...loaded.flatMap((item) => item.warnings.map((message) => `${item.file}：${message}`)), ...issues.warnings];

  if (errors.length > 0) {
    console.error(`\n✗ 数据构建失败：${errors.length} 个错误\n`);
    for (const error of errors) console.error(`  · ${error}`);
    console.error('\n先运行 `npm run validate` 查看全部问题。\n');
    process.exit(1);
  }

  const entries = loaded
    .map((item) => item.entry)
    .filter((entry): entry is Entry => entry !== null)
    .sort((a, b) => a.date.localeCompare(b.date) || b.importance - a.importance);

  if (entries.length === 0 && !missingDir) {
    console.warn('⚠ 没有可构建的条目（data/entries 为空）');
  }

  fs.mkdirSync(GENERATED_DIR, { recursive: true });

  const byYear: Record<string, number> = {};
  const byCategory: Record<string, number> = {};
  const byType: Record<string, number> = {};
  const importanceDistribution: Record<string, number> = {};
  let needsReview = 0;
  let withSources = 0;

  for (const entry of entries) {
    const year = entry.date.slice(0, 4);
    byYear[year] = (byYear[year] ?? 0) + 1;
    for (const category of entry.categories) {
      byCategory[category] = (byCategory[category] ?? 0) + 1;
    }
    byType[entry.type] = (byType[entry.type] ?? 0) + 1;
    const bucket = String(entry.importance);
    importanceDistribution[bucket] = (importanceDistribution[bucket] ?? 0) + 1;
    if (entry.needs_review) needsReview += 1;
    if (entry.sources.length > 0) withSources += 1;
  }

  const meta: Meta = {
    builtAt: new Date().toISOString(),
    count: entries.length,
    firstDate: entries[0]?.date ?? '',
    latestDate: entries.at(-1)?.date ?? '',
    byYear,
    byCategory,
    byType,
    importanceDistribution,
    needsReview,
    withSources,
  };

  const graph: GraphData = {
    nodes: entries.map((entry) => ({
      id: entry.id,
      title: entry.title,
      date: entry.date,
      year: Number(entry.date.slice(0, 4)),
      importance: entry.importance,
      categories: entry.categories as Category[],
      type: entry.type,
      nodeKind: nodeKindOf(entry),
    })),
    // 边方向归一化为「上游 → 下游」，供影响图谱直接使用（docs/DECISIONS.md §10.3）
    edges: entries.flatMap((entry) =>
      entry.relations.map((relation) => {
        const meta = RELATION_META[relation.type];
        const isBackward = meta.direction === 'backward';
        return {
          source: isBackward ? relation.to : entry.id,
          target: isBackward ? entry.id : relation.to,
          type: relation.type,
          direction: meta.direction,
          bidirectional: meta.bidirectional ?? false,
        };
      }),
    ),
  };

  writeJson('entries.json', entries);
  writeJson('meta.json', meta);
  writeJson('graph.json', graph);

  // 供静态 SEO 页面生成（scripts/build-seo-pages.mjs）使用
  const chapters = MAINLINE_CHAPTERS.map((chapter) => ({
    ...chapter,
    entries: entries
      .filter(
        (entry) =>
          entry.mainline &&
          entry.date >= chapter.dateStart &&
          entry.date <= chapter.dateEnd,
      )
      .map((entry) => entry.id),
  }));
  writeJson('chapters.json', chapters);

  const thoughts = buildThoughtChains(entries).map((chain) => ({
    id: chain.id,
    title: chain.title,
    question: chain.question,
    description: chain.description,
    steps: chain.steps.map((step) => ({ id: step.entry.id, role: step.role, arrow: step.arrow })),
    context: chain.context.map((entry) => entry.id),
  }));
  writeJson('thoughts.json', thoughts);

  const first = entries[0];
  const last = entries.at(-1);
  console.log(
    [
      `✓ 数据构建完成：${entries.length} 条`,
      first && last ? `${first.date} → ${last.date}` : '（空库）',
      `needs_review ${needsReview}`,
      `有来源 ${withSources}/${entries.length}`,
      `警告 ${warnings.length}`,
    ].join(' | '),
  );
  if (warnings.length > 0) {
    for (const warning of warnings) console.log(`  ⚠ ${warning}`);
  }
  console.log(`  输出：src/generated/{entries,meta,graph}.json`);
}

main();
