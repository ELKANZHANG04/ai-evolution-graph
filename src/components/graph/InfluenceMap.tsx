import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { JSX } from 'react';
import * as echarts from 'echarts/core';
import { GraphChart } from 'echarts/charts';
import { TooltipComponent } from 'echarts/components';
import { LabelLayout } from 'echarts/features';
import { CanvasRenderer } from 'echarts/renderers';
import type { EChartsCoreOption, EChartsType } from 'echarts/core';
import { EmptyState } from '../common/EmptyState';
import {
  FOCUS_LAYER_GAP,
  layoutFocusGraph,
  layoutGlobalGraph,
  type GraphLayout,
  type PositionedNode,
} from '../../lib/layout/graph-layout';
import { formatDate } from '../../lib/format';
import type { Category, GraphEdge, GraphNode, RelationType } from '../../lib/types';
import { CATEGORY_META, categoryColor, categoryLabel, primaryCategory } from '../../theme/categories';
import { importanceLabel } from '../../theme/importance';
import { RELATION_META } from '../../theme/relations';
import './graph.css';

echarts.use([GraphChart, TooltipComponent, CanvasRenderer, LabelLayout]);

export interface InfluenceMapProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  hiddenCategories: Category[];
  selectedId: string | null;
  focusId: string | null;
  onSelect: (entryId: string) => void;
  onFocusChange: (entryId: string | null) => void;
}

const SERIES_ID = 'influence-graph';
const ANCHOR_PREFIX = '__im_anchor__';
/** 单击/双击的判定窗口：双击时取消单击的 onSelect */
const CLICK_DELAY = 230;
/** 拖拽/缩放任结束后的短暂时间内忽略 click，避免 roam 误开抽屉 */
const ROAM_CLICK_GUARD = 260;
const LABEL_MAX_CHARS = 10;

interface LabelStyle {
  show: boolean;
  position: string;
  silent?: boolean;
  color: string;
  fontSize: number;
  fontWeight: number;
  textBorderColor: string;
  textBorderWidth: number;
  distance: number;
}

const LABEL_STYLE: LabelStyle = {
  show: false,
  position: 'right',
  color: '#e6eaf2',
  fontSize: 10.5,
  fontWeight: 500,
  textBorderColor: 'rgba(11, 14, 20, 0.92)',
  textBorderWidth: 2.5,
  distance: 5,
  // 标签不参与命中测试，避免 tooltip 命中“别的节点的标签”
  silent: true,
};

interface ViewTransform {
  scale: number;
  tx: number;
  ty: number;
  width: number;
  height: number;
}

interface Rectangle {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

interface GraphNodeDatum {
  id: string;
  name: string;
  x: number;
  y: number;
  symbolSize: number;
  value: number;
  itemStyle: {
    color: string;
    opacity: number;
    borderColor: string;
    borderWidth: number;
    shadowBlur: number;
    shadowColor: string;
  };
  label: LabelStyle;
  silent?: boolean;
  nodeId?: string;
  fullTitle?: string;
  isAnchor?: boolean;
}

interface GraphLinkDatum {
  source: string;
  target: string;
  symbol: string | string[];
  symbolSize: number | number[];
  lineStyle: {
    color: string;
    type: 'solid' | 'dashed' | 'dotted';
    curveness: number;
    opacity: number;
    width: number;
  };
  linkType?: RelationType;
  sourceTitle?: string;
  targetTitle?: string;
}

interface TooltipParams {
  dataType?: string;
  data?: unknown;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    switch (character) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      default:
        return '&#39;';
    }
  });
}

function labelWeight(char: string): number {
  return /[\u2E80-\u9FFF\uFF00-\uFFEF]/.test(char) ? 1 : 0.5;
}

/** 按“10 个汉字宽度”截断标签（英文约等于 20 字符），避免 Transformer 这类词被硬切。 */
function truncateTitle(title: string, maxWeight = LABEL_MAX_CHARS): string {
  let weight = 0;
  let result = '';
  const chars = [...title];
  for (let index = 0; index < chars.length; index += 1) {
    const charWeight = labelWeight(chars[index]);
    if (weight + charWeight > maxWeight) {
      return `${result}…`;
    }
    weight += charWeight;
    result += chars[index];
  }
  return title;
}

let labelMeasureContext: CanvasRenderingContext2D | null = null;
let labelMeasureFailed = false;
const labelWidthCache = new Map<string, number>();

