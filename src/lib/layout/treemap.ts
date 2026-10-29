/**
 * 纯函数 treemap 布局（时间轴年份列内部使用）。
 *
 * 设计约束（见 docs/DECISIONS.md §4/§6.1）：
 * - 输入 weight（importance）→ 输出矩形面积严格正比；
 * - 输入先按 weight 降序排序，保证重要块靠左上（符合阅读顺序）；
 * - 支持块间距 gap：布局完成后对每个 rect 做内缩（每边 gap/2），
 *   因此 gap:0 时面积守恒（误差仅浮点级），gap>0 时面积损失是预期行为；
 * - 空数组 / 全 0 / 非正值 weight → 返回空数组，不抛错；
 * - 极小尺寸安全：任何输出 w/h 都 ≥ 0，不会出现负数或 NaN。
 */
import { hierarchy, treemap, treemapSquarify, type HierarchyRectangularNode } from 'd3-hierarchy';

export interface TreemapItem {
  /** 条目 id（原样回传） */
  id: string;
  /** 权重（时间轴上是 importance，必须 > 0 才占面积） */
  weight: number;
}

export interface TreemapRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface TreemapPlacement {
  id: string;
  rect: TreemapRect;
}

export interface TreemapOptions {
  /** 相邻块之间的间距（px）。默认 0（面积守恒可用于测试） */
  gap?: number;
}

interface LeafDatum {
  id: string;
  weight: number;
}

interface RootDatum {
  children: LeafDatum[];
}

type LayoutDatum = RootDatum | LeafDatum;

function nonNegative(value: number): number {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

/**
 * 把 items 排布到 area 内。
 * - 仅 weight > 0 且有限的 item 参与布局（其余不占面积，不会出现在输出中）；
 * - 输出顺序 = weight 降序（与 d3 squarify 的遍历顺序一致）。
 */
export function layoutTreemap(
  items: readonly TreemapItem[],
  area: TreemapRect,
  options: TreemapOptions = {},
): TreemapPlacement[] {
  const gap = nonNegative(options.gap ?? 0);
  const width = nonNegative(area.w);
  const height = nonNegative(area.h);

  if (items.length === 0) return [];

  const sorted = items
    .filter((item) => Number.isFinite(item.weight) && item.weight > 0)
    .map((item) => ({ id: item.id, weight: item.weight }))
    .sort((a, b) => b.weight - a.weight);

  if (sorted.length === 0 || width === 0 || height === 0) return [];

  const root = hierarchy<LayoutDatum>({ children: sorted }, (datum) =>
    'children' in datum ? datum.children : undefined,
  )
    .sum((datum) => ('weight' in datum ? datum.weight : 0))
    .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

  treemap<LayoutDatum>()
    .tile(treemapSquarify)
    .size([width, height])
    .paddingInner(0)
    .paddingOuter(0)(root);

  // 叶子节点必然是 LeafDatum（根是唯一的非叶子），断言安全。
  const leaves = root.leaves() as HierarchyRectangularNode<LeafDatum>[];
  const inset = gap / 2;

  return leaves.map((leaf) => {
    let x = leaf.x0;
    let y = leaf.y0;
    let w = leaf.x1 - leaf.x0;
    let h = leaf.y1 - leaf.y0;

    if (gap > 0) {
      x += inset;
      y += inset;
      w = Math.max(0, w - gap);
      h = Math.max(0, h - gap);
    }

    return {
      id: leaf.data.id,
      rect: {
        x: area.x + Math.max(0, x),
        y: area.y + Math.max(0, y),
        w: Math.max(0, w),
        h: Math.max(0, h),
      },
    };
  });
}
