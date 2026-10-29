import { describe, expect, it } from 'vitest';
import type { Category, GraphEdge, GraphNode, RelationType } from '../types';
import {
  DEFAULT_PADDING_X,
  DEFAULT_WORLD_HEIGHT,
  DEFAULT_WORLD_WIDTH,
  getFocusChains,
  layoutFocusGraph,
  layoutGlobalGraph,
  nodeDiameter,
} from './graph-layout';

function makeNode(
  id: string,
  date: string,
  importance: number,
  categories: Category[] = ['model'],
): GraphNode {
  return {
    id,
    title: `节点 ${id}`,
    date,
    year: Number(date.slice(0, 4)),
    importance,
    categories,
    type: 'event',
    nodeKind: 'model',
  };
}

function makeEdge(source: string, target: string, type: RelationType = '基于'): GraphEdge {
  return { source, target, type, direction: 'backward', bidirectional: false };
}

/** 玩具图：a→b→c→d→e，c→f，f→g */
function toyGraph(): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const nodes = [
    makeNode('a', '2012-03-01', 9, ['architecture']),
    makeNode('b', '2014-05-01', 8, ['architecture']),
    makeNode('c', '2016-07-01', 10, ['architecture']),
    makeNode('d', '2017-02-01', 7, ['model']),
    makeNode('e', '2018-09-01', 6, ['model']),
    makeNode('f', '2018-11-01', 5, ['alignment']),
    makeNode('g', '2020-04-01', 8, ['product']),
  ];
  const edges = [
    makeEdge('a', 'b'),
    makeEdge('b', 'c'),
    makeEdge('c', 'd'),
    makeEdge('d', 'e', '启发'),
    makeEdge('c', 'f', '竞争'),
    makeEdge('f', 'g'),
  ];
  return { nodes, edges };
}

describe('nodeDiameter', () => {
  it('随 importance 线性增长并落在合理范围', () => {
    expect(nodeDiameter(1)).toBeCloseTo(15.4, 5);
    expect(nodeDiameter(10)).toBeCloseTo(46, 5);
    expect(nodeDiameter(100)).toBeCloseTo(nodeDiameter(10), 5);
    expect(nodeDiameter(0)).toBeCloseTo(nodeDiameter(1), 5);
  });
});

