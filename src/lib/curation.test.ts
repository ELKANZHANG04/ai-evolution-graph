import { describe, expect, it } from 'vitest';
import { MAINLINE_CAP, planCuration } from './curation';
import type { Entry } from './types';

function makeEntry(overrides: Partial<Entry> & { id: string; date: string; importance: number }): Entry {
  const base = {
    type: 'event',
    title: overrides.id,
    title_en: overrides.id,
    categories: ['model'],
    summary: 's',
    significance: 's',
    tags: [],
    sources: [],
    relations: [],
    needs_review: false,
  };
  return { ...base, ...overrides } as Entry;
}

const today = '2026-10-29';

describe('planCuration', () => {
  it('把够重要的候选晋升到主线容量上限', () => {
    const entries = [
      makeEntry({ id: 'main-1', date: '2024-01-01', importance: 10, mainline: true }),
      makeEntry({ id: 'cand-1', date: '2026-01-01', importance: 9 }),
      makeEntry({ id: 'cand-2', date: '2026-02-01', importance: 8 }),
      makeEntry({ id: 'weak', date: '2026-03-01', importance: 7 }),
    ];
    const plan = planCuration(entries, { today, cap: 4 });
    expect(plan.promote.map((entry) => entry.id)).toEqual(['cand-1', 'cand-2']);
    expect(plan.mainlineAfter).toBe(3);
  });

  it('待核对 / 思想 / 非重要事件不进入候选池', () => {
    const entries = [
      makeEntry({ id: 'review', date: '2026-01-01', importance: 9, needs_review: true }),
      makeEntry({ id: 'insight', date: '2026-01-01', importance: 9, type: 'insight' }),
      makeEntry({ id: 'low', date: '2026-01-01', importance: 5 }),
    ];
    const plan = planCuration(entries, { today });
    expect(plan.pool).toHaveLength(0);
  });

  it('主线超过容量时按重要度末位淘汰，10 分永不淘汰', () => {
    const entries = [
      makeEntry({ id: 'keep-10', date: '2018-01-01', importance: 10, mainline: true }),
      makeEntry({ id: 'keep-9', date: '2019-01-01', importance: 9, mainline: true }),
      makeEntry({ id: 'drop-6', date: '2015-01-01', importance: 6, mainline: true }),
      makeEntry({ id: 'keep-7', date: '2016-01-01', importance: 7, mainline: true }),
    ];
    const plan = planCuration(entries, { today, cap: 3 });
    expect(plan.demote.map((entry) => entry.id)).toEqual(['drop-6']);
    expect(plan.mainlineAfter).toBe(3);
  });

  it('默认容量为 MAINLINE_CAP', () => {
    const plan = planCuration([], { today });
    expect(plan.cap).toBe(MAINLINE_CAP);
  });
});
