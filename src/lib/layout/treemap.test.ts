import { describe, expect, it } from 'vitest';
import { layoutTreemap, type TreemapItem, type TreemapRect } from './treemap';

const AREA: TreemapRect = { x: 0, y: 0, w: 800, h: 400 };
const AREA_OFFSET: TreemapRect = { x: 17, y: 23, w: 640, h: 360 };

const ITEMS: TreemapItem[] = [
  { id: 'a', weight: 10 },
  { id: 'b', weight: 9 },
  { id: 'c', weight: 8 },
  { id: 'd', weight: 7 },
  { id: 'e', weight: 6 },
  { id: 'f', weight: 5 },
  { id: 'g', weight: 4 },
  { id: 'h', weight: 3 },
  { id: 'i', weight: 2 },
  { id: 'j', weight: 1 },
];

function sumArea(rects: { rect: TreemapRect }[]): number {
  return rects.reduce((total, { rect }) => total + rect.w * rect.h, 0);
}

function expectFiniteNonNegative(rect: TreemapRect): void {
  for (const value of [rect.x, rect.y, rect.w, rect.h]) {
    expect(Number.isFinite(value)).toBe(true);
  }
  expect(rect.w).toBeGreaterThanOrEqual(0);
  expect(rect.h).toBeGreaterThanOrEqual(0);
}

describe('layoutTreemap', () => {
  it('gap:0 时面积守恒（误差 < 0.5%）', () => {
    const placements = layoutTreemap(ITEMS, AREA);
    expect(placements).toHaveLength(ITEMS.length);
    expect(sumArea(placements)).toBeCloseTo(AREA.w * AREA.h, 6);

    const relativeError = Math.abs(sumArea(placements) - AREA.w * AREA.h) / (AREA.w * AREA.h);
    expect(relativeError).toBeLessThan(0.005);
  });

  it('带偏移区域时面积守恒且所有 rect 位于区域内', () => {
    const placements = layoutTreemap(ITEMS, AREA_OFFSET);
    expect(sumArea(placements)).toBeCloseTo(AREA_OFFSET.w * AREA_OFFSET.h, 6);

    for (const { rect } of placements) {
      expectFiniteNonNegative(rect);
      expect(rect.x).toBeGreaterThanOrEqual(AREA_OFFSET.x - 1e-6);
      expect(rect.y).toBeGreaterThanOrEqual(AREA_OFFSET.y - 1e-6);
      expect(rect.x + rect.w).toBeLessThanOrEqual(AREA_OFFSET.x + AREA_OFFSET.w + 1e-6);
      expect(rect.y + rect.h).toBeLessThanOrEqual(AREA_OFFSET.y + AREA_OFFSET.h + 1e-6);
    }
  });

  it('输出按 weight 降序，且最重块在左上角', () => {
    const placements = layoutTreemap(ITEMS, AREA);
    const byId = new Map(ITEMS.map((item) => [item.id, item.weight]));
    const weights = placements.map((placement) => byId.get(placement.id) ?? 0);

    expect(weights).toEqual([...weights].sort((a, b) => b - a));
    expect(placements[0].id).toBe('a');

    // 左/上优先级：最重块紧贴原点（squarify 的首块）
    expect(placements[0].rect.x).toBeCloseTo(AREA.x, 6);
    expect(placements[0].rect.y).toBeCloseTo(AREA.y, 6);
  });

  it('空数组 / 全 0 weight 返回空数组，不抛错', () => {
    expect(layoutTreemap([], AREA)).toEqual([]);
    expect(
      layoutTreemap(
        [
          { id: 'x', weight: 0 },
          { id: 'y', weight: 0 },
        ],
        AREA,
      ),
    ).toEqual([]);
    expect(
      layoutTreemap(
        [
          { id: 'x', weight: Number.NaN },
          { id: 'y', weight: -3 },
        ],
        AREA,
      ),
    ).toEqual([]);
  });

  it('单个 item 填满整个区域', () => {
    const [placement] = layoutTreemap([{ id: 'only', weight: 7 }], AREA);
    expect(placement.id).toBe('only');
    expect(placement.rect.x).toBeCloseTo(AREA.x, 6);
    expect(placement.rect.y).toBeCloseTo(AREA.y, 6);
    expect(placement.rect.w).toBeCloseTo(AREA.w, 6);
    expect(placement.rect.h).toBeCloseTo(AREA.h, 6);
  });

  it('极小尺寸 + gap 不产生负数或 NaN', () => {
    const tiny: TreemapRect = { x: 5, y: 7, w: 3, h: 2 };
    const many: TreemapItem[] = Array.from({ length: 30 }, (_, index) => ({
      id: `tiny-${index}`,
      weight: index + 1,
    }));

    for (const gap of [0, 1, 2.5, 8]) {
      const placements = layoutTreemap(many, tiny, { gap });
      expect(placements).toHaveLength(many.length);
      for (const { rect } of placements) {
        expectFiniteNonNegative(rect);
      }
    }
  });

  it('gap 产生间距：面积小于输入面积且互不重叠', () => {
    const placements = layoutTreemap(ITEMS, AREA, { gap: 3 });
    const areaWithGap = sumArea(placements);
    expect(areaWithGap).toBeGreaterThan(0);
    expect(areaWithGap).toBeLessThan(AREA.w * AREA.h);

    for (let i = 0; i < placements.length; i += 1) {
      for (let j = i + 1; j < placements.length; j += 1) {
        const a = placements[i].rect;
        const b = placements[j].rect;
        const overlaps =
          a.x < b.x + b.w - 1e-6 && b.x < a.x + a.w - 1e-6 && a.y < b.y + b.h - 1e-6 && b.y < a.y + a.h - 1e-6;
        expect(overlaps).toBe(false);
      }
    }
  });

  it('面积为 0 的区域返回空数组', () => {
    expect(layoutTreemap(ITEMS, { x: 0, y: 0, w: 0, h: 400 })).toEqual([]);
    expect(layoutTreemap(ITEMS, { x: 0, y: 0, w: 800, h: 0 })).toEqual([]);
  });
});
