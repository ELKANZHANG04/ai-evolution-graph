/**
 * 全站唯一的数据契约。
 * 前端与 scripts/（构建期）都从这里取类型；数据源是 data/entries/*.md。
 */

export const ENTRY_TYPES = ['event', 'insight', 'product'] as const;
export type EntryType = (typeof ENTRY_TYPES)[number];

/** 类别枚举：颜色全局固定，见 src/theme/categories.ts */
export const CATEGORY_VALUES = [
  'architecture',
  'model',
  'product',
  'opensource',
  'alignment',
  'multimodal',
  'agent',
  'hardware',
  'thought',
  'org',
] as const;
export type Category = (typeof CATEGORY_VALUES)[number];

/** 关系类型枚举 */
export const RELATION_TYPES = ['奠基', '基于', '启发', '竞争', '开源衍生', '人才流动'] as const;
export type RelationType = (typeof RELATION_TYPES)[number];

/** 图谱节点种类（可选字段；缺省时按 type/categories 派生） */
export const NODE_KINDS = ['model', 'paper', 'company', 'person', 'concept'] as const;
export type NodeKind = (typeof NODE_KINDS)[number];

export interface Relation {
  /** 目标条目 id，必须存在于 data/entries */
  to: string;
  type: RelationType;
  /** 可选补充说明 */
  note?: string;
}

export interface Entry {
  id: string;
  type: EntryType;
  title: string;
  title_en: string;
  /** YYYY-MM-DD */
  date: string;
  /** 1-10，长期锚定，禁止通胀 */
  importance: number;
  categories: Category[];
  summary: string;
  significance: string;
  /** 仅 insight：观点原文 */
  quote?: string;
  /** 仅 insight：谁说的 */
  speaker?: string;
  /** 仅 insight：场合 */
  occasion?: string;
  my_comment?: string;
  tags: string[];
  sources: string[];
  relations: Relation[];
  needs_review: boolean;
  node_kind?: NodeKind;
  /** 入库日期（每日更新写入，用于 NEW 标记）；种子数据可缺省 */
  added_at?: string;
  /** Markdown 正文：思想的深度解读等，详情里展示 */
  body?: string;
}

/** 构建产出的元信息，用于页头"数据新鲜度"与关于页统计 */
export interface Meta {
  builtAt: string;
  count: number;
  firstDate: string;
  latestDate: string;
  byYear: Record<string, number>;
  byCategory: Record<string, number>;
  byType: Record<string, number>;
  importanceDistribution: Record<string, number>;
  needsReview: number;
  withSources: number;
}

export interface GraphNode {
  id: string;
  title: string;
  year: number;
  importance: number;
  categories: Category[];
  type: EntryType;
  nodeKind: NodeKind;
}

export interface GraphEdge {
  source: string;
  target: string;
  type: RelationType;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}
