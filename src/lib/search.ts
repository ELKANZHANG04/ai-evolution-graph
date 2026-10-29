import type { Category, Entry, EntryType } from './types';

/**
 * 全局搜索（纯函数，客户端内存实现；119 条量级 <5ms）。
 * 加权字段：标题 > 标签 > 摘要 > 意义 > 引用 > 说话人/场合 > 正文。
 * 多关键词按 AND 语义（每个词都要命中）；中文按子串匹配，英文大小写不敏感。
 */
export interface SearchFilters {
  q: string;
  categories?: Category[];
  types?: EntryType[];
  yearFrom?: number;
  yearTo?: number;
  impMin?: number;
  impMax?: number;
}

export interface SearchHit {
  entry: Entry;
  score: number;
  /** 高亮片段：已做 HTML 转义，命中词用 <mark> 包裹 */
  snippet: string;
  matchedFields: string[];
}

const FIELD_WEIGHTS: Array<{ field: keyof Entry; weight: number; label: string }> = [
  { field: 'title', weight: 9, label: '标题' },
  { field: 'title_en', weight: 7, label: '英文标题' },
  { field: 'tags', weight: 6, label: '标签' },
  { field: 'summary', weight: 5, label: '摘要' },
  { field: 'significance', weight: 3, label: '意义' },
  { field: 'quote', weight: 3, label: '原文' },
  { field: 'thought_claim', weight: 3, label: '思想主张' },
  { field: 'speaker', weight: 2, label: '人物' },
  { field: 'occasion', weight: 2, label: '场合' },
  { field: 'body', weight: 1, label: '正文' },
  { field: 'my_comment', weight: 1, label: '短评' },
];

function fieldText(entry: Entry, field: keyof Entry): string {
  const value = entry[field];
  if (value === undefined || value === null) return '';
  if (Array.isArray(value)) return value.join(' ');
  return String(value);
}

function normalize(text: string): string {
  return text.toLowerCase();
}

export function tokenizeQuery(query: string): string[] {
  return query
    .trim()
    .split(/[\s,，、;；]+/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0 && item.length < 40)
    .slice(0, 8);
}

export function escapeHtml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

/** 在已转义文本上高亮关键词（大小写不敏感，保留原顺序） */
export function highlight(text: string, terms: string[]): string {
  const escaped = escapeHtml(text);
  if (terms.length === 0) return escaped;
  const unique = [...new Set(terms.map((term) => term.trim()).filter(Boolean))].sort(
    (a, b) => b.length - a.length,
  );
  if (unique.length === 0) return escaped;
  const pattern = new RegExp(`(${unique.map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
  return escaped.replace(pattern, '<mark class="srch-mark">$1</mark>');
}

function matchedIn(entry: Entry, terms: string[]): { score: number; fields: string[] } {
  let score = 0;
  const fields: string[] = [];
  const fullText = normalize([entry.title, entry.title_en, entry.summary, entry.significance].join(' '));
  for (const term of terms) {
    const needle = normalize(term);
    if (!needle) continue;
    for (const { field, weight, label } of FIELD_WEIGHTS) {
      const haystack = normalize(fieldText(entry, field));
      if (haystack.includes(needle)) {
        // 命中次数有上限，避免长正文刷分
        const occurrences = Math.min(3, haystack.split(needle).length - 1);
        score += weight * (1 + (occurrences - 1) * 0.2);
        if (!fields.includes(label)) fields.push(label);
      }
    }
    // 全词/短语命中标题额外加分
    if (fullText.includes(needle) && normalize(entry.title).includes(needle)) score += 4;
  }
  return { score, fields };
}

function buildSnippet(entry: Entry, terms: string[]): string {
  const candidates: Array<{ text: string; priority: number }> = [
    { text: entry.summary, priority: 0 },
    { text: entry.significance, priority: 1 },
    { text: entry.thought_summary ?? '', priority: 1 },
    { text: entry.quote ?? '', priority: 2 },
    { text: entry.body ?? '', priority: 3 },
  ];
  for (const candidate of candidates) {
    if (!candidate.text) continue;
    const normalized = normalize(candidate.text);
    if (terms.some((term) => normalized.includes(normalize(term)))) {
      return highlight(truncateAround(candidate.text, terms, 150), terms);
    }
  }
  return highlight(truncate(entry.summary, 150), terms);
}

function truncate(text: string, maxLength: number): string {
  return text.length <= maxLength ? text : `${text.slice(0, maxLength)}…`;
}

function truncateAround(text: string, terms: string[], maxLength: number): string {
  if (text.length <= maxLength) return text;
  const normalized = normalize(text);
  const hit = terms
    .map((term) => normalized.indexOf(normalize(term)))
    .filter((index) => index >= 0)
    .sort((a, b) => a - b)[0];
  if (hit === undefined) return truncate(text, maxLength);
  const start = Math.max(0, hit - Math.floor(maxLength / 2));
  const end = Math.min(text.length, start + maxLength);
  return `${start > 0 ? '…' : ''}${text.slice(start, end)}${end < text.length ? '…' : ''}`;
}

export function searchEntries(entries: readonly Entry[], filters: SearchFilters): SearchHit[] {
  const terms = tokenizeQuery(filters.q);
  const hits: SearchHit[] = [];

  for (const entry of entries) {
    if (filters.categories && filters.categories.length > 0) {
      if (!entry.categories.some((category) => filters.categories!.includes(category))) continue;
    }
    if (filters.types && filters.types.length > 0 && !filters.types.includes(entry.type)) continue;
    const year = Number(entry.date.slice(0, 4));
    if (filters.yearFrom !== undefined && year < filters.yearFrom) continue;
    if (filters.yearTo !== undefined && year > filters.yearTo) continue;
    if (filters.impMin !== undefined && entry.importance < filters.impMin) continue;
    if (filters.impMax !== undefined && entry.importance > filters.impMax) continue;

    if (terms.length === 0) {
      hits.push({ entry, score: 0, snippet: highlight(truncate(entry.summary, 150), []), matchedFields: [] });
      continue;
    }

    const { score, fields } = matchedIn(entry, terms);
    // AND 语义：每个关键词都必须至少命中一个字段
    if (fields.length === 0) continue;
    const allMatched = terms.every((term) => {
      const needle = normalize(term);
      return FIELD_WEIGHTS.some(({ field }) => normalize(fieldText(entry, field)).includes(needle));
    });
    if (!allMatched) continue;

    hits.push({ entry, score, snippet: buildSnippet(entry, terms), matchedFields: fields });
  }

  return hits.sort((a, b) => b.score - a.score || b.entry.date.localeCompare(a.entry.date));
}
