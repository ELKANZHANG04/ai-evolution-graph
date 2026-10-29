import entriesJson from '../generated/entries.json';
import graphJson from '../generated/graph.json';
import metaJson from '../generated/meta.json';
import type { Category, Entry, GraphData, Meta, RelationType } from './types';

/**
 * 构建期数据入口。
 * scripts/build-data.ts 会把 data/entries/*.md 编译成 src/generated/*.json；
 * 前期数据量小（~100 条）直接同步引入，长期 1000+ 时按年分片懒加载（接口保持不变）。
 */
export const ENTRIES: Entry[] = entriesJson as unknown as Entry[];
export const META: Meta = metaJson as unknown as Meta;
export const GRAPH: GraphData = graphJson as unknown as GraphData;

const byId = new Map(ENTRIES.map((e) => [e.id, e]));

export function getEntryById(id: string | null | undefined): Entry | undefined {
  if (!id) return undefined;
  return byId.get(id);
}

export interface YearGroup {
  year: number;
  entries: Entry[];
  /** 当年影响力总分——时间轴列高 ∝ 该值 */
  totalImportance: number;
}

export function groupByYear(entries: readonly Entry[] = ENTRIES): YearGroup[] {
  const map = new Map<number, Entry[]>();
  for (const entry of entries) {
    const year = Number(entry.date.slice(0, 4));
    if (!Number.isFinite(year)) continue;
    const list = map.get(year) ?? [];
    list.push(entry);
    map.set(year, list);
  }
  return [...map.entries()]
    .sort(([a], [b]) => a - b)
    .map(([year, list]) => ({
      year,
      entries: list.sort((a, b) => b.importance - a.importance || a.date.localeCompare(b.date)),
      totalImportance: list.reduce((sum, e) => sum + e.importance, 0),
    }));
}

export function countByCategory(entries: readonly Entry[] = ENTRIES): Partial<Record<Category, number>> {
  const counts: Partial<Record<Category, number>> = {};
  for (const entry of entries) {
    for (const category of entry.categories) {
      counts[category] = (counts[category] ?? 0) + 1;
    }
  }
  return counts;
}

export function yearSpan(entries: readonly Entry[] = ENTRIES): [number, number] | null {
  if (entries.length === 0) return null;
  const years = entries.map((e) => Number(e.date.slice(0, 4))).filter(Number.isFinite);
  if (years.length === 0) return null;
  return [Math.min(...years), Math.max(...years)];
}

export interface RelatedItem {
  entry: Entry;
  type: RelationType;
  note?: string;
}

export function relatedEntries(entry: Entry): RelatedItem[] {
  const items: RelatedItem[] = [];
  for (const relation of entry.relations) {
    const target = getEntryById(relation.to);
    if (target) items.push({ entry: target, type: relation.type, note: relation.note });
  }
  return items;
}

export function incomingRelations(entry: Entry): RelatedItem[] {
  const items: RelatedItem[] = [];
  for (const candidate of ENTRIES) {
    const relation = candidate.relations.find((item) => item.to === entry.id);
    if (relation) items.push({ entry: candidate, type: relation.type });
  }
  return items;
}
