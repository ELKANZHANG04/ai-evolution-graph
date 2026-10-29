/**
 * 影响力评分锚点（1-10）。这张表同时用于：
 * - 详情抽屉的评分说明；
 * - 关于页展示（需求硬性要求）；
 * - scripts/validate.ts 的通胀检查。
 * 修改锚点必须有明确理由，且要同步检查全库评分分布。
 */

export interface ImportanceAnchor {
  range: [number, number];
  label: string;
  meaning: string;
  anchors: string;
  color: string;
}

export const IMPORTANCE_ANCHORS: ImportanceAnchor[] = [
  {
    range: [10, 10],
    label: '开启范式/时代',
    meaning: '改变了整个领域的问题与方法',
    anchors: 'Transformer(2017)、AlexNet(2012)、ChatGPT(2022)',
    color: '#F5C542',
  },
  {
    range: [8, 9],
    label: '里程碑突破',
    meaning: '重要范式 / 能力 / 产品的里程碑',
    anchors: 'GPT-3、AlphaFold2、GPT-4、o1、DeepSeek-R1、Stable Diffusion、Scaling Laws',
    color: '#FB923C',
  },
  {
    range: [6, 7],
    label: '重要进展',
    meaning: '新 SOTA、重要开源、显著能力跃升、现象级产品',
    anchors: '代表性模型/产品/方法的重要版本',
    color: '#2DD4BF',
  },
  {
    range: [4, 5],
    label: '值得注意',
    meaning: '有代表性的产品/方法/趋势信号',
    anchors: '趋势信号、有代表性的小产品/小方法',
    color: '#60A5FA',
  },
  {
    range: [1, 3],
    label: '小启发',
    meaning: '有意思的演示、值得记住的观点',
    anchors: 'demo、短评、值得记一笔的观点',
    color: '#94A3B8',
  },
];

export function importanceAnchor(importance: number): ImportanceAnchor {
  const n = Math.min(10, Math.max(1, Math.round(importance)));
  return IMPORTANCE_ANCHORS.find((a) => n >= a.range[0] && n <= a.range[1]) ?? IMPORTANCE_ANCHORS[4];
}

export function importanceColor(importance: number): string {
  return importanceAnchor(importance).color;
}

export function importanceLabel(importance: number): string {
  return importanceAnchor(importance).label;
}
