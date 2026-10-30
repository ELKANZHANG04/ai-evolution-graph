import { describe, expect, it } from 'vitest';
import type { Entry } from './types';
import type { ThoughtChainData, ThoughtStepData } from './thoughtChains';
import {
  ACTIVITY_START_YEAR,
  NEW_DIRECTION_MAX,
  monthsBefore,
  themeFreshness,
  toLocalISODate,
} from './thoughtFreshness';

const TODAY = new Date(2026, 9, 30, 12, 0, 0); // 2026-10-30 本地时间
// 近 18 个月边界：2025-04-30

function makeEntry(overrides: Partial<Entry> & { id: string; date: string }): Entry {
  const base: Entry = {
    id: overrides.id,
    type: 'insight',
    title: `条目 ${overrides.id}`,
    title_en: 'Entry',
    date: overrides.date,
    importance: 6,
    categories: ['thought'],
    summary: '摘要',
    significance: '意义',
    tags: [],
    sources: [],
    relations: [],
    needs_review: false,
  };
  return { ...base, ...overrides };
}

interface ChainStepInput {
  date: string;
  pin?: boolean;
  claim?: string;
  title?: string;
}

function makeChain(steps: ChainStepInput[]): ThoughtChainData {
  const chainSteps: ThoughtStepData[] = steps.map((step, index) => ({
    entry: makeEntry({
      id: `entry-${index}`,
      date: step.date,
      thought_pin: step.pin ? 'top' : undefined,
      thought_claim: step.claim,
      title: step.title ?? `条目 ${index}`,
    }),
    role: 'advance',
    arrow: '推进',
  }));
  return {
    id: 'test-theme',
    title: '测试主题',
    question: '测试问题？',
    description: '测试描述',
    steps: chainSteps,
    context: [],
    branches: chainSteps.length > 0 ? [{ label: '测试分支', steps: chainSteps }] : [],
    extraCount: 0,
  };
}

describe('themeFreshness', () => {
  it('持续活跃：返回最新日期/月份、近 18 个月计数与 active 状态', () => {
    const chain = makeChain([
      { date: '2012-10-01' },
      { date: '2017-06-12' },
      { date: '2025-04-29' }, // 边界前一天，不算近 18 个月
      { date: '2025-04-30' }, // 恰好落在边界内
      { date: '2026-01-15' },
      { date: '2026-10-17' },
    ]);

    const freshness = themeFreshness(chain, TODAY);

    expect(freshness.latestDate).toBe('2026-10-17');
    expect(freshness.latestMonth).toBe('2026-10');
    expect(freshness.recentCount).toBe(3);
    expect(freshness.status).toBe('active');
  });

  it('老化主题：最近停留两年前时返回 stale 且计数为 0', () => {
    const chain = makeChain([
      { date: '2017-11-11' },
      { date: '2020-10-22' },
      { date: '2022-06-23' },
    ]);

    const freshness = themeFreshness(chain, TODAY);

    expect(freshness.recentCount).toBe(0);
    expect(freshness.status).toBe('stale');
    expect(freshness.latestMonth).toBe('2022-06');
  });

  it('年份活动条：2012 → 今年每年一个刻度，计数正确且最近两年高亮', () => {
    const chain = makeChain([
      { date: '2012-10-01' },
      { date: '2017-06-12' },
      { date: '2025-01-01' },
      { date: '2025-12-31' },
      { date: '2026-03-01' },
    ]);

    const freshness = themeFreshness(chain, TODAY);

    expect(freshness.yearBuckets).toHaveLength(2026 - ACTIVITY_START_YEAR + 1);
    expect(freshness.yearBuckets[0]).toEqual({ year: 2012, count: 1, recent: false });
    expect(freshness.yearBuckets.find((bucket) => bucket.year === 2017)?.count).toBe(1);
    expect(freshness.yearBuckets.find((bucket) => bucket.year === 2020)?.count).toBe(0);
    expect(freshness.yearBuckets.find((bucket) => bucket.year === 2025)?.count).toBe(2);
    expect(freshness.yearBuckets.find((bucket) => bucket.year === 2025)?.recent).toBe(true);
    expect(freshness.yearBuckets.find((bucket) => bucket.year === 2026)).toEqual({
      year: 2026,
      count: 1,
      recent: true,
    });
  });

  it('空主题：无最新日期、stale、年份条全为 0、无新方向', () => {
    const chain = makeChain([]);
    const freshness = themeFreshness(chain, TODAY);

    expect(freshness.latestDate).toBeNull();
    expect(freshness.latestMonth).toBeNull();
    expect(freshness.recentCount).toBe(0);
    expect(freshness.status).toBe('stale');
    expect(freshness.yearBuckets.every((bucket) => bucket.count === 0)).toBe(true);
    expect(freshness.newDirections).toEqual([]);
  });

  it('新方向：来自 thought_pin=top，优先 claim、超过 24 字截断、去重', () => {
    const longClaim = '这是一个非常长的核心主张需要被截断到二十四个字以内的长度才能放进主题头';
    const chain = makeChain([
      { date: '2026-10-01', pin: true, claim: '全双工语音交互', title: '长标题不应被使用' },
      { date: '2026-09-01', pin: true, claim: longClaim },
      { date: '2026-08-01', pin: true, claim: '全双工语音交互' }, // 重复方向
      { date: '2026-07-01', claim: '未置顶的普通步骤' },
    ]);

    const freshness = themeFreshness(chain, TODAY);

    expect(freshness.newDirections).toHaveLength(2);
    expect(freshness.newDirections[0]).toBe('全双工语音交互');
    expect(freshness.newDirections[1]).toHaveLength(NEW_DIRECTION_MAX + 1);
    expect(freshness.newDirections[1].endsWith('…')).toBe(true);
  });

  it('18 个月边界按自然月回推，月末自动取目标月最后一天', () => {
    const endOfMarch = new Date(2026, 2, 31); // 2026-03-31
    expect(toLocalISODate(monthsBefore(endOfMarch, 18))).toBe('2024-09-30');

    const chain = makeChain([{ date: '2024-09-30' }, { date: '2024-09-29' }]);
    const freshness = themeFreshness(chain, endOfMarch);
    expect(freshness.recentCount).toBe(1);
    expect(freshness.status).toBe('active');
  });
});
