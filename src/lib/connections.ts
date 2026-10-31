import type { Entry } from './types';

/**
 * 星标条目的「自动联系」：
 * 不依赖人工连线，按共享主题 / 标签 / 类别 / 引用关系 / 同期出现自动算分。
 * 星标越多，联系越密——最终形成一张个人灵感网络。
 */
export interface StarConnection {
  a: string;
  b: string;
  score: number;
  reasons: string[];
}

export interface StarConnectionResult {
  edges: StarConnection[];
  degree: Record<string, number>;
  clusters: string[][];
  isolated: string[];
}

/** 单个标签太泛，不参与计分 */
const GENERIC_TAGS = new Set(['AI', 'ai', '国内', '海外']);

function shared<T>(left: T[], right: T[]): T[] {
  const rightSet = new Set(right);
  return [...new Set(left)].filter((item) => rightSet.has(item));
}

function dayDistance(left: string, right: string): number {
  const a = Date.parse(`${left}T00:00:00Z`);
  const b = Date.parse(`${right}T00:00:00Z`);
  if (Number.isNaN(a) || Number.isNaN(b)) return Number.POSITIVE_INFINITY;
  return Math.abs(a - b) / 86_400_000;
}

/** 计算两条星标条目之间的联系强度与理由；score ≥ 2 才认为有联系 */
export function connectionBetween(left: Entry, right: Entry): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 0;

  const sharesRelation =
    left.relations.some((relation) => relation.to === right.id) ||
    right.relations.some((relation) => relation.to === left.id);
  if (sharesRelation) {
    score += 4;
    reasons.push('条目之间已有引用/影响关系');
  }

  if (left.thought_chain && left.thought_chain === right.thought_chain) {
    score += 3;
    reasons.push('属于同一思想主题');
  }

  const sharedTags = shared(left.tags, right.tags).filter((tag) => !GENERIC_TAGS.has(tag));
  if (sharedTags.length > 0) {
    score += Math.min(6, sharedTags.length * 2);
    reasons.push(`共同标签：${sharedTags.slice(0, 3).join('、')}`);
  }

  const sharedCategories = shared(left.categories, right.categories);
  if (sharedCategories.length > 0) {
    score += 1;
    reasons.push(`同类别：${sharedCategories.slice(0, 2).join('、')}`);
  }

  const gap = dayDistance(left.date, right.date);
  if (gap <= 90) {
    score += 1;
    reasons.push('同期出现（90 天内）');
  }

  return { score, reasons };
}

/** 计算所有星标条目之间的自动联系、连通簇与孤立点 */
export function buildStarConnections(entries: readonly Entry[], ids: readonly string[]): StarConnectionResult {
  const byId = new Map(entries.map((entry) => [entry.id, entry]));
  const nodes = ids.filter((id) => byId.has(id));
  const edges: StarConnection[] = [];

  for (let i = 0; i < nodes.length; i += 1) {
    for (let j = i + 1; j < nodes.length; j += 1) {
      const left = byId.get(nodes[i]);
      const right = byId.get(nodes[j]);
      if (!left || !right) continue;
      const { score, reasons } = connectionBetween(left, right);
      if (score >= 2) edges.push({ a: left.id, b: right.id, score, reasons });
    }
  }

  const degree: Record<string, number> = {};
  for (const edge of edges) {
    degree[edge.a] = (degree[edge.a] ?? 0) + 1;
    degree[edge.b] = (degree[edge.b] ?? 0) + 1;
  }

  // 并查集找连通簇
  const parent = new Map<string, string>(nodes.map((id) => [id, id]));
  const find = (id: string): string => {
    let current = id;
    while (parent.get(current) !== current) current = parent.get(current) as string;
    return current;
  };
  for (const edge of edges) {
    const rootA = find(edge.a);
    const rootB = find(edge.b);
    if (rootA !== rootB) parent.set(rootA, rootB);
  }
  const groups = new Map<string, string[]>();
  for (const id of nodes) {
    const root = find(id);
    const list = groups.get(root) ?? [];
    list.push(id);
    groups.set(root, list);
  }
  const clusters = [...groups.values()].filter((group) => group.length > 1);
  const isolated = [...groups.values()].filter((group) => group.length === 1).map(([id]) => id);

  return { edges: edges.sort((a, b) => b.score - a.score), degree, clusters, isolated };
}

/** 轻量力导向布局：返回画布坐标（确定性，无第三方依赖） */
export function layoutStarGraph(
  ids: readonly string[],
  edges: readonly StarConnection[],
  width: number,
  height: number,
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();
  const count = ids.length;
  if (count === 0) return positions;

  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(width, height) * 0.32;

  ids.forEach((id, index) => {
    const angle = (Math.PI * 2 * index) / count - Math.PI / 2;
    const jitter = 0.15 + ((index % 3) * 0.06);
    positions.set(id, {
      x: cx + Math.cos(angle) * radius * (1 + jitter * 0.4),
      y: cy + Math.sin(angle) * radius * (1 + jitter * 0.4),
    });
  });

  const iterations = 240;
  for (let step = 0; step < iterations; step += 1) {
    const alpha = 1 - step / iterations;
    // 斥力
    for (let i = 0; i < count; i += 1) {
      for (let j = i + 1; j < count; j += 1) {
        const p = positions.get(ids[i]) as { x: number; y: number };
        const q = positions.get(ids[j]) as { x: number; y: number };
        let dx = p.x - q.x;
        let dy = p.y - q.y;
        let dist = Math.hypot(dx, dy);
        if (dist < 0.01) {
          dx = (i % 2 === 0 ? 1 : -1) * 0.5;
          dy = 0.5;
          dist = 0.7;
        }
        const force = (2600 * alpha) / (dist * dist);
        const ux = (dx / dist) * force;
        const uy = (dy / dist) * force;
        p.x += ux;
        p.y += uy;
        q.x -= ux;
        q.y -= uy;
      }
    }
    // 引力（有联系的节点互相靠近）
    for (const edge of edges) {
      const p = positions.get(edge.a);
      const q = positions.get(edge.b);
      if (!p || !q) continue;
      const dx = q.x - p.x;
      const dy = q.y - p.y;
      const dist = Math.max(1, Math.hypot(dx, dy));
      const force = (dist - 150) * 0.012 * Math.min(1.6, edge.score / 4) * alpha;
      const ux = (dx / dist) * force;
      const uy = (dy / dist) * force;
      p.x += ux;
      p.y += uy;
      q.x -= ux;
      q.y -= uy;
    }
    // 向心力 + 边界
    for (const id of ids) {
      const point = positions.get(id) as { x: number; y: number };
      point.x += (cx - point.x) * 0.006;
      point.y += (cy - point.y) * 0.006;
      point.x = Math.max(40, Math.min(width - 40, point.x));
      point.y = Math.max(30, Math.min(height - 30, point.y));
    }
  }

  return positions;
}
