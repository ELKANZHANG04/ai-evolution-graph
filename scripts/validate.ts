import { CATEGORY_META, CATEGORY_ORDER } from '../src/theme/categories';
import { ENTRY_TYPES, type Category, type EntryType } from '../src/lib/types';
import { crossCheck, loadEntries } from './lib/load-entries';

const args = process.argv.slice(2);
const strict = args.includes('--strict');
const showStats = args.includes('--stats') || !strict;

const loaded = loadEntries();
const issues = crossCheck(loaded);

const errors = [
  ...loaded.flatMap((item) => item.errors.map((message) => `${item.file}：${message}`)),
  ...issues.errors,
];
const warnings = [
  ...loaded.flatMap((item) => item.warnings.map((message) => `${item.file}：${message}`)),
  ...issues.warnings,
];
const entries = loaded.map((item) => item.entry).filter((entry) => entry !== null);

const line = '─'.repeat(64);

console.log(line);
console.log(`数据校验：${loaded.length} 个文件 | ${entries.length} 条有效条目`);
console.log(line);

if (errors.length > 0) {
  console.log(`\n✗ 错误 ${errors.length}：`);
  for (const error of errors) console.log(`  · ${error}`);
} else {
  console.log('\n✓ 结构校验通过（0 error）');
}

if (warnings.length > 0) {
  console.log(`\n⚠ 警告 ${warnings.length}：`);
  for (const warning of warnings) console.log(`  · ${warning}`);
} else {
  console.log('✓ 没有警告');
}

if (showStats && entries.length > 0) {
  const byYear = new Map<string, number>();
  const byCategory = new Map<Category, number>();
  const byType = new Map<EntryType, number>();
  const byScore = new Map<number, number>();
  const needsReview: string[] = [];
  let withSources = 0;

  for (const entry of entries) {
    const year = entry.date.slice(0, 4);
    byYear.set(year, (byYear.get(year) ?? 0) + 1);
    for (const category of entry.categories) byCategory.set(category, (byCategory.get(category) ?? 0) + 1);
    byType.set(entry.type, (byType.get(entry.type) ?? 0) + 1);
    byScore.set(entry.importance, (byScore.get(entry.importance) ?? 0) + 1);
    if (entry.needs_review) needsReview.push(`${entry.id}（${entry.date}）`);
    if (entry.sources.length > 0) withSources += 1;
  }

  console.log(`\n${line}\n统计\n${line}`);
  console.log(`年份分布：${[...byYear.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([y, n]) => `${y}:${n}`).join('  ')}`);
  console.log(
    `类别分布：${CATEGORY_ORDER.map((category) => `${CATEGORY_META[category].label}:${byCategory.get(category) ?? 0}`).join('  ')}`,
  );
  console.log(`类型分布：${ENTRY_TYPES.map((type) => `${type}:${byType.get(type) ?? 0}`).join('  ')}`);
  console.log(
    `评分分布：${[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((score) => `${score}分:${byScore.get(score) ?? 0}`).filter((item) => !item.endsWith(':0')).join('  ')}`,
  );
  console.log(`来源覆盖：${withSources}/${entries.length}（${Math.round((100 * withSources) / entries.length)}%）`);
  console.log(`待核对（needs_review）：${needsReview.length === 0 ? '无' : needsReview.join('、')}`);

  const post2012 = entries.filter((entry) => entry.date >= '2012-01-01').length;
  const foundation = entries.filter((entry) => entry.date < '2012-01-01').length;
  console.log(`2012 至今条目：${post2012}（目标 80–120） | 奠基条目：${foundation}（目标 8–10，简述）`);
}

console.log(`\n${line}`);
if (errors.length > 0 || (strict && warnings.length > 0)) {
  console.log(`✗ 校验未通过（${errors.length} error / ${warnings.length} warning${strict ? '，strict 模式 warning 也视为失败' : ''}）`);
  process.exit(1);
}
console.log('✓ 校验通过');