/** 用 Canvas 实测标签像素宽度（与 ECharts label 的 10.5px/500 对齐） */
function measureLabelWidth(text: string): number {
  const cached = labelWidthCache.get(text);
  if (cached !== undefined) return cached;
  if (!labelMeasureFailed && typeof document !== 'undefined') {
    if (!labelMeasureContext) {
      const context = document.createElement('canvas').getContext('2d');
      if (context) {
        context.font = `500 10.5px ${getComputedStyle(document.body).fontFamily || 'sans-serif'}`;
        labelMeasureContext = context;
      } else {
        labelMeasureFailed = true;
      }
    }
    if (labelMeasureContext) {
      const width = labelMeasureContext.measureText(text).width;
      if (labelWidthCache.size > 20000) labelWidthCache.clear();
      labelWidthCache.set(text, width);
      return width;
    }
  }
  const fallback = [...text].reduce((sum, character) => sum + (/[\u2E80-\u9FFF\uFF00-\uFFEF]/.test(character) ? 10.5 : 5.8), 0);
  labelWidthCache.set(text, fallback);
  return fallback;
}

interface LabelRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/** 估算一个节点标签在「世界坐标」中的矩形 */
function labelRectOf(item: PositionedNode, position: string): LabelRect {
  const width = measureLabelWidth(truncateTitle(item.node.title));
  const height = 14;
  let left: number;
  let top: number;
  if (position === 'left') {
    left = item.x - item.radius - 5 - width;
    top = item.y - height / 2;
  } else if (position === 'bottom') {
    left = item.x - width / 2;
    top = item.y + item.radius + 4;
  } else {
    left = item.x + item.radius + 5;
    top = item.y - height / 2;
  }
  return { left, top, right: left + width, bottom: top + height };
}

function rectsOverlap(a: LabelRect, b: LabelRect, padding = 2): boolean {
  return (
    a.left - padding < b.right && b.left < a.right + padding && a.top - padding < b.bottom && b.top < a.bottom + padding
  );
}

function rectOverlapsNode(rect: LabelRect, item: PositionedNode, padding = 2): boolean {
  return (
    rect.left - padding < item.x + item.radius &&
    item.x - item.radius < rect.right + padding &&
    rect.top - padding < item.y + item.radius &&
    item.y - item.radius < rect.bottom + padding
  );
}

/**
 * 标签防重叠：按重要度贪心保留标签，隐藏会压到其它标签/节点圆圈的标签。
 * （ECharts 自带 labelLayout.hideOverlap 只处理标签-标签，这里额外避开节点圆）
 */
function computeVisibleLabels(
  nodes: readonly PositionedNode[],
  mode: 'global' | 'focus',
  selectedClosure: Set<string> | null,
  selectedId: string | null,
  worldWidth: number,
): Set<string> {
  const candidates = nodes.filter((item) => {
    if (mode === 'focus') return true;
    return item.node.importance >= 8 || selectedClosure?.has(item.node.id) === true;
  });
  const priority = (item: PositionedNode): number => {
    if (item.node.id === selectedId) return 0;
    if (selectedClosure?.has(item.node.id)) return 1;
    return 2;
  };
  const sorted = [...candidates].sort(
    (a, b) =>
      priority(a) - priority(b) ||
      b.node.importance - a.node.importance ||
      a.node.date.localeCompare(b.node.date) ||
      a.node.id.localeCompare(b.node.id),
  );

  const accepted: LabelRect[] = [];
  const visible = new Set<string>();
  for (const item of sorted) {
    const position =
      item.side === 'focus'
        ? 'bottom'
        : mode === 'focus'
          ? item.side === 'upstream'
            ? 'left'
            : 'right'
          : item.x > worldWidth * 0.775
            ? 'left'
            : 'right';
    const rect = labelRectOf(item, position);
    if (accepted.some((other) => rectsOverlap(rect, other))) continue;
    // importance≥9 的关键节点允许轻微压到其它节点圆，但绝不允许压到别的标签
    if (item.node.importance < 9) {
      let hitsNode = false;
      for (const other of nodes) {
        if (other.node.id === item.node.id) continue;
        if (rectOverlapsNode(rect, other)) {
          hitsNode = true;
          break;
        }
      }
      if (hitsNode) continue;
    }
    accepted.push(rect);
    visible.add(item.node.id);
  }
  return visible;
}

function isHiddenNode(node: GraphNode, hiddenSet: Set<Category>): boolean {
  return node.categories.some((category) => hiddenSet.has(category));
}

