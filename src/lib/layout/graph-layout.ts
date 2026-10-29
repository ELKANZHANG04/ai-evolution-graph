/**
 * 影响图谱布局（纯函数，可单测）。
 *
 * 两种模式：
 * - global：x = 日期线性映射到 [80, 1520]（顶部年份刻度 2012…2026+），
 *           y = 10 条类别泳道（顺序固定为 CATEGORY_ORDER），同泳道节点做碰撞松弛；
 * - focus：思维导图模式。中心节点居中，上游沿边反向 BFS 2 跳、下游正向 BFS 2 跳，
 *           上游向左 / 下游向右分层（x = 中心 ± 260 / ± 470），同层按 importance/日期纵向铺开并松弛。
 *
 * 世界坐标固定 1600×900（可在 options 覆盖），不依赖浏览器/DOM，同输入必得同输出。
 */
import type { Category, GraphEdge, GraphNode, RelationType } from '../types';
import { CATEGORY_ORDER } from '../../theme/categories';

export const DEFAULT_WORLD_WIDTH = 1600;
export const DEFAULT_WORLD_HEIGHT = 1100;
/** 顶部年份刻度区高度（泳道从 laneTop 开始） */
export const DEFAULT_LANE_TOP = 96;
/** 左右留白：日期映射到 [paddingX, width - paddingX] */
export const DEFAULT_PADDING_X = 80;
export const NODE_BASE_DIAMETER = 10;
export const NODE_SIZE_PER_IMPORTANCE = 3.0;
/** 同泳道节点碰撞留白（世界坐标 px） */
const COLLISION_GAP = 6;
/** 松弛阶段允许的最大横向漂移（世界坐标 px）：先小范围，残余重叠再扩大 */
const COLLISION_X_DRIFT = 320;
const COLLISION_X_DRIFT_MAX = 640;
/** 聚焦模式层级横向间距 */
export const FOCUS_LAYER_GAP = [260, 470] as const;
/** 聚焦模式纵向可用范围（相对世界高度） */
const FOCUS_Y_MARGIN = 80;

export interface GraphLayoutOptions {
  width?: number;
  height?: number;
  laneTop?: number;
  paddingX?: number;
  /** 年份刻度起始年（缺省取 min(2012, 数据最早年)） */
  startYear?: number;
  /** 年份刻度结束年（缺省取 max(2026, 数据最晚年)） */
  endYear?: number;
}

export type FocusSide = 'upstream' | 'downstream' | 'focus' | 'none';

export interface PositionedNode {
  node: GraphNode;
  x: number;
  y: number;
  diameter: number;
  radius: number;
  /** 聚焦模式：-2/-1 = 上游跳数，1/2 = 下游跳数，0 = 中心 */
  hop: number;
  side: FocusSide;
}

export interface GraphLane {
  category: Category;
  index: number;
  top: number;
  bottom: number;
  centerY: number;
  height: number;
}

export interface YearTick {
  year: number;
  x: number;
}

export interface FocusChainItem {
  node: GraphNode;
  hop: number;
  /** 发现该节点时经过的关系类型（用于列表 chip） */
  relationType: RelationType | null;
  /** 上一跳节点 id（focus 为 null） */
  viaId: string | null;
}

export interface FocusChains {
  focusNode: GraphNode | null;
  upstream: FocusChainItem[];
  downstream: FocusChainItem[];
  upstreamCount: number;
  downstreamCount: number;
}

