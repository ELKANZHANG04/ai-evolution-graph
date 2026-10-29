import fs from 'node:fs';
import path from 'node:path';
import { createInterface } from 'node:readline/promises';
import { CATEGORY_ORDER } from '../src/theme/categories';
import { CATEGORY_META } from '../src/theme/categories';
import { ENTRIES_DIR } from './lib/load-entries';

const rl = createInterface({ input: process.stdin, output: process.stdout });

function ask(question: string, defaultValue = ''): Promise<string> {
  const suffix = defaultValue ? ` [${defaultValue}]` : '';
  return rl.question(`${question}${suffix}: `).then((answer) => answer.trim() || defaultValue);
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

function toFlowList(items: string[]): string {
  return `[${items.map((item) => JSON.stringify(item)).join(', ')}]`;
}

function todayISO(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

async function main(): Promise<void> {
  console.log('\n新建条目（Ctrl+C 取消）\n');

  const title = await ask('中文标题（必填）');
  if (!title) throw new Error('标题不能为空');
  let titleEn = await ask('英文标题（必填，用于生成 id）');
  if (!titleEn) throw new Error('英文标题不能为空');

  const defaultId = slugify(titleEn);
  const id = (await ask('id（kebab-case）', defaultId)).toLowerCase();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) throw new Error('id 不符合 kebab-case');
  const target = path.join(ENTRIES_DIR, `${id}.md`);
  if (fs.existsSync(target)) throw new Error(`已存在同名条目：${target}`);

  const typeRaw = await ask('type（event / insight / product）', 'event');
  if (!['event', 'insight', 'product'].includes(typeRaw)) throw new Error('type 不合法');

  const date = await ask('日期 YYYY-MM-DD', todayISO());
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('日期格式不合法');

  const importanceRaw = await ask('影响力 1–10', '5');
  const importance = Number(importanceRaw);
  if (!Number.isInteger(importance) || importance < 1 || importance > 10) throw new Error('影响力必须是 1–10 整数');

  console.log('类别可选：', CATEGORY_ORDER.map((c) => `${c}（${CATEGORY_META[c].label}）`).join('、'));
  const categoriesRaw = await ask('类别，逗号分隔（第一个为主类别）', 'model');
  const categories = categoriesRaw
    .split(/[,，]/)
    .map((c) => c.trim())
    .filter(Boolean);
  if (categories.length === 0) throw new Error('至少一个类别');
  for (const category of categories) {
    if (!CATEGORY_ORDER.includes(category as (typeof CATEGORY_ORDER)[number])) {
      throw new Error(`未知类别：${category}`);
    }
  }

  const summary = await ask('一句话摘要（两句话以内）');
  const significance = await ask('为什么重要（2–3 句）');
  const tagsRaw = await ask('标签，逗号分隔', '');
  const tags = tagsRaw
    .split(/[,，]/)
    .map((tag) => tag.trim())
    .filter(Boolean);
  const sourcesRaw = await ask('来源 URL，逗号分隔（不确定就留空）', '');
  const sources = sourcesRaw
    .split(/[,，\s]+/)
    .map((url) => url.trim())
    .filter(Boolean);
  for (const url of sources) {
    if (!/^https?:\/\//.test(url)) throw new Error(`来源必须是 http(s) URL：${url}`);
  }
  const needsReviewRaw = await ask('事实/日期/来源不确定？标 needs_review（y/N）', 'n');
  const needsReview = needsReviewRaw.toLowerCase().startsWith('y');

  let quote = '';
  let speaker = '';
  let occasion = '';
  let body = '';
  if (typeRaw === 'insight') {
    quote = await ask('观点原文（必填）');
    speaker = await ask('谁说的（必填）');
    occasion = await ask('场合（会议/推文/访谈，必填）');
    console.log('提示：正文（深度解读）稍后手动补充到 frontmatter 之后的 Markdown 区域。');
    body = '## 背景\n\n（待补充）\n\n## 核心观点\n\n（待补充）\n\n## 为什么今天还要读\n\n（待补充）\n';
  }

  const addedAt = todayISO();
  const content = `---
id: ${id}
type: ${typeRaw}
title: ${JSON.stringify(title)}
title_en: ${JSON.stringify(titleEn)}
date: ${date}
importance: ${importance}
categories: ${toFlowList(categories)}
summary: ${JSON.stringify(summary)}
significance: ${JSON.stringify(significance)}
quote: ${JSON.stringify(quote)}
speaker: ${JSON.stringify(speaker)}
occasion: ${JSON.stringify(occasion)}
my_comment: ""
tags: ${toFlowList(tags)}
sources: ${toFlowList(sources)}
relations: []
needs_review: ${needsReview}
node_kind: ${typeRaw === 'insight' ? 'concept' : 'model'}
added_at: ${addedAt}
---

${body}
`;

  fs.mkdirSync(ENTRIES_DIR, { recursive: true });
  fs.writeFileSync(target, content, 'utf8');

  console.log(`\n✓ 已创建：${path.relative(process.cwd(), target)}`);
  console.log('下一步：');
  console.log('  1) 用编辑器补全正文/relations（可选）');
  console.log('  2) npm run validate');
  console.log('  3) npm run data:build && npm run dev\n');
}

main()
  .catch((error: unknown) => {
    console.error(`\n✗ ${(error as Error).message}\n`);
    process.exitCode = 1;
  })
  .finally(() => rl.close());
