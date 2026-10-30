import type { Entry } from './types';

/**
 * 主线章节配置：默认视图只讲大脉络，5 个章节纵向叙事。
 * 章节边界用日期区间；主线节点由条目的 mainline: true 决定（数据驱动，可增删）。
 */
export interface MainlineChapterMeta {
  id: string;
  title: string;
  en: string;
  dateStart: string;
  dateEnd: string;
  description: string;
}

export const MAINLINE_CHAPTERS: MainlineChapterMeta[] = [
  {
    id: 'dl-renaissance',
    title: '深度学习复兴',
    en: 'Deep Learning Renaissance',
    dateStart: '2012-01-01',
    dateEnd: '2016-12-31',
    description: 'AlexNet 用 GPU 与大数据点燃深度学习，视觉、生成模型与强化学习接连突破。',
  },
  {
    id: 'transformer-era',
    title: 'Transformer 与预训练',
    en: 'Transformer & Pretraining',
    dateStart: '2017-01-01',
    dateEnd: '2019-12-31',
    description: '注意力机制取代循环结构，预训练 + 微调成为新的通用范式。',
  },
  {
    id: 'scaling-era',
    title: '规模化与大模型',
    en: 'Scaling Era',
    dateStart: '2020-01-01',
    dateEnd: '2022-08-31',
    description: 'Scaling Laws 把"更大"变成可预测的工程；GPT-3、AlphaFold2、CLIP 展示通用能力。',
  },
  {
    id: 'generative-boom',
    title: '生成式 AI 爆发',
    en: 'Generative AI Boom',
    dateStart: '2022-09-01',
    dateEnd: '2023-12-31',
    description: 'ChatGPT 把大模型装进日常对话框，开源模型与多模态能力同时加速。',
  },
  {
    id: 'reasoning-open',
    title: '推理、开源与智能体',
    en: 'Reasoning, Open Source & Agents',
    dateStart: '2024-01-01',
    dateEnd: '2026-12-31',
    description: '推理模型、开源竞争与智能体协议成为新前线，能力与治理的张力公开化。',
  },
];

export interface MainlineChapterData extends MainlineChapterMeta {
  entries: Entry[];
  /** 本章未进入主线的背景事件（用于"另有 N 条"的体量感） */
  background: Entry[];
}

export function inChapter(entry: Entry, chapter: MainlineChapterMeta): boolean {
  return entry.date >= chapter.dateStart && entry.date <= chapter.dateEnd;
}

/** 主线视图数据：按章节分组的精选项 + 背景事件 */
export function buildMainlineChapters(
  entries: readonly Entry[],
): MainlineChapterData[] {
  return MAINLINE_CHAPTERS.map((chapter) => {
    const inRange = entries.filter(
      (entry) => entry.date >= '2012-01-01' && inChapter(entry, chapter),
    );
    const mainline = inRange
      .filter((entry) => entry.mainline)
      .sort((a, b) => a.date.localeCompare(b.date));
    const background = inRange.filter(
      (entry) => !entry.mainline && entry.type !== 'insight',
    );
    return { ...chapter, entries: mainline, background };
  });
}

/** 主线总节点数 / 全量条数，用于页面说明 */
export function mainlineStats(entries: readonly Entry[]): {
  mainlineCount: number;
  backgroundCount: number;
} {
  const mainline = entries.filter((entry) => entry.mainline && entry.date >= '2012-01-01');
  const background = entries.filter(
    (entry) => !entry.mainline && entry.type !== 'insight' && entry.date >= '2012-01-01',
  );
  return { mainlineCount: mainline.length, backgroundCount: background.length };
}