describe('layoutGlobalGraph（全局泳道布局）', () => {
  it('空图 / 单节点不抛错', () => {
    const empty = layoutGlobalGraph([], []);
    expect(empty.nodes).toEqual([]);
    expect(empty.links).toEqual([]);
    expect(empty.yearTicks.length).toBeGreaterThan(0);
    expect(empty.yearTicks[0].year).toBe(2012);
    expect(empty.yearTicks[empty.yearTicks.length - 1].year).toBe(2026);

    const single = layoutGlobalGraph([makeNode('solo', '2018-01-01', 5)], []);
    expect(single.nodes).toHaveLength(1);
    expect(Number.isFinite(single.nodes[0].x)).toBe(true);
    expect(Number.isFinite(single.nodes[0].y)).toBe(true);
    expect(single.focus).toBeNull();
  });

  it('所有节点在泳道与世界边界内', () => {
    const { nodes, edges } = toyGraph();
    const layout = layoutGlobalGraph(nodes, edges);
    const laneByCategory = new Map(layout.lanes.map((lane) => [lane.category, lane]));

    for (const item of layout.nodes) {
      const lane = laneByCategory.get(item.node.categories[0])!;
      expect(item.x - item.radius).toBeGreaterThanOrEqual(DEFAULT_PADDING_X - 1e-6);
      expect(item.x + item.radius).toBeLessThanOrEqual(DEFAULT_WORLD_WIDTH - DEFAULT_PADDING_X + 1e-6);
      expect(item.y - item.radius).toBeGreaterThanOrEqual(lane.top - 1e-6);
      expect(item.y + item.radius).toBeLessThanOrEqual(lane.bottom + 1e-6);
    }
  });

  it('同泳道节点不重叠（碰撞松弛生效）', () => {
    // 6 个同类别、同一天的节点：不松弛一定会叠在一起
    const crowded: GraphNode[] = Array.from({ length: 6 }, (_, index) =>
      makeNode(`crowded-${index}`, '2016-07-01', 5 + index, ['model']),
    );
    const layout = layoutGlobalGraph(crowded, []);
    const sameLane = layout.nodes.filter((item) => item.node.categories[0] === 'model');
    expect(sameLane).toHaveLength(6);
    for (let a = 0; a < sameLane.length; a += 1) {
      for (let b = a + 1; b < sameLane.length; b += 1) {
        const first = sameLane[a];
        const second = sameLane[b];
        const distance = Math.hypot(first.x - second.x, first.y - second.y);
        expect(distance).toBeGreaterThanOrEqual(first.radius + second.radius + 5.5);
      }
    }
  });

  it('100+ 节点压力：同泳道任意两圆至少留 6px 间距', () => {
    let seed = 7;
    const random = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;
    const categories: Category[] = ['model', 'opensource', 'multimodal', 'product', 'alignment'];
    const crowded: GraphNode[] = Array.from({ length: 110 }, (_, index) => {
      const year = 2022 + Math.floor(random() * 5);
      const month = String(1 + Math.floor(random() * 12)).padStart(2, '0');
      const day = String(1 + Math.floor(random() * 28)).padStart(2, '0');
      const category = categories[Math.floor(random() * categories.length)];
      return makeNode(`stress-${index}`, `${year}-${month}-${day}`, 5 + Math.floor(random() * 6), [category]);
    });
    const layout = layoutGlobalGraph(crowded, []);
    const byLane = new Map<Category, typeof layout.nodes>();
    for (const item of layout.nodes) {
      const list = byLane.get(item.node.categories[0]) ?? [];
      list.push(item);
      byLane.set(item.node.categories[0], list);
    }
    for (const list of byLane.values()) {
      for (let a = 0; a < list.length; a += 1) {
        for (let b = a + 1; b < list.length; b += 1) {
          const first = list[a];
          const second = list[b];
          const distance = Math.hypot(first.x - second.x, first.y - second.y);
          expect(distance).toBeGreaterThanOrEqual(first.radius + second.radius + 5.5);
        }
      }
    }
  });

  it('确定性：同输入同输出', () => {
    const { nodes, edges } = toyGraph();
    const first = layoutGlobalGraph(nodes, edges);
    const second = layoutGlobalGraph(nodes, edges);
    expect(first.nodes.map((item) => [item.node.id, item.x, item.y])).toEqual(
      second.nodes.map((item) => [item.node.id, item.x, item.y]),
    );
    expect(first.yearTicks).toEqual(second.yearTicks);
  });

  it('日期越晚 x 越大；年份刻度单调递增', () => {
    const early = layoutGlobalGraph([makeNode('early', '2013-01-01', 5)]);
    const late = layoutGlobalGraph([makeNode('late', '2022-01-01', 5)]);
    expect(early.nodes[0].x).toBeLessThan(late.nodes[0].x);

    const layout = layoutGlobalGraph([], []);
    for (let index = 1; index < layout.yearTicks.length; index += 1) {
      expect(layout.yearTicks[index].x).toBeGreaterThan(layout.yearTicks[index - 1].x);
      expect(layout.yearTicks[index].year).toBe(layout.yearTicks[index - 1].year + 1);
    }
  });

  it('忽略指向不存在节点的边', () => {
    const { nodes, edges } = toyGraph();
    const withDangling = [...edges, makeEdge('a', 'missing-node'), makeEdge('ghost', 'b')];
    const layout = layoutGlobalGraph(nodes, withDangling);
    expect(layout.links).toHaveLength(edges.length);
    expect(layout.links.every((edge) => nodes.some((node) => node.id === edge.source))).toBe(true);
  });
});

describe('getFocusChains（聚焦上下游 BFS）', () => {
  it('玩具图：2 跳上下游集合正确', () => {
    const { nodes, edges } = toyGraph();
    const chains = getFocusChains(nodes, edges, 'c');
    expect(chains.focusNode?.id).toBe('c');
    expect(chains.upstream.map((item) => [item.node.id, item.hop])).toEqual([
      ['b', 1],
      ['a', 2],
    ]);
    expect(chains.downstream.map((item) => [item.node.id, item.hop]).sort()).toEqual(
      [
        ['d', 1],
        ['f', 1],
        ['e', 2],
        ['g', 2],
      ].sort(),
    );
    expect(chains.upstreamCount).toBe(2);
    expect(chains.downstreamCount).toBe(4);
    const g = chains.downstream.find((item) => item.node.id === 'g');
    expect(g?.relationType).toBe('基于');
    expect(g?.viaId).toBe('f');
  });

  it('focus 不存在时返回空闭包', () => {
    const { nodes, edges } = toyGraph();
    const chains = getFocusChains(nodes, edges, 'nope');
    expect(chains.focusNode).toBeNull();
    expect(chains.upstream).toEqual([]);
    expect(chains.downstream).toEqual([]);
    expect(chains.upstreamCount + chains.downstreamCount).toBe(0);
  });

  it('同时出现在上下游的节点只保留更近一侧', () => {
    const nodes = [makeNode('x', '2015-01-01', 8), makeNode('y', '2016-01-01', 7), makeNode('z', '2017-01-01', 6)];
    const edges = [makeEdge('x', 'y'), makeEdge('y', 'z'), makeEdge('x', 'z')];
    const chains = getFocusChains(nodes, edges, 'y');
    expect(chains.upstream.map((item) => item.node.id)).toEqual(['x']);
    expect(chains.downstream.map((item) => item.node.id)).toEqual(['z']);
    expect(chains.downstream[0].relationType).toBe('基于');
  });
});

