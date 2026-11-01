import { describe, expect, it } from 'vitest';
import type { Entry } from './types';
import {
  buildStarMainlineNetwork,
  chapterIndexOfDate,
  getMainlineEntries,
  resolveStarPosition,
  ANCHOR_MIN_SCORE,
} from './mainline-network';

function makeEntry(overrides: Partial<Entry>): Entry {
  return {
    id: 'entry',
    type: 'event',
    title: '条目',
    title_en: 'Entry',
    date: '2026-01-01',
    importance: 5,
    categories: ['model'],
    summary: 'summary',
    significance: 'significance',
    tags: [],
    sources: ['https://example.com'],
    relations: [],
    needs_review: false,
    ...overrides,
  };
}

const BASE_ENTRIES: Entry[] = [
  makeEntry({
    id: 'ml-a',
    title: '主线 A：AlexNet 时刻',
    date: '2015-01-01',
    importance: 9,
    categories: ['architecture'],
    tags: ['transformer'],
    mainline: true,
  }),
  makeEntry({
    id: 'ml-b',
    title: '主线 B：Transformer 时代',
    date: '2017-06-01',
    importance: 9,
    categories: ['architecture'],
    tags: ['transformer'],
    mainline: true,
    relations: [{ to: 'ml-a', type: '基于' }],
  }),
  makeEntry({
    id: 'star-connected',
    title: '新模型接入 Transformer',
    date: '2026-01-02',
    categories: ['architecture'],
    tags: ['transformer'],
    relations: [{ to: 'ml-b', type: '基于' }],
  }),
  makeEntry({
    id: 'star-novel',
    title: '一条主线之外的新线索',
    date: '2026-02-01',
    categories: ['thought'],
    tags: ['哲学'],
  }),
  makeEntry({
    id: 'star-company-only',
    title: '某公司发布财报',
    date: '2026-03-01',
    categories: ['model'],
    tags: ['google', 'Gemini'],
  }),
  makeEntry({
    id: 'ml-bert',
    title: 'BERT 预训练',
    date: '2018-10-01',
    importance: 8,
    categories: ['model'],
    tags: ['bert', 'google'],
    mainline: true,
  }),
];

describe('getMainlineEntries', () => {
  it('只保留 mainline 里程碑并按日期排序', () => {
    const mainline = getMainlineEntries(BASE_ENTRIES);
    expect(mainline.map((entry) => entry.id)).toEqual(['ml-a', 'ml-b', 'ml-bert']);
  });
});

describe('chapterIndexOfDate', () => {
  it('按章节日期区间分组', () => {
    expect(chapterIndexOfDate('2012-01-01')).toBe(0);
    expect(chapterIndexOfDate('2016-12-31')).toBe(0);
    expect(chapterIndexOfDate('2017-01-01')).toBe(1);
    expect(chapterIndexOfDate('2022-08-31')).toBe(2);
    expect(chapterIndexOfDate('2022-09-01')).toBe(3);
    expect(chapterIndexOfDate('2026-12-31')).toBe(4);
  });
});

describe('buildStarMainlineNetwork', () => {
  const network = buildStarMainlineNetwork(BASE_ENTRIES, [
    'star-connected',
    'star-novel',
    'star-company-only',
    'ml-a',
  ]);

  it('星标先接主线，再接不上时归为新方向', () => {
    const connected = network.stars.find((star) => star.entry.id === 'star-connected');
    const novel = network.stars.find((star) => star.entry.id === 'star-novel');
    expect(connected?.novel).toBe(false);
    expect(connected?.anchors[0]?.id).toBe('ml-b');
    expect(connected?.anchors[0]?.score).toBeGreaterThanOrEqual(ANCHOR_MIN_SCORE);
    expect(novel?.novel).toBe(true);
    expect(novel?.anchors).toEqual([]);
  });

  it('只提到公司名不能硬接主线', () => {
    const company = network.stars.find((star) => star.entry.id === 'star-company-only');
    expect(company?.novel).toBe(true);
  });

  it('主线里程碑本身被加星时不再复制卫星节点', () => {
    const mainlineStar = network.stars.find((star) => star.entry.id === 'ml-a');
    expect(mainlineStar?.isMainlineMilestone).toBe(true);
    expect(mainlineStar?.x).toBe(network.strips[0].mainline[0].x);
  });

  it('按 5 个阶段分组，星标落在所属阶段', () => {
    expect(network.strips).toHaveLength(5);
    expect(network.stats).toMatchObject({
      stars: 4,
      connected: 2,
      novel: 2,
      chapters: 5,
      mainline: 3,
      mainlineStarred: 1,
    });
    const connected = network.stars.find((star) => star.entry.id === 'star-connected');
    expect(connected?.chapterIndex).toBe(1);
  });

  it('每个卫星星标都有确定坐标，落在画布内', () => {
    for (const star of network.stars) {
      if (star.isMainlineMilestone) continue;
      expect(Number.isFinite(star.x)).toBe(true);
      expect(Number.isFinite(star.y)).toBe(true);
      expect(star.x).toBeGreaterThanOrEqual(0);
      expect(star.x).toBeLessThanOrEqual(network.width);
      expect(star.y).toBeGreaterThanOrEqual(0);
      expect(star.y).toBeLessThanOrEqual(network.height);
    }
    expect(network.height).toBeGreaterThan(0);
  });

  it('同样的输入得到同样的布局（确定性）', () => {
    const again = buildStarMainlineNetwork(BASE_ENTRIES, [
      'star-connected',
      'star-novel',
      'star-company-only',
      'ml-a',
    ]);
    const pick = (source: typeof network) =>
      source.stars.map((star) => [star.entry.id, Math.round(star.x * 100), Math.round(star.y * 100)]);
    expect(pick(again)).toEqual(pick(network));
  });

  it('新方向会轻推主线节点，并虚线挂到最近的里程碑', () => {
    const entries = [
      ...BASE_ENTRIES,
      makeEntry({
        id: 'ml-gpt5',
        title: 'GPT-5 发布',
        date: '2025-08-07',
        importance: 9,
        categories: ['model'],
        tags: ['gpt-5'],
        mainline: true,
      }),
    ];
    const latest = buildStarMainlineNetwork(entries, ['star-novel']);
    const strip = latest.strips[4];
    expect(strip.mainline).toHaveLength(1);
    expect(strip.mainline[0].nudged).toBe(true);
    expect(strip.novelCount).toBe(1);
    expect(strip.links[0]?.anchored).toBe(false);
    expect(strip.links[0]?.mainlineId).toBe('ml-gpt5');
  });

  it('位置描述优先使用生成文案，否则回退成「章节 + 锚点」', () => {
    const chapter = resolveStarPosition(BASE_ENTRIES[2], 1, [
      { id: 'ml-b', title: '主线 B', date: '2017-06-01', score: 9, tier: 'medium', reasons: [] },
    ], false);
    expect(chapter.source).toBe('derived');
    expect(chapter.position).toContain('第 2 章');
    expect(chapter.position).toContain('主线 B');

    const mainlineStar = resolveStarPosition(BASE_ENTRIES[0], 0, [], true);
    expect(mainlineStar.position).toContain('里程碑');
  });
});
