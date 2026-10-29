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

/** 思想链角色：命题 / 推进 / 修正 / 反驳 */
export const THOUGHT_ROLES = ['thesis', 'advance', 'revision', 'rebuttal'] as const;
export type ThoughtRole = (typeof THOUGHT_ROLES)[number];

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
  /** 是否进入「主线」视图（默认视图只展示精选项，其余作为背景） */
  mainline?: boolean;
  /** 思想看板：所属思想主题（见 src/lib/thoughtChains.ts） */
  thought_chain?: string;
  /** 思想看板：在本链中的角色 */
  thought_role?: ThoughtRole;
  /** 思想看板：一句话主张（卡片主标题，突出思想本身） */
  thought_claim?: string;
  /** 思想看板：2–3 句思想概括（卡片正文） */
  thought_summary?: string;
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
  /** YYYY-MM-DD，图谱 x 轴按日期精确定位 */
  date: string;
  year: number;
  importance: number;
  categories: Category[];
  type: EntryType;
  nodeKind: NodeKind;
}

/**
 * 关系边的方向语义（构建期归一化，供影响图谱使用）：
 * - forward：subject 在上游（subject → target，影响力从 subject 流向 target）
 * - backward：target 在上游（target → subject）
 * - symmetric：双向（如竞争）
 * 定义见 docs/DECISIONS.md §10。
 */
export type RelationDirection = 'forward' | 'backward' | 'symmetric';

export interface GraphEdge {
  /** 上游（影响力来源）节点 id */
  source: string;
  /** 下游（被影响）节点 id */
  target: string;
  type: RelationType;
  direction: RelationDirection;
  /** 是否双向（竞争、部分人才流动） */
  bidirectional?: boolean;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}