function readViewTransform(chart: EChartsType): { scale: number; tx: number; ty: number } | null {
  try {
    const origin = chart.convertToPixel({ seriesIndex: 0 }, [0, 0]);
    const unit = chart.convertToPixel({ seriesIndex: 0 }, [1, 1]);
    if (!Array.isArray(origin) || !Array.isArray(unit)) return null;
    const scale = Number(unit[0]) - Number(origin[0]);
    const tx = Number(origin[0]);
    const ty = Number(origin[1]);
    if (!Number.isFinite(scale) || scale <= 0 || !Number.isFinite(tx) || !Number.isFinite(ty)) return null;
    return { scale, tx, ty };
  } catch {
    return null;
  }
}

function boundsOfNodes(nodes: readonly PositionedNode[]): Rectangle | null {
  if (nodes.length === 0) return null;
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  for (const item of nodes) {
    minX = Math.min(minX, item.x - item.radius);
    minY = Math.min(minY, item.y - item.radius);
    maxX = Math.max(maxX, item.x + item.radius);
    maxY = Math.max(maxY, item.y + item.radius);
  }
  return { minX, minY, maxX, maxY };
}

interface BuildOptionContext {
  layout: GraphLayout;
  selectedId: string | null;
  selectedClosure: Set<string> | null;
  hiddenSet: Set<Category>;
  nodeHidden: Map<string, boolean>;
  upstreamCounts: Map<string, number>;
  downstreamCounts: Map<string, number>;
  totalNodeById: Map<string, GraphNode>;
  labelVisible: Set<string>;
}

function buildNodeDatum(item: PositionedNode, context: BuildOptionContext): GraphNodeDatum {
  const { node } = item;
  const hidden = context.nodeHidden.get(node.id) ?? false;
  const inClosure = context.selectedClosure ? context.selectedClosure.has(node.id) : true;
  const isSelected = context.selectedId === node.id;
  const isFocus = context.layout.focus?.node.id === node.id;
  const color = categoryColor(primaryCategory(node.categories));
  const opacity = hidden ? 0.1 : context.selectedClosure ? (inClosure ? 1 : 0.14) : 1;
  const showLabel = !hidden && (context.labelVisible.has(node.id) || isSelected || isFocus);
  const labelPosition = isFocus
    ? 'bottom'
    : context.layout.mode === 'focus'
      ? item.side === 'upstream'
        ? 'left'
        : 'right'
      : item.x > context.layout.width - 360
        ? 'left'
        : 'right';

  return {
    id: node.id,
    name: truncateTitle(node.title),
    x: item.x,
    y: item.y,
    symbolSize: item.diameter,
    value: node.importance,
    itemStyle: {
      color,
      opacity,
      borderColor: isSelected || isFocus ? '#ffffff' : 'rgba(8, 10, 16, 0.62)',
      borderWidth: isSelected || isFocus ? 2 : 1,
      shadowBlur: isSelected || isFocus ? 16 : 0,
      shadowColor: isSelected || isFocus ? color : 'transparent',
    },
    label: {
      ...LABEL_STYLE,
      show: showLabel,
      position: labelPosition,
    },
    nodeId: node.id,
    fullTitle: node.title,
  };
}

function buildAnchorDatum(x: number, y: number): GraphNodeDatum {
  return {
    id: `${ANCHOR_PREFIX}${x}-${y}`,
    name: '',
    x,
    y,
    symbolSize: 1,
    value: 0,
    itemStyle: {
      color: 'rgba(0, 0, 0, 0)',
      opacity: 0,
      borderColor: 'transparent',
      borderWidth: 0,
      shadowBlur: 0,
      shadowColor: 'transparent',
    },
    label: { ...LABEL_STYLE, show: false },
    silent: true,
    isAnchor: true,
  };
}

function buildLinkDatum(edge: GraphEdge, index: number, context: BuildOptionContext): GraphLinkDatum {
  const meta = RELATION_META[edge.type] ?? RELATION_META['基于'];
  const hiddenEdge = (context.nodeHidden.get(edge.source) ?? false) || (context.nodeHidden.get(edge.target) ?? false);
  const connectedToSelected =
    context.selectedId !== null && (edge.source === context.selectedId || edge.target === context.selectedId);
  const baseOpacity = context.layout.mode === 'focus' ? 0.56 : 0.42;

  let opacity = baseOpacity;
  let width = 1.25;
  if (hiddenEdge) {
    opacity = 0.05;
  } else if (context.selectedClosure) {
    opacity = connectedToSelected ? 0.95 : 0.06;
    width = connectedToSelected ? 1.9 : 1.25;
  }

  return {
    source: edge.source,
    target: edge.target,
    symbol: edge.bidirectional ? ['arrow', 'arrow'] : ['none', 'arrow'],
    symbolSize: edge.bidirectional ? [6, 6] : [4, 7],
    lineStyle: {
      color: meta.color,
      type: meta.lineType,
      // 0.12–0.22 的轻微弯曲，避免同向边完全重叠
      curveness: 0.12 + (index % 3) * 0.05,
      opacity,
      width,
    },
    linkType: edge.type,
    sourceTitle: context.totalNodeById.get(edge.source)?.title,
    targetTitle: context.totalNodeById.get(edge.target)?.title,
  };
}

