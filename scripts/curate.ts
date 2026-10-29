/**
 * 主线动态化 CLI：
 *   1) 候选晋升：importance ≥ 8、非主线、非待核对的事件 → 晋升主线（补到容量上限）
 *   2) 末位淘汰：主线超过容量上限时，按 importance 由低到高淘汰（10 分永不淘汰）
 *
 * 用法：
 *   npm run curate          # dry-run，只打印方案
 *   npm run curate:apply    # 实际写入 data/entries/*.md，并产出 docs/reviews/curation-YYYY-MM-DD.md
 */
import fs from 'node:fs';
import path from 'node:path';
import { planCuration } from '../src/lib/curation';
import type { Entry } from '../src/lib/types';
import { ENTRIES_DIR, ROOT, loadEntries } from './lib/load-entries';

const args = process.argv.slice(2);
const apply = args.includes('--apply');

function todayISO(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function setMainlineFlag(file: string, value: boolean): void {
  const abs = path.join(ENTRIES_DIR, file);
  let text = fs.readFileSync(abs, 'utf8');
  const line = `mainline: ${value}`;
  if (/^mainline:\s*(true|false)\s*$/m.test(text)) {
    text = text.replace(/^mainline:\s*(true|false)\s*$/m, line);
  } else {
    // 插在 needs_review 之前；没有该字段就插在 frontmatter 末尾
    if (/^needs_review:/m.test(text)) {
      text = text.replace(/^needs_review:/m, `${line}\nneeds_review:`);
    } else {
      const match = text.match(/^---\n([\s\S]*?)\n---\n/);
      if (!match) throw new Error(`无法解析 frontmatter：${file}`);
      text = text.replace(/^---\n([\s\S]*?)\n---\n/, `---\n$1\n${line}\n---\n`);
    }
  }
  fs.writeFileSync(abs, text, 'utf8');
}

function main(): void {
  const today = todayISO();
  const loaded = loadEntries();
  const entries = loaded
    .map((item) => item.entry)
    .filter((entry): entry is Entry => entry !== null);

  const plan = planCuration(entries, { today });
  const byId = new Map(loaded.map((item) => [item.entry?.id, item]));

  console.log('\n主线治理方案（今天 ' + today + '）');
  console.log('─'.repeat(56));
  console.log(`主线容量：${plan.mainlineBefore} / ${plan.cap}（晋升后 ${plan.mainlineAfter}）`);
  console.log(`候选池（≥8 分、非待核对）：${plan.pool.length} 条`);
  console.log(`可晋升：${plan.promote.length} 条${plan.promote.length > 0 ? '：' : ''}`);
  for (const entry of plan.promote) {
    console.log(`  ↑ ${entry.date} · ${entry.importance} 分 · ${entry.title}（${entry.id}）`);
  }
  console.log(`末位淘汰：${plan.demote.length} 条${plan.demote.length > 0 ? '：' : ''}`);
  for (const entry of plan.demote) {
    console.log(`  ↓ ${entry.date} · ${entry.importance} 分 · ${entry.title}（${entry.id}）`);
  }
  if (plan.promote.length === 0 && plan.demote.length === 0) {
    console.log('  （无需变更）');
  }

  if (!apply) {
    console.log('\n当前为 dry-run；确认后运行：npm run curate:apply\n');
    return;
  }

  for (const entry of plan.promote) {
    const item = byId.get(entry.id);
    if (item) setMainlineFlag(item.file, true);
  }
  for (const entry of plan.demote) {
    const item = byId.get(entry.id);
    if (item) setMainlineFlag(item.file, false);
  }

  const reportDir = path.join(ROOT, 'docs', 'reviews');
  fs.mkdirSync(reportDir, { recursive: true });
  const reportPath = path.join(reportDir, `curation-${today}.md`);
  const lines = [
    `# 主线治理记录 ${today}`,
    '',
    `- 主线容量：${plan.cap}`,
    `- 变更前主线：${plan.mainlineBefore} 条；变更后：${plan.mainlineAfter} 条`,
    `- 候选池：${plan.pool.length} 条`,
    '',
    '## 晋升主线',
    plan.promote.length === 0
      ? '- 无'
      : plan.promote
          .map((entry) => `- ${entry.date} · ${entry.importance} 分 · ${entry.title}（${entry.id}）`)
          .join('\n'),
    '',
    '## 末位淘汰',
    plan.demote.length === 0
      ? '- 无'
      : plan.demote
          .map((entry) => `- ${entry.date} · ${entry.importance} 分 · ${entry.title}（${entry.id}）`)
          .join('\n'),
    '',
  ];
  fs.writeFileSync(reportPath, lines.join('\n'), 'utf8');
  console.log(`\n✓ 已写入变更，报告：${path.relative(ROOT, reportPath)}`);
  console.log('下一步：npm run validate && npm run data:build && npm run build\n');
}

main();