export interface GraphLayout {
  mode: 'global' | 'focus';
  width: number;
  height: number;
  laneTop: number;
  paddingX: number;
  lanes: GraphLane[];
  yearTicks: YearTick[];
  nodes: PositionedNode[];
  nodeById: Map<string, PositionedNode>;
  /** 只在可见节点之间的边（global 模式为全部有效边） */
  links: GraphEdge[];
  focus: PositionedNode | null;
  chains: FocusChains | null;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function resolveOptions(options: GraphLayoutOptions = {}) {
  const width = options.width ?? DEFAULT_WORLD_WIDTH;
  const height = options.height ?? DEFAULT_WORLD_HEIGHT;
  const laneTop = options.laneTop ?? DEFAULT_LANE_TOP;
  const paddingX = options.paddingX ?? DEFAULT_PADDING_X;
  return { width, height, laneTop, paddingX };
}

/** 稳定、跨平台一致的字符串哈希（FNV-1a 32bit） */
function hashString(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function hashUnit(value: string): number {
  return hashString(value) / 4294967295;
}

function nodeYear(node: GraphNode): number {
  if (Number.isFinite(node.year)) return node.year;
  const parsed = Number(String(node.date).slice(0, 4));
  return Number.isFinite(parsed) ? parsed : 2012;
}

function dateToTimestamp(date: string, fallbackYear: number): number {
  const parsed = Date.parse(`${date}T00:00:00Z`);
  if (Number.isFinite(parsed)) return parsed;
  return Date.UTC(fallbackYear, 0, 1);
}

export function nodeDiameter(importance: number): number {
  const clamped = clamp(Number.isFinite(importance) ? importance : 1, 1, 10);
  return NODE_BASE_DIAMETER + clamped * NODE_SIZE_PER_IMPORTANCE;
}

/** 依据节点年份（并保底 2012–2026）计算年份刻度域 */
function resolveYearDomain(nodes: GraphNode[], options: GraphLayoutOptions) {
  let minYear = Number.POSITIVE_INFINITY;
  let maxYear = Number.NEGATIVE_INFINITY;
  for (const node of nodes) {
    const year = nodeYear(node);
    if (year < minYear) minYear = year;
    if (year > maxYear) maxYear = year;
  }
  if (!Number.isFinite(minYear)) minYear = 2012;
  if (!Number.isFinite(maxYear)) maxYear = 2026;
  const startYear = options.startYear ?? Math.min(2012, minYear);
  const endYear = options.endYear ?? Math.max(2026, maxYear);
  return { startYear, endYear };
}

interface DateAxis {
  startYear: number;
  endYear: number;
  domainStart: number;
  domainEnd: number;
  paddingX: number;
  width: number;
}

function createDateAxis(nodes: GraphNode[], options: GraphLayoutOptions, width: number, paddingX: number): DateAxis {
  const { startYear, endYear } = resolveYearDomain(nodes, options);
  return {
    startYear,
    endYear,
    domainStart: Date.UTC(startYear, 0, 1),
    domainEnd: Date.UTC(endYear, 11, 31),
    paddingX,
    width,
  };
}

function axisX(axis: DateAxis, timestamp: number): number {
  const span = axis.domainEnd - axis.domainStart;
  const ratio = span > 0 ? (timestamp - axis.domainStart) / span : 0;
  return axis.paddingX + clamp(ratio, 0, 1) * (axis.width - axis.paddingX * 2);
}

function buildYearTicks(axis: DateAxis): YearTick[] {
  const ticks: YearTick[] = [];
  for (let year = axis.startYear; year <= axis.endYear; year += 1) {
    ticks.push({ year, x: axisX(axis, Date.UTC(year, 0, 1)) });
  }
  return ticks;
}

function buildLanes(height: number, laneTop: number): GraphLane[] {
  const laneHeight = (height - laneTop) / CATEGORY_ORDER.length;
  return CATEGORY_ORDER.map((category, index) => ({
    category,
    index,
    top: laneTop + laneHeight * index,
    bottom: laneTop + laneHeight * (index + 1),
    centerY: laneTop + laneHeight * (index + 0.5),
    height: laneHeight,
  }));
}

/**
 * 同泳道碰撞松弛：把互相重叠的节点推开并 clamp 回泳道 / 世界边界；确定性（无随机数）。
 * 两阶段：先沿 y 为主（保持时间 x 语义）迭代，再对仍有残余重叠的节点沿 x 兜底分离。
 */
function relaxSameLane(
  positioned: PositionedNode[],
  laneOf: Map<string, GraphLane>,
  worldWidth: number,
  paddingX: number,
  iterations = 140,
): void {
  const lanes = new Map<number, PositionedNode[]>();
  for (const item of positioned) {
    const lane = laneOf.get(item.node.id);
    if (!lane) continue;
    const list = lanes.get(lane.index) ?? [];
    list.push(item);
    lanes.set(lane.index, list);
  }

  const initialX = new Map(positioned.map((item) => [item.node.id, item.x]));
  let driftLimit = COLLISION_X_DRIFT;
  const clampItem = (item: PositionedNode) => {
    const lane = laneOf.get(item.node.id);
    if (!lane) return;
    const originX = initialX.get(item.node.id) ?? item.x;
    item.x = clamp(item.x, paddingX + item.radius, worldWidth - paddingX - item.radius);
    item.x = clamp(item.x, originX - driftLimit, originX + driftLimit);
    item.y = clamp(item.y, lane.top + item.radius + 2, lane.bottom - item.radius - 2);
  };

  // 阶段 1：y 为主，x 轻微跟随
  for (let iteration = 0; iteration < iterations; iteration += 1) {
    let moved = false;
    for (const list of lanes.values()) {
      for (let aIndex = 0; aIndex < list.length; aIndex += 1) {
        for (let bIndex = aIndex + 1; bIndex < list.length; bIndex += 1) {
          const a = list[aIndex];
          const b = list[bIndex];
          const minDistance = a.radius + b.radius + COLLISION_GAP;
          let dx = b.x - a.x;
          let dy = b.y - a.y;
          let distance = Math.hypot(dx, dy);
          if (distance >= minDistance) continue;

          if (distance < 1e-3) {
            const angle = (hashString(`${a.node.id}|${b.node.id}`) % 360) * (Math.PI / 180);
            dx = Math.cos(angle);
            dy = Math.sin(angle);
            distance = 1;
          }
          const overlap = (minDistance - distance) / 2 + 0.05;
          const ux = dx / distance;
          const uy = dy / distance;
          a.x -= ux * overlap * 0.4;
          a.y -= uy * overlap;
          b.x += ux * overlap * 0.4;
          b.y += uy * overlap;
          moved = true;
        }
      }
    }
    for (const item of positioned) clampItem(item);
    if (!moved) break;
  }

  // 阶段 2：仍有重叠时沿 x 兜底分离（横向空间比泳道高度充裕）
  driftLimit = COLLISION_X_DRIFT_MAX;
  for (let pass = 0; pass < 900; pass += 1) {
    let anyOverlap = false;
    for (const list of lanes.values()) {
      for (let aIndex = 0; aIndex < list.length; aIndex += 1) {
        for (let bIndex = aIndex + 1; bIndex < list.length; bIndex += 1) {
          const a = list[aIndex];
          const b = list[bIndex];
          const minDistance = a.radius + b.radius + COLLISION_GAP;
          const distance = Math.hypot(b.x - a.x, b.y - a.y);
          if (distance >= minDistance) continue;
          anyOverlap = true;
          const overlap = minDistance - distance;
          const direction = hashUnit(`${a.node.id}|${b.node.id}`) > 0.5 ? 1 : -1;
          a.x -= direction * overlap * 0.5;
          b.x += direction * overlap * 0.5;
          clampItem(a);
          clampItem(b);
        }
      }
    }
    if (!anyOverlap) break;
  }

  // 阶段 3：严格兜底——泳道内按 x 排序后贪心重排，保证任意两圆至少留出 COLLISION_GAP。
  // （y 已在泳道内用满；x 空间充裕，必要时允许节点在泳道内横向让位）
  const minLeft = paddingX;
  const maxRight = worldWidth - paddingX;
  for (const list of lanes.values()) {
    if (list.length <= 1) continue;
    for (let pass = 0; pass < 60; pass += 1) {
      list.sort((a, b) => a.x - b.x || a.node.id.localeCompare(b.node.id));
      let changed = false;
      for (let index = 0; index < list.length; index += 1) {
        const item = list[index];
        for (let earlierIndex = 0; earlierIndex < index; earlierIndex += 1) {
          const earlier = list[earlierIndex];
          const dy = Math.abs(item.y - earlier.y);
          const minDistance = item.radius + earlier.radius + COLLISION_GAP;
          if (dy >= minDistance) continue;
          const neededDx = Math.sqrt(minDistance * minDistance - dy * dy);
          const dx = item.x - earlier.x;
          if (dx < neededDx) {
            item.x = earlier.x + neededDx;
            changed = true;
          }
        }
      }
      // 收回世界边界内（必要时整条泳道平移）
      let minX = Number.POSITIVE_INFINITY;
      let maxX = Number.NEGATIVE_INFINITY;
      for (const item of list) {
        minX = Math.min(minX, item.x - item.radius);
        maxX = Math.max(maxX, item.x + item.radius);
      }
      const shiftLeft = minX < minLeft ? minLeft - minX : maxX > maxRight ? maxRight - maxX : 0;
      if (shiftLeft !== 0) {
        for (const item of list) item.x += shiftLeft;
        changed = true;
      }
      for (const item of list) {
        item.x = clamp(item.x, minLeft + item.radius, maxRight - item.radius);
      }
      if (!changed) break;
    }
  }
}

function filterLinks(nodes: readonly GraphNode[], edges: readonly GraphEdge[]): GraphEdge[] {
  const ids = new Set(nodes.map((node) => node.id));
  return edges.filter((edge) => ids.has(edge.source) && ids.has(edge.target));
}

/** 全局模式：时间轴泳道布局 */
export function layoutGlobalGraph(
  nodes: readonly GraphNode[],
  edges: readonly GraphEdge[] = [],
  options: GraphLayoutOptions = {},
): GraphLayout {
  const { width, height, laneTop, paddingX } = resolveOptions(options);
  const lanes = buildLanes(height, laneTop);
  const axis = createDateAxis([...nodes], options, width, paddingX);
  const yearTicks = buildYearTicks(axis);

  const laneByCategory = new Map(lanes.map((lane) => [lane.category, lane]));
  const laneOf = new Map<string, GraphLane>();
  const positioned: PositionedNode[] = nodes.map((node) => {
    const diameter = nodeDiameter(node.importance);
    const radius = diameter / 2;
    const lane = laneByCategory.get(node.categories[0]) ?? lanes[0];
    laneOf.set(node.id, lane);
    const jitterRange = Math.max(0, lane.height / 2 - radius - 4);
    const jitter = (hashUnit(node.id) * 2 - 1) * jitterRange;
    const x = axisX(axis, dateToTimestamp(node.date, nodeYear(node)));
    const y = clamp(lane.centerY + jitter, lane.top + radius + 2, lane.bottom - radius - 2);
    return {
      node,
      x: clamp(x, paddingX + radius, width - paddingX - radius),
      y,
      diameter,
      radius,
      hop: 0,
      side: 'none',
    };
  });

  relaxSameLane(positioned, laneOf, width, paddingX);

  return {
    mode: 'global',
    width,
    height,
    laneTop,
    paddingX,
    lanes,
    yearTicks,
    nodes: positioned,
    nodeById: new Map(positioned.map((item) => [item.node.id, item])),
    links: filterLinks(nodes, edges),
    focus: null,
    chains: null,
  };
}

/**
 * 收集聚焦节点的上下游闭包（BFS，深度 2）。
 * 上游 = 沿边反向（edge.target === 当前节点 → edge.source）；
 * 下游 = 沿边正向（edge.source === 当前节点 → edge.target）。
 */
export function getFocusChains(
  nodes: readonly GraphNode[],
  edges: readonly GraphEdge[],
  focusId: string,
  depth = 2,
): FocusChains {
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const focusNode = nodeById.get(focusId) ?? null;
  if (!focusNode) {
    return { focusNode: null, upstream: [], downstream: [], upstreamCount: 0, downstreamCount: 0 };
  }

  const upstreamAdjacency = new Map<string, Array<{ id: string; type: RelationType }>>();
  const downstreamAdjacency = new Map<string, Array<{ id: string; type: RelationType }>>();
  for (const edge of edges) {
    if (!nodeById.has(edge.source) || !nodeById.has(edge.target)) continue;
    const upstreamList = upstreamAdjacency.get(edge.target) ?? [];
    upstreamList.push({ id: edge.source, type: edge.type });
    upstreamAdjacency.set(edge.target, upstreamList);
    const downstreamList = downstreamAdjacency.get(edge.source) ?? [];
    downstreamList.push({ id: edge.target, type: edge.type });
    downstreamAdjacency.set(edge.source, downstreamList);
  }

  const traverse = (adjacency: Map<string, Array<{ id: string; type: RelationType }>>): FocusChainItem[] => {
    const items: FocusChainItem[] = [];
    const visited = new Set<string>([focusId]);
    let frontier: Array<{ id: string; hop: number; parentId: string; type: RelationType }> = [
      { id: focusId, hop: 0, parentId: focusId, type: '奠基' },
    ];
    const maxHop = Math.max(1, depth);
    for (let hop = 1; hop <= maxHop; hop += 1) {
      const next: typeof frontier = [];
      for (const current of frontier) {
        for (const neighbour of adjacency.get(current.id) ?? []) {
          if (visited.has(neighbour.id)) continue;
          visited.add(neighbour.id);
          const node = nodeById.get(neighbour.id);
          if (!node) continue;
          items.push({ node, hop, relationType: neighbour.type, viaId: current.id });
          next.push({ id: neighbour.id, hop, parentId: current.id, type: neighbour.type });
        }
      }
      frontier = next;
      if (frontier.length === 0) break;
    }
    return items;
  };

  const upstream = traverse(upstreamAdjacency);
  const downstream = traverse(downstreamAdjacency);

  // 若同一节点同时在上游与下游，保留跳数更近的一侧（并列优先上游）
  const upstreamById = new Map(upstream.map((item) => [item.node.id, item]));
  const filteredDownstream = downstream.filter((item) => {
    const up = upstreamById.get(item.node.id);
    return !up || item.hop < up.hop;
  });
  const downstreamIds = new Set(filteredDownstream.map((item) => item.node.id));
  const filteredUpstream = upstream.filter((item) => {
    if (downstreamIds.has(item.node.id)) return false;
    return true;
  });

  const sortItems = (items: FocusChainItem[]) =>
    [...items].sort(
      (a, b) =>
        a.hop - b.hop ||
        b.node.importance - a.node.importance ||
        a.node.date.localeCompare(b.node.date) ||
        a.node.id.localeCompare(b.node.id),
    );

  const sortedUpstream = sortItems(filteredUpstream);
  const sortedDownstream = sortItems(filteredDownstream);
  return {
    focusNode,
    upstream: sortedUpstream,
    downstream: sortedDownstream,
    upstreamCount: sortedUpstream.length,
    downstreamCount: sortedDownstream.length,
  };
}

function spreadLayerY(count: number, centerY: number, top: number, bottom: number, gapLimit = 150): number[] {
  if (count <= 0) return [];
  const usable = bottom - top;
  const step = count > 1 ? Math.min(gapLimit, usable / (count - 1)) : 0;
  const first = centerY - (step * (count - 1)) / 2;
  return Array.from({ length: count }, (_, index) => first + step * index);
}

/** 聚焦模式：中心 + 上游左 / 下游右的分层思维导图布局 */
export function layoutFocusGraph(
  nodes: readonly GraphNode[],
  edges: readonly GraphEdge[],
  focusId: string,
  options: GraphLayoutOptions = {},
): GraphLayout {
  const { width, height, laneTop, paddingX } = resolveOptions(options);
  const lanes = buildLanes(height, laneTop);
  const axis = createDateAxis([...nodes], options, width, paddingX);
  const yearTicks = buildYearTicks(axis);
  const chains = getFocusChains(nodes, edges, focusId);
  const baseLayout = { width, height, laneTop, paddingX, lanes, yearTicks };

  if (!chains.focusNode) {
    return {
      ...baseLayout,
      mode: 'focus',
      nodes: [],
      nodeById: new Map(),
      links: [],
      focus: null,
      chains,
    };
  }

  const centerX = width / 2;
  const centerY = height / 2;
  const top = FOCUS_Y_MARGIN;
  const bottom = height - FOCUS_Y_MARGIN;
  const positioned: PositionedNode[] = [];

  const place = (node: GraphNode, x: number, y: number, hop: number, side: FocusSide): PositionedNode => {
    const diameter = nodeDiameter(node.importance);
    const radius = diameter / 2;
    return {
      node,
      x: clamp(x, paddingX + radius, width - paddingX - radius),
      y: clamp(y, top + radius, bottom - radius),
      diameter,
      radius,
      hop,
      side,
    };
  };

  positioned.push(place(chains.focusNode, centerX, centerY, 0, 'focus'));

  const layers: Array<{ side: FocusSide; hop: number; items: FocusChainItem[]; x: number }> = [];
  for (const hop of [1, 2]) {
    layers.push({
      side: 'upstream',
      hop,
      items: chains.upstream.filter((item) => item.hop === hop),
      x: centerX - (FOCUS_LAYER_GAP[hop - 1] ?? FOCUS_LAYER_GAP[1]),
    });
  }
  for (const hop of [1, 2]) {
    layers.push({
      side: 'downstream',
      hop,
      items: chains.downstream.filter((item) => item.hop === hop),
      x: centerX + (FOCUS_LAYER_GAP[hop - 1] ?? FOCUS_LAYER_GAP[1]),
    });
  }

  for (const layer of layers) {
    if (layer.items.length === 0) continue;
    const yPositions = spreadLayerY(layer.items.length, centerY, top, bottom);
    layer.items.forEach((item, index) => {
      const x = layer.x;
      const y = yPositions[index] + (hashUnit(item.node.id) * 2 - 1) * 6;
      positioned.push(place(item.node, x, y, layer.hop, layer.side));
    });
  }

  // 同层 / 同侧纵向碰撞松弛（x 固定为层级，只推 y；clamp 在世界内）
  const groups = new Map<string, PositionedNode[]>();
  for (const item of positioned) {
    if (item.side === 'focus') continue;
    const key = `${item.side}:${item.hop}`;
    const list = groups.get(key) ?? [];
    list.push(item);
    groups.set(key, list);
  }
  for (let iteration = 0; iteration < 40; iteration += 1) {
    let moved = false;
    for (const list of groups.values()) {
      for (let aIndex = 0; aIndex < list.length; aIndex += 1) {
        for (let bIndex = aIndex + 1; bIndex < list.length; bIndex += 1) {
          const a = list[aIndex];
          const b = list[bIndex];
          const minDistance = a.radius + b.radius + 10;
          const dy = b.y - a.y;
          if (Math.abs(dy) >= minDistance) continue;
          const direction = dy === 0 ? hashUnit(`${a.node.id}|${b.node.id}`) * 2 - 1 || 1 : Math.sign(dy);
          const overlap = (minDistance - Math.abs(dy)) / 2 + 0.05;
          a.y -= direction * overlap;
          b.y += direction * overlap;
          moved = true;
        }
      }
    }
    for (const item of positioned) {
      item.y = clamp(item.y, top + item.radius, bottom - item.radius);
    }
    if (!moved) break;
  }

  const visibleIds = new Set(positioned.map((item) => item.node.id));
  const links = edges.filter((edge) => visibleIds.has(edge.source) && visibleIds.has(edge.target));
  const focus = positioned.find((item) => item.side === 'focus') ?? null;

  return {
    ...baseLayout,
    mode: 'focus',
    nodes: positioned,
    nodeById: new Map(positioned.map((item) => [item.node.id, item])),
    links,
    focus,
    chains,
  };
}