interface GraphOverlayProps {
  layout: GraphLayout;
  view: ViewTransform | null;
  hiddenSet: Set<Category>;
  focusTitle: string;
  upstreamCount: number;
  downstreamCount: number;
  onBackToGlobal: () => void;
  onReset: () => void;
  onFit: () => void;
}

function GraphOverlay({
  layout,
  view,
  hiddenSet,
  focusTitle,
  upstreamCount,
  downstreamCount,
  onBackToGlobal,
  onReset,
  onFit,
}: GraphOverlayProps): JSX.Element | null {
  if (!view) return null;

  const { scale, tx, ty, width, height } = view;
  const toX = (worldX: number) => tx + worldX * scale;
  const toY = (worldY: number) => ty + worldY * scale;
  const contentLeft = Math.max(0, toX(0));
  const contentRight = Math.min(width, toX(layout.width));
  const laneTopScreen = toY(layout.laneTop);
  const contentBottom = toY(layout.height);

  const layerNodes = new Map<string, PositionedNode[]>();
  for (const item of layout.nodes) {
    const key = `${item.side}:${item.hop}`;
    const list = layerNodes.get(key) ?? [];
    list.push(item);
    layerNodes.set(key, list);
  }

  return (
    <>
      {layout.mode === 'global' && (
        <svg className="im-axis" width={width} height={height} aria-hidden="true">
          {layout.yearTicks.map((tick, index) => {
            const x = toX(tick.x);
            if (x < -40 || x > width + 40) return null;
            return (
              <line
                key={`year-line-${tick.year}`}
                x1={x}
                x2={x}
                y1={Math.max(0, laneTopScreen)}
                y2={Math.min(height, contentBottom)}
                className="im-axis-year-line"
              />
            );
          })}
          {layout.lanes.map((lane) => {
            const y = toY(lane.top);
            if (y < -4 || y > height + 4) return null;
            return (
              <line
                key={`lane-line-${lane.category}`}
                x1={contentLeft}
                x2={contentRight}
                y1={y}
                y2={y}
                className="im-axis-lane-line"
              />
            );
          })}
          <line
            x1={contentLeft}
            x2={contentRight}
            y1={toY(layout.height)}
            y2={toY(layout.height)}
            className="im-axis-lane-line"
          />
          {layout.yearTicks.map((tick, index) => {
            const x = toX(tick.x);
            if (x < 6 || x > width - 6) return null;
            const spacing = layout.yearTicks.length > 1 ? layout.yearTicks[1].x - layout.yearTicks[0].x : 0;
            const step = spacing * scale >= 42 ? 1 : spacing * scale >= 22 ? 2 : 5;
            if (index % step !== 0) return null;
            return (
              <text key={`year-label-${tick.year}`} x={x} y={Math.max(12, laneTopScreen - 10)} textAnchor="middle" className="im-axis-year">
                {tick.year}
              </text>
            );
          })}
          {layout.lanes.map((lane) => {
            const y = toY(lane.centerY);
            if (y < 16 || y > height - 8) return null;
            const dimmed = hiddenSet.has(lane.category);
            return (
              <text
                key={`lane-label-${lane.category}`}
                x={8}
                y={y + 3}
                className={`im-axis-lane${dimmed ? ' is-dimmed' : ''}`}
              >
                {CATEGORY_META[lane.category].label}
              </text>
            );
          })}
        </svg>
      )}

      {layout.mode === 'focus' && (
        <svg className="im-focus-guides" width={width} height={height} aria-hidden="true">
          {[
            { key: 'upstream:2', label: '← 上游 2 跳', x: layout.width / 2 - FOCUS_LAYER_GAP[1] },
            { key: 'upstream:1', label: '← 上游 1 跳', x: layout.width / 2 - FOCUS_LAYER_GAP[0] },
            { key: 'focus:0', label: '此条目', x: layout.width / 2 },
            { key: 'downstream:1', label: '下游 1 跳 →', x: layout.width / 2 + FOCUS_LAYER_GAP[0] },
            { key: 'downstream:2', label: '下游 2 跳 →', x: layout.width / 2 + FOCUS_LAYER_GAP[1] },
          ].map((guide) => {
            const list = layerNodes.get(guide.key) ?? [];
            if (guide.key !== 'focus:0' && list.length === 0) return null;
            const x = toX(guide.x);
            if (x < -60 || x > width + 60) return null;
            return (
              <g key={guide.key}>
                <line x1={x} x2={x} y1={Math.max(0, toY(110))} y2={Math.min(height, toY(800))} className="im-focus-guide-line" />
                <text x={x} y={Math.max(14, toY(78))} textAnchor="middle" className="im-focus-guide-label">
                  {guide.label}
                </text>
              </g>
            );
          })}
        </svg>
      )}

      <div className="im-toolbar" role="group" aria-label="图谱视图控制">
        <button type="button" className="im-tool-btn" onClick={onReset} title="重置视图（回到全局拟合）">
          重置视图
        </button>
        <button type="button" className="im-tool-btn" onClick={onFit} title="适配当前可见节点">
          适配视图
        </button>
      </div>

      {layout.mode === 'focus' && (
        <div className="im-focusbar">
          <span className="im-focusbar-label">
            聚焦：<strong>{focusTitle}</strong>
          </span>
          <span className="im-focusbar-counts mono">
            上游 {upstreamCount} / 下游 {downstreamCount}
          </span>
          <button type="button" className="im-tool-btn im-back-btn" onClick={onBackToGlobal}>
            返回全局
          </button>
        </div>
      )}

      {layout.mode === 'global' && (
        <p className="im-hint">滚轮缩放 · 拖拽平移 · 单击看详情 · 双击节点进入影响链</p>
      )}
    </>
  );
}

