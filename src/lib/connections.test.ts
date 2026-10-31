import { describe, expect, it } from 'vitest';
import type { Entry } from './types';
import { buildStarConnections, connectionBetween } from './connections';

function makeEntry(overrides: Partial<Entry>): Entry {
  return {
    id: 'a',
    type: 'event',
    title: 'A',
    title_en: 'A',
    date: '2026-01-01',
    importance: 5,
    categories: ['model'],
    summary: 's',
    significance: 'g',
    tags: [],
    sources: [],
    relations: [],
    needs_review: false,
    ...overrides,
  };
}

describe('connectionBetween', () => {
  it('共享标签 + 同类别 + 同期会产生联系', () => {
    const a = makeEntry({ id: 'a', tags: ['Agent', '国内'], categories: ['model', 'agent'], date: '2026-10-01' });
    const b = makeEntry({ id: 'b', tags: ['Agent'], categories: ['model'], date: '2026-10-20' });
    const result = connectionBetween(a, b);
    expect(result.score).toBeGreaterThanOrEqual(3);
    expect(result.reasons.join('|')).toContain('共同标签');
    expect(result.reasons.join('|')).toContain('同类别');
  });

  it('没有共同点时分数为 0', () => {
    const a = makeEntry({ id: 'a', tags: ['chip'], categories: ['hardware'], date: '2018-01-01' });
    const b = makeEntry({ id: 'b', tags: ['agent'], categories: ['agent'], date: '2026-01-01' });
    expect(connectionBetween(a, b).score).toBe(0);
  });

  it('已有引用关系时权重最高', () => {
    const a = makeEntry({ id: 'a', date: '2018-01-01' });
    const b = makeEntry({ id: 'b', date: '2026-01-01', relations: [{ to: 'a', type: '基于' }] });
    const result = connectionBetween(a, b);
    expect(result.reasons).toContain('条目之间已有引用/影响关系');
    expect(result.score).toBeGreaterThanOrEqual(4);
  });
});

describe('buildStarConnections', () => {
  it('返回连通簇与孤立点', () => {
    const entries = [
      makeEntry({ id: 'a', tags: ['Agent'], date: '2026-10-01' }),
      makeEntry({ id: 'b', tags: ['Agent'], date: '2026-10-02' }),
      makeEntry({ id: 'c', tags: ['chip'], categories: ['hardware'], date: '2020-01-01' }),
    ];
    const result = buildStarConnections(entries, ['a', 'b', 'c']);
    expect(result.edges).toHaveLength(1);
    expect(result.clusters).toEqual([['a', 'b']]);
    expect(result.isolated).toEqual(['c']);
    expect(result.degree.a).toBe(1);
  });
});
