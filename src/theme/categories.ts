import type { Category, EntryType, NodeKind } from '../lib/types';
import { CATEGORY_VALUES } from '../lib/types';

/** 图例与筛选项的固定顺序（颜色/顺序都是全局约定，不要在组件里另写一套） */
export const CATEGORY_ORDER: readonly Category[] = CATEGORY_VALUES;

export interface CategoryMeta {
  /** 中文短标签（块内/图例/卡片用） */
  label: string;
  labelEn: string;
  /** 深色背景专用固定色 */
  color: string;
}

export const CATEGORY_META: Record<Category, CategoryMeta> = {
  architecture: { label: '架构', labelEn: 'Architecture', color: '#A78BFA' },
  model: { label: '模型', labelEn: 'Model', color: '#60A5FA' },
  product: { label: '产品', labelEn: 'Product', color: '#2DD4BF' },
  opensource: { label: '开源', labelEn: 'Open Source', color: '#4ADE80' },
  alignment: { label: '对齐', labelEn: 'Alignment', color: '#F87171' },
  multimodal: { label: '多模态', labelEn: 'Multimodal', color: '#FB923C' },
  agent: { label: '智能体', labelEn: 'Agent', color: '#FACC15' },
  hardware: { label: '硬件', labelEn: 'Hardware', color: '#C2A27A' },
  thought: { label: '思想', labelEn: 'Thought', color: '#F472B6' },
  org: { label: '组织', labelEn: 'Organization', color: '#94A3B8' },
};

export function categoryColor(category: Category): string {
  return CATEGORY_META[category]?.color ?? '#94A3B8';
}

export function categoryLabel(category: Category): string {
  return CATEGORY_META[category]?.label ?? category;
}

/** 节点/卡片的主色：取条目的第一个类别（数据侧约定：最重要的类别放第一位） */
export function primaryCategory(categories: Category[]): Category {
  return categories[0] ?? 'model';
}

/**
 * 图谱节点种类：优先用 frontmatter 的 node_kind，否则按类别/类型派生。
 */
export function nodeKindOf(entry: {
  node_kind?: NodeKind;
  type: EntryType;
  categories: Category[];
}): NodeKind {
  if (entry.node_kind) return entry.node_kind;
  if (entry.categories.includes('org')) return 'company';
  if (entry.categories.includes('thought')) return 'concept';
  if (entry.categories.includes('model') || entry.categories.includes('architecture')) return 'model';
  if (entry.type === 'product') return 'concept';
  return 'concept';
}

/** 浅色文字/深色文字：用于块内标签在任意类别底色上的可读性 */
export function textOn(color: string): string {
  const hex = color.replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return luminance > 0.62 ? '#0B0E14' : '#FFFFFF';
}