/**
 * 影响图谱（ECharts graph，layout: 'none'）。
 * 全局 = 时间 × 类别泳道的连边全景；聚焦 = 以某节点为中心的上下游思维导图。
 */
export function InfluenceMap({
  nodes,
  edges,
  hiddenCategories,
  selectedId,
  focusId,
  onSelect,
  onFocusChange,
}: InfluenceMapProps): JSX.Element {
  const chartElRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<EChartsType | null>(null);
  const hoveredNodeRef = useRef<string | null>(null);
  const clickTimerRef = useRef<number | null>(null);
  const pendingSelectRef = useRef<string | null>(null);
  const lastRoamAtRef = useRef(0);
  const syncFrameRef = useRef<number | null>(null);
  const modeKeyRef = useRef<string | null>(null);
  const scheduleSyncRef = useRef<() => void>(() => undefined);
  const onSelectRef = useRef(onSelect);
  const onFocusChangeRef = useRef(onFocusChange);

  const [view, setView] = useState<ViewTransform | null>(null);

  const layout = useMemo<GraphLayout>(
    () => (focusId ? layoutFocusGraph(nodes, edges, focusId) : layoutGlobalGraph(nodes, edges)),
    [nodes, edges, focusId],
  );

  const hiddenSet = useMemo(() => new Set(hiddenCategories), [hiddenCategories]);
  const totalNodeById = useMemo(() => new Map(nodes.map((node) => [node.id, node])), [nodes]);

  const selectedClosure = useMemo(() => {
    if (!selectedId) return null;
    const closure = new Set<string>([selectedId]);
    for (const edge of edges) {
      if (edge.source === selectedId) closure.add(edge.target);
      if (edge.target === selectedId) closure.add(edge.source);
    }
    return closure;
  }, [edges, selectedId]);

  const upstreamCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const edge of edges) counts.set(edge.target, (counts.get(edge.target) ?? 0) + 1);
    return counts;
  }, [edges]);

  const downstreamCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const edge of edges) counts.set(edge.source, (counts.get(edge.source) ?? 0) + 1);
    return counts;
  }, [edges]);

  const nodeHidden = useMemo(() => {
    const map = new Map<string, boolean>();
    for (const node of nodes) map.set(node.id, isHiddenNode(node, hiddenSet));
    return map;
  }, [nodes, hiddenSet]);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    onFocusChangeRef.current = onFocusChange;
  }, [onFocusChange]);

  const syncView = useCallback(() => {
    const chart = chartRef.current;
    const element = chartElRef.current;
    if (!chart || !element) return;
    const transform = readViewTransform(chart);
    if (!transform) return;
    const width = element.clientWidth;
    const height = element.clientHeight;
    if (width <= 0 || height <= 0) return;
    const next: ViewTransform = { ...transform, width, height };
    setView((previous) => {
      if (
        previous &&
        Math.abs(previous.scale - next.scale) < 0.0005 &&
        Math.abs(previous.tx - next.tx) < 0.2 &&
        Math.abs(previous.ty - next.ty) < 0.2 &&
        previous.width === next.width &&
        previous.height === next.height
      ) {
        return previous;
      }
      return next;
    });
  }, []);

  const scheduleSync = useCallback(() => {
    if (syncFrameRef.current !== null) return;
    syncFrameRef.current = requestAnimationFrame(() => {
      syncFrameRef.current = null;
      syncView();
    });
  }, [syncView]);

  useEffect(() => {
    scheduleSyncRef.current = scheduleSync;
  }, [scheduleSync]);

  const fitToBox = useCallback(
    (box: Rectangle | null, padding = 0.08, centerWorld?: { x: number; y: number }) => {
      const chart = chartRef.current;
      const element = chartElRef.current;
      if (!chart || !element || !box) return;
      const transform = readViewTransform(chart);
      if (!transform) return;
      const width = element.clientWidth;
      const height = element.clientHeight;
      if (width <= 0 || height <= 0) return;
      const boxWidth = Math.max(1, box.maxX - box.minX);
      const boxHeight = Math.max(1, box.maxY - box.minY);
      const targetScale = Math.min((width * (1 - padding * 2)) / boxWidth, (height * (1 - padding * 2)) / boxHeight);
      if (!Number.isFinite(targetScale) || targetScale <= 0) return;
      const centerWorldX = centerWorld?.x ?? (box.minX + box.maxX) / 2;
      const centerWorldY = centerWorld?.y ?? (box.minY + box.maxY) / 2;
      const dx = width / 2 - (transform.tx + centerWorldX * transform.scale);
      const dy = height / 2 - (transform.ty + centerWorldY * transform.scale);
      const zoomDelta = targetScale / transform.scale;
      chart.dispatchAction({
        type: 'graphRoam',
        seriesId: SERIES_ID,
        dx,
        dy,
        zoom: zoomDelta,
        originX: width / 2,
        originY: height / 2,
      });
      scheduleSync();
    },
    [scheduleSync],
  );

  /** 聚焦模式专用：中心节点居中，同时按左右/上下可用空间缩放到所有闭包节点可见 */
  const fitFocusView = useCallback(() => {
    const chart = chartRef.current;
    const element = chartElRef.current;
    const focus = layout.focus;
    const box = boundsOfNodes(layout.nodes);
    if (!chart || !element || !focus || !box) return;
    const transform = readViewTransform(chart);
    if (!transform) return;
    const width = element.clientWidth;
    const height = element.clientHeight;
    if (width <= 0 || height <= 0) return;

    // 预留标签与工具栏空间（左右更宽，避免右侧标签被裁切）
    const sidePadding = Math.min(300, width * 0.21);
    const topPadding = 120;
    const bottomPadding = 80;
    const leftExtent = Math.max(1, focus.x - box.minX);
    const rightExtent = Math.max(1, box.maxX - focus.x);
    const topExtent = Math.max(1, focus.y - box.minY);
    const bottomExtent = Math.max(1, box.maxY - focus.y);
    const targetScale = Math.min(
      (width / 2 - sidePadding) / leftExtent,
      (width / 2 - sidePadding) / rightExtent,
      (height / 2 - topPadding) / topExtent,
      (height / 2 - bottomPadding) / bottomExtent,
    );
    if (!Number.isFinite(targetScale) || targetScale <= 0) return;

    const dx = width / 2 - (transform.tx + focus.x * transform.scale);
    const dy = height / 2 - (transform.ty + focus.y * transform.scale);
    chart.dispatchAction({
      type: 'graphRoam',
      seriesId: SERIES_ID,
      dx,
      dy,
      zoom: targetScale / transform.scale,
      originX: width / 2,
      originY: height / 2,
    });
    scheduleSync();
  }, [layout.focus, layout.nodes, scheduleSync]);

  const resetView = useCallback(() => {
    fitToBox({ minX: 0, minY: 0, maxX: layout.width, maxY: layout.height }, 0);
  }, [fitToBox, layout.height, layout.width]);

  const fitView = useCallback(() => {
    fitToBox(boundsOfNodes(layout.nodes), 0.1);
  }, [fitToBox, layout.nodes]);

  const focusTitle = layout.chains?.focusNode?.title ?? '';

  // 图例/焦点切换后重建 option；焦点模式用 notMerge 重置视图，普通更新保留 roam 状态
  const option = useMemo<EChartsCoreOption>(() => {
    const labelVisible = computeVisibleLabels(layout.nodes, layout.mode, selectedClosure, selectedId, layout.width);
    const context: BuildOptionContext = {
      layout,
      selectedId,
      selectedClosure,
      hiddenSet,
      nodeHidden,
      upstreamCounts,
      downstreamCounts,
      totalNodeById,
      labelVisible,
    };

    const data: GraphNodeDatum[] = layout.nodes.map((item) => buildNodeDatum(item, context));
    data.push(
      buildAnchorDatum(0, 0),
      buildAnchorDatum(layout.width, 0),
      buildAnchorDatum(0, layout.height),
      buildAnchorDatum(layout.width, layout.height),
    );
    const links: GraphLinkDatum[] = layout.links.map((edge, index) => buildLinkDatum(edge, index, context));

    const tooltipFormatter = (params: TooltipParams): string => {
      const data = params.data as GraphNodeDatum | GraphLinkDatum | undefined;
      if (!data) return '';
      if (params.dataType === 'edge') {
        const link = data as GraphLinkDatum;
        const meta = link.linkType ? RELATION_META[link.linkType] : null;
        return `<div class="im-tt"><p class="im-tt-title">${escapeHtml(meta?.label ?? '关系')}</p><p class="im-tt-meta">${escapeHtml(
          link.sourceTitle ?? '',
        )} → ${escapeHtml(link.targetTitle ?? '')}</p><p class="im-tt-hint">${escapeHtml(meta?.description ?? '')}</p></div>`;
      }
      const nodeData = data as GraphNodeDatum;
      const nodeId = nodeData.nodeId;
      const node = nodeId ? totalNodeById.get(nodeId) : undefined;
      if (!node) return '';
      const upstream = upstreamCounts.get(node.id) ?? 0;
      const downstream = downstreamCounts.get(node.id) ?? 0;
      const categories = node.categories
        .map(
          (category) =>
            `<span class="im-tt-cat"><i style="background:${categoryColor(category)}"></i>${escapeHtml(
              categoryLabel(category),
            )}</span>`,
        )
        .join('');
      return `<div class="im-tt">
        <p class="im-tt-title">${escapeHtml(node.title)}</p>
        <p class="im-tt-meta"><span class="mono">${formatDate(node.date)}</span><span>·</span>影响力 ${node.importance}/10<span>·</span>${escapeHtml(
          importanceLabel(node.importance),
        )}</p>
        <p class="im-tt-cats">${categories}</p>
        <p class="im-tt-degree">上游 ${upstream} · 下游 ${downstream}</p>
        <p class="im-tt-hint">单击看详情 · 双击以此为中心</p>
      </div>`;
    };

    const series = {
      id: SERIES_ID,
      type: 'graph',
      layout: 'none',
      left: 0,
      top: 0,
      width: '100%',
      height: '100%',
      roam: true,
      scaleLimit: { min: 0.4, max: 3 },
      draggable: false,
      animation: false,
      preserveAspect: true,
      nodeScaleRatio: 0.6,
      edgeSymbol: ['none', 'arrow'],
      edgeSymbolSize: [4, 7],
      data,
      links,
      label: LABEL_STYLE,
      labelLayout: { hideOverlap: true },
      itemStyle: { opacity: 1 },
      lineStyle: { opacity: 0.35, width: 1.1 },
      emphasis: {
        focus: 'adjacency',
        blurScope: 'series',
        scale: 1.06,
        label: { ...LABEL_STYLE, show: true, fontSize: 11, textBorderWidth: 3 },
        itemStyle: { opacity: 1, borderColor: '#ffffff', borderWidth: 2 },
        lineStyle: { width: 2.2, opacity: 0.95 },
      },
      blur: {
        label: { show: false },
        itemStyle: { opacity: 0.12 },
        lineStyle: { opacity: 0.07 },
      },
      select: { disabled: true },
      z: 2,
    };

    return {
      backgroundColor: 'transparent',
      animation: false,
      tooltip: {
        trigger: 'item',
        confine: true,
        enterable: false,
        className: 'im-tooltip',
        backgroundColor: 'transparent',
        borderWidth: 0,
        padding: 0,
        extraCssText: 'box-shadow:none;',
        textStyle: { color: '#e6eaf2' },
        formatter: tooltipFormatter,
      },
      series: [series],
    };
  }, [
    layout,
    selectedId,
    selectedClosure,
    hiddenSet,
    nodeHidden,
    upstreamCounts,
    downstreamCounts,
    totalNodeById,
  ]);

  const modeKey = focusId ? `focus:${focusId}` : 'global';

  // 初始化 ECharts；事件监听器只注册一次，通过 ref 读取最新回调。
  useEffect(() => {
    const element = chartElRef.current;
    if (!element) return;

    const chart = echarts.init(element, undefined, { renderer: 'canvas' });
    chartRef.current = chart;

    const clearClickTimer = () => {
      if (clickTimerRef.current !== null) {
        window.clearTimeout(clickTimerRef.current);
        clickTimerRef.current = null;
      }
    };

    const handleClick = (params: TooltipParams) => {
      const data = params.data as GraphNodeDatum | undefined;
      if (params.dataType !== 'node' || !data?.nodeId) return;
      if (performance.now() - lastRoamAtRef.current < ROAM_CLICK_GUARD) return;
      pendingSelectRef.current = data.nodeId;
      clearClickTimer();
      clickTimerRef.current = window.setTimeout(() => {
        clickTimerRef.current = null;
        const target = pendingSelectRef.current;
        pendingSelectRef.current = null;
        if (target) onSelectRef.current(target);
      }, CLICK_DELAY);
    };

    const handleMouseOver = (params: TooltipParams) => {
      const data = params.data as GraphNodeDatum | undefined;
      if (params.dataType === 'node' && data?.nodeId) hoveredNodeRef.current = data.nodeId;
    };

    const handleMouseOut = (params: TooltipParams) => {
      const data = params.data as GraphNodeDatum | undefined;
      if (params.dataType === 'node' && data?.nodeId && hoveredNodeRef.current === data.nodeId) {
        hoveredNodeRef.current = null;
      }
    };

    const handleDblClick = () => {
      const nodeId = hoveredNodeRef.current;
      if (!nodeId) return;
      clearClickTimer();
      pendingSelectRef.current = null;
      onFocusChangeRef.current(nodeId);
    };

    const handleGraphRoam = () => {
      lastRoamAtRef.current = performance.now();
      scheduleSyncRef.current();
    };

    chart.on('click', handleClick);
    chart.on('mouseover', handleMouseOver);
    chart.on('mouseout', handleMouseOut);
    chart.on('graphRoam', handleGraphRoam);
    const zr = chart.getZr();
    zr.on('dblclick', handleDblClick);

    const observer = new ResizeObserver(() => {
      chart.resize();
      scheduleSyncRef.current();
    });
    observer.observe(element);

    return () => {
      observer.disconnect();
      zr.off('dblclick', handleDblClick);
      chart.dispose();
      chartRef.current = null;
      clearClickTimer();
      pendingSelectRef.current = null;
      if (syncFrameRef.current !== null) {
        cancelAnimationFrame(syncFrameRef.current);
        syncFrameRef.current = null;
      }
    };
  }, []);

  // option 更新：切换全局/聚焦时 notMerge 重置视图；其余更新保留当前缩放平移。
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    const notMerge = modeKeyRef.current !== modeKey;
    chart.setOption(option, { notMerge, lazyUpdate: false });
    modeKeyRef.current = modeKey;
    scheduleSyncRef.current();
  }, [option, modeKey]);

  // 进入聚焦模式后自动适配到可见节点闭包（只做一次/每次切换 focus）
  useEffect(() => {
    if (!focusId || !layout.focus) return;
    const frame = requestAnimationFrame(() => {
      fitFocusView();
    });
    return () => cancelAnimationFrame(frame);
  }, [fitFocusView, focusId, layout]);

  const handleRetryGlobal = useCallback(() => {
    onFocusChange(null);
  }, [onFocusChange]);

  if (nodes.length === 0) {
    return (
      <div className="im-root">
        <div className="im-empty">
          <EmptyState title="暂无图谱数据" description="数据准备中；每条带关系的条目会自动出现在这里。" />
        </div>
      </div>
    );
  }

  if (focusId && !layout.focus) {
    return (
      <div className="im-root">
        <div className="im-empty">
          <EmptyState title="未找到聚焦节点" description="该条目可能已被移除，先回到全局视图继续浏览。" />
          <button type="button" className="im-tool-btn" onClick={handleRetryGlobal}>
            返回全局
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="im-root" aria-label="影响关系图谱；单击节点看详情，双击节点进入以它为中心的影响链">
      <div className="im-chart" ref={chartElRef} />
      <GraphOverlay
        layout={layout}
        view={view}
        hiddenSet={hiddenSet}
        focusTitle={focusTitle}
        upstreamCount={layout.chains?.upstreamCount ?? 0}
        downstreamCount={layout.chains?.downstreamCount ?? 0}
        onBackToGlobal={handleRetryGlobal}
        onReset={resetView}
        onFit={fitView}
      />
    </div>
  );
}
