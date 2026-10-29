import type { RelationDirection, RelationType } from '../lib/types';

export interface RelationMeta {
  label: string;
  /** 图谱边颜色 */
  color: string;
  /** ECharts lineStyle.type */
  lineType: 'solid' | 'dashed' | 'dotted';
  /** 影响力方向语义（构建期归一化用） */
  direction: RelationDirection;
  bidirectional?: boolean;
  /** 关系方向说明（图例/详情用） */
  description: string;
}

/**
 * 关系类型的全局视觉与方向约定（唯一定义处）。
 * 语义见 docs/DECISIONS.md §10.3：
 * 基于/启发/开源衍生 → target 是上游；奠基/人才流动 → subject 是上游；竞争 → 双向。
 */
export const RELATION_META: Record<RelationType, RelationMeta> = {
  奠基: {
    label: '奠基',
    color: '#94A3B8',
    lineType: 'solid',
    direction: 'forward',
    description: '本条目的基础工作（本条目 → 目标）',
  },
  基于: {
    label: '基于',
    color: '#60A5FA',
    lineType: 'solid',
    direction: 'backward',
    description: '本条目基于目标（目标 → 本条目）',
  },
  启发: {
    label: '启发',
    color: '#A78BFA',
    lineType: 'dashed',
    direction: 'backward',
    description: '本条目受目标启发（目标 → 本条目）',
  },
  竞争: {
    label: '竞争',
    color: '#F87171',
    lineType: 'dashed',
    direction: 'symmetric',
    bidirectional: true,
    description: '同期竞争关系（双向）',
  },
  开源衍生: {
    label: '开源衍生',
    color: '#4ADE80',
    lineType: 'dotted',
    direction: 'backward',
    description: '本条目衍生自目标（目标 → 本条目）',
  },
  人才流动: {
    label: '人才流动',
    color: '#FBBF24',
    lineType: 'solid',
    direction: 'forward',
    description: '人才从本条目相关方流向目标（本条目 → 目标）',
  },
};

export const RELATION_ORDER: RelationType[] = ['奠基', '基于', '启发', '开源衍生', '竞争', '人才流动'];