describe('layoutFocusGraph（聚焦思维导图）', () => {
  it('焦点居中，上游在左、下游在右，层级 x 正确', () => {
    const { nodes, edges } = toyGraph();
    const layout = layoutFocusGraph(nodes, edges, 'c');
    expect(layout.mode).toBe('focus');
    expect(layout.focus?.node.id).toBe('c');
    expect(layout.focus?.x).toBeCloseTo(DEFAULT_WORLD_WIDTH / 2, 5);
    expect(layout.focus?.y).toBeCloseTo(DEFAULT_WORLD_HEIGHT / 2, 5);

    const byId = new Map(layout.nodes.map((item) => [item.node.id, item]));
    expect(byId.get('b')!.x).toBeLessThan(layout.focus!.x);
    expect(byId.get('a')!.x).toBeLessThan(byId.get('b')!.x);
    expect(byId.get('d')!.x).toBeGreaterThan(layout.focus!.x);
    expect(byId.get('g')!.x).toBeGreaterThan(byId.get('f')!.x);
    expect(byId.get('b')!.side).toBe('upstream');
    expect(byId.get('g')!.side).toBe('downstream');
    expect(byId.get('b')!.hop).toBe(1);
    expect(byId.get('a')!.hop).toBe(2);
  });

  it('只保留可见节点及其之间的边', () => {
    const nodes = [
      ...toyGraph().nodes,
      makeNode('unrelated', '2021-01-01', 4, ['org']),
    ];
    const edges = [...toyGraph().edges, makeEdge('unrelated', 'g'), makeEdge('g', 'unrelated')];
    const layout = layoutFocusGraph(nodes, edges, 'c');
    const visibleIds = new Set(layout.nodes.map((item) => item.node.id));
    expect(visibleIds.has('unrelated')).toBe(false);
    expect(layout.links.every((edge) => visibleIds.has(edge.source) && visibleIds.has(edge.target))).toBe(true);
    expect(layout.links).toHaveLength(toyGraph().edges.length);
  });

  it('同层节点纵向不重叠', () => {
    const focusNode = makeNode('hub', '2020-01-01', 10, ['model']);
    const upstreamNodes = Array.from({ length: 6 }, (_, index) =>
      makeNode(`up-${index}`, `201${index}-01-01`, 5 + (index % 3), ['model']),
    );
    const nodes = [focusNode, ...upstreamNodes];
    const edges = upstreamNodes.map((node) => makeEdge(node.id, 'hub'));
    const layout = layoutFocusGraph(nodes, edges, 'hub');
    const layer = layout.nodes.filter((item) => item.side === 'upstream' && item.hop === 1);
    expect(layer).toHaveLength(6);
    for (let a = 0; a < layer.length; a += 1) {
      for (let b = a + 1; b < layer.length; b += 1) {
        const distance = Math.hypot(layer[a].x - layer[b].x, layer[a].y - layer[b].y);
        expect(distance).toBeGreaterThanOrEqual(layer[a].radius + layer[b].radius - 1e-6);
      }
    }
  });

  it('focus 不存在时返回空布局而非抛错', () => {
    const { nodes, edges } = toyGraph();
    const layout = layoutFocusGraph(nodes, edges, 'missing');
    expect(layout.focus).toBeNull();
    expect(layout.nodes).toEqual([]);
    expect(layout.links).toEqual([]);
    expect(layout.chains?.focusNode).toBeNull();
  });

  it('单节点聚焦不抛错且无连线', () => {
    const solo = makeNode('solo', '2019-01-01', 6);
    const layout = layoutFocusGraph([solo], [], 'solo');
    expect(layout.nodes).toHaveLength(1);
    expect(layout.links).toEqual([]);
    expect(layout.focus?.node.id).toBe('solo');
  });

  it('确定性：同输入同输出', () => {
    const { nodes, edges } = toyGraph();
    const first = layoutFocusGraph(nodes, edges, 'c');
    const second = layoutFocusGraph(nodes, edges, 'c');
    expect(first.nodes.map((item) => [item.node.id, item.x, item.y])).toEqual(
      second.nodes.map((item) => [item.node.id, item.x, item.y]),
    );
  });
});
