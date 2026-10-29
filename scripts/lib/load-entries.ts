import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { entryFrontmatterSchema } from '../../src/lib/schema';
import type { Category, Entry, NodeKind, Relation, RelationType } from '../../src/lib/types';

export const ROOT = process.cwd();
export const ENTRIES_DIR = path.join(ROOT, 'data', 'entries');

export interface LoadedEntry {
  file: string;
  id?: string;
  entry: Entry | null;
  errors: string[];
  warnings: string[];
}

function normalizeDate(value: unknown): string {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === 'string') return value.trim();
  return String(value ?? '');
}

function parseEntryFile(absPath: string, file: string): LoadedEntry {
  const errors: string[] = [];
  const warnings: string[] = [];

  let parsed: matter.GrayMatterFile<string>;
  try {
    parsed = matter(fs.readFileSync(absPath, 'utf8'));
  } catch (error) {
    return { file, entry: null, errors: [`YAML 解析失败：${(error as Error).message}`], warnings };
  }

  const raw = parsed.data as Record<string, unknown>;
  const normalized = {
    ...raw,
    date: normalizeDate(raw.date),
    added_at: raw.added_at ? normalizeDate(raw.added_at) : undefined,
  };

  const result = entryFrontmatterSchema.safeParse(normalized);
  if (!result.success) {
    for (const issue of result.error.issues) {
      errors.push(`${issue.path.join('.') || 'frontmatter'}：${issue.message}`);
    }
    return { file, entry: null, errors, warnings };
  }

  const fm = result.data;

  // 跨字段规则（结构性之外）
  if (fm.type === 'insight') {
    if (!fm.quote) errors.push('insight 必须提供 quote（观点原文）');
    if (!fm.speaker) errors.push('insight 必须提供 speaker（谁说的）');
    if (!fm.occasion) errors.push('insight 必须提供 occasion（场合）');
  }
  if (fm.date > new Date().toISOString().slice(0, 10)) {
    warnings.push(`日期 ${fm.date} 晚于今天`);
  }
  if (fm.sources.length === 0 && !fm.needs_review) {
    warnings.push('没有来源链接但未标记 needs_review');
  }
  if (parsed.content.trim() === '' && fm.type === 'insight') {
    errors.push('insight 必须有正文深度解读（--- 之后的 Markdown）');
  }

  const body = parsed.content.trim();
  const entry: Entry = {
    id: fm.id,
    type: fm.type,
    title: fm.title,
    title_en: fm.title_en,
    date: fm.date,
    importance: fm.importance,
    categories: fm.categories as Category[],
    summary: fm.summary,
    significance: fm.significance,
    quote: fm.quote,
    speaker: fm.speaker,
    occasion: fm.occasion,
    my_comment: fm.my_comment,
    tags: fm.tags,
    sources: fm.sources,
    relations: fm.relations as Relation[],
    needs_review: fm.needs_review,
    node_kind: fm.node_kind as NodeKind | undefined,
    added_at: fm.added_at,
    mainline: fm.mainline ?? false,
    thought_chain: fm.thought_chain,
    thought_role: fm.thought_role,
    body: body || undefined,
  };

  const expectedFile = `${fm.id}.md`;
  if (file !== expectedFile) {
    warnings.push(`文件名 ${file} 与 id 不一致（应为 ${expectedFile}）`);
  }

  return { file, id: fm.id, entry, errors, warnings };
}

export function loadEntries(): LoadedEntry[] {
  if (!fs.existsSync(ENTRIES_DIR)) return [];
  return fs
    .readdirSync(ENTRIES_DIR)
    .filter((file) => file.endsWith('.md') && !file.startsWith('_'))
    .sort()
    .map((file) => parseEntryFile(path.join(ENTRIES_DIR, file), file));
}

export interface CrossCheckResult {
  errors: string[];
  warnings: string[];
}

/** 全库一致性检查：id 唯一、relations 指向存在、评分通胀等 */
export function crossCheck(loaded: LoadedEntry[]): CrossCheckResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const entries = loaded.filter((item): item is LoadedEntry & { entry: Entry } => item.entry !== null);

  const ids = new Map<string, string>();
  const titles = new Map<string, string>();
  for (const { entry, file } of entries) {
    const prev = ids.get(entry.id);
    if (prev) errors.push(`id 重复：${entry.id}（${prev} 与 ${file}）`);
    ids.set(entry.id, file);

    const prevTitle = titles.get(entry.title);
    if (prevTitle) warnings.push(`标题重复：${entry.title}（${prevTitle} 与 ${file}）`);
    titles.set(entry.title, file);
  }

  for (const { entry, file } of entries) {
    for (const relation of entry.relations) {
      if (!ids.has(relation.to)) {
        errors.push(`${file}：relations 指向不存在的条目 "${relation.to}"`);
      }
      if (relation.to === entry.id) {
        errors.push(`${file}：relations 不能指向自己`);
      }
    }
    if (entry.importance === 10 && entry.type === 'insight') {
      warnings.push(`${file}：insight 拿到 10 分，请确认是否符合锚点（10 分应为范式级事件）`);
    }
  }

  // 关系类型枚举外的值由 zod 拦住；重复边给出提示
  for (const { entry, file } of entries) {
    const seen = new Set<string>();
    for (const relation of entry.relations) {
      const key = `${relation.type}->${relation.to}`;
      if (seen.has(key)) warnings.push(`${file}：重复的关系 ${key}`);
      seen.add(key);
    }
  }

  // 评分通胀检查
  const scores = entries.map(({ entry }) => entry.importance);
  const top = scores.filter((score) => score === 10).length;
  const high = scores.filter((score) => score >= 8 && score <= 9).length;
  if (top > 5) warnings.push(`10 分条目 ${top} 条，超过建议上限 5 条（锚点：仅 AlexNet/Transformer/ChatGPT 级）`);
  if (scores.length > 0 && high / scores.length > 0.3) {
    warnings.push(`8-9 分条目占比 ${(100 * (high / scores.length)).toFixed(0)}%，超过 30% 警示线（评分通胀）`);
  }

  return { errors, warnings };
}

export function summarizeTypes(): Record<string, string> {
  return { event: '突破事件', insight: '观点/思想', product: '产品发布' } as Record<string, string>;
}

export function relationLabel(type: RelationType): string {
  return type;
}
