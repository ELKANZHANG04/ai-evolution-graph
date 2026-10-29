import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { JSX, PointerEvent as ReactPointerEvent, MouseEvent as ReactMouseEvent } from 'react';
import { EmptyState } from '../common/EmptyState';
import { layoutTreemap } from '../../lib/layout/treemap';
import { groupByYear } from '../../lib/data';
import type { YearGroup } from '../../lib/data';
import { formatDate } from '../../lib/format';
import type { Category, Entry } from '../../lib/types';
import { categoryColor, categoryLabel, primaryCategory, textOn } from '../../theme/categories';
import { importanceLabel } from '../../theme/importance';
import './timeline.css';

export interface TimelineCanvasProps {
  entries: Entry[];
  hiddenCategories: Category[];
  selectedId: string | null;
  onSelect: (entry: Entry) => void;
}

/** 画布左右留白（世界坐标） */
const PAD = 12;
/** 底部年份标签区高度 */
const AXIS_H = 34;
/** 顶部为悬浮控件（年份 chip / 缩放）预留的区域高度，避免压住最高的年份列 */
const PLOT_TOP = 46;
/** 年份列最小宽度（px），保证极窄容器也不至于压成一条线 */
const MIN_COL_W = 56;
const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
/** 列内块间距（2–3px，见 DECISIONS §6.1） */
const BLOCK_GAP = 2.5;
/** 拖拽超过该距离视为平移，不触发选中 */
const DRAG_THRESHOLD = 4;
/** 连续年份列最多支持的年数；异常跨度（如未来加入 <2012 奠基条目）时退回「仅有数据的年份」 */
const MAX_CONTINUOUS_YEARS = 40;
/** 方向键单次平移距离 */
const KEY_PAN_STEP = 120;

const TITLE_FONT_SIZE = 12;
const TITLE_LINE_HEIGHT = 15;
const DARK_TEXT = '#0B0E14';

interface Size {
  width: number;
  height: number;
}

interface TimelineYear {
  year: number;
  /** 列左边界（世界坐标） */
  x: number;
  count: number;
  totalImportance: number;
}

interface TimelineBlockModel {
  entry: Entry;
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  fg: string;
  dim: boolean;
  showTitle: boolean;
  showImportance: boolean;
  titleLines: string[];
  rx: number;
}

interface TimelineLayout {
  blocks: TimelineBlockModel[];
  years: TimelineYear[];
}

interface Scene {
  pad: number;
  baseColW: number;
  colW: number;
  worldW: number;
  viewW: number;
  viewH: number;
  plotH: number;
  zoom: number;
  /** 当前实际渲染的平移量（已 clamp） */
  pan: number;
  yearCount: number;
}

interface DragState {
  active: boolean;
  moved: boolean;
  startX: number;
  startY: number;
  panStart: number;
  pointerId: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** 平移 clamp：worldW > viewW 时限制在 [viewW - worldW, 0]；否则居中 */
function clampPan(pan: number, viewW: number, worldW: number): number {
  if (!Number.isFinite(pan)) return 0;
  if (worldW <= viewW) return (viewW - worldW) / 2;
  return clamp(pan, viewW - worldW, 0);
}

const WIDE_CHAR_RE =
  /[\u1100-\u115F\u2E80-\u303E\u3041-\u33FF\u3400-\u4DBF\u4E00-\u9FFF\uA000-\uA4CF\uAC00-\uD7A3\uF900-\uFAFF\uFE30-\uFE4F\uFF00-\uFF60\uFFE0-\uFFE6]/;

/** 不能出现在行首的标点：附着到前一个 token（如「Scaling Laws：」） */
const CLOSING_PUNCTUATION = new Set([...'，。、：；！？）〕】」』》〉”’%']);
/** 不能出现在行尾的标点：附着到后一个 token（如「（Bahdanau」） */
const OPENING_PUNCTUATION = new Set([...'（〔【「『《〈“‘']);

let titleMeasureContext: CanvasRenderingContext2D | null = null;
let titleMeasureUnavailable = false;
const titleWidthCache = new Map<string, number>();

function fallbackTextWidth(text: string): number {
  let width = 0;
  for (const char of text) width += (WIDE_CHAR_RE.test(char) ? 1 : 0.56) * TITLE_FONT_SIZE;
  return width;
}

/** 用 Canvas 实测块内标题的渲染宽度（比按字符估算更准，避免提前/滞后断行）。 */
function measureTitleText(text: string): number {
  const cached = titleWidthCache.get(text);
  if (cached !== undefined) return cached;

  if (!titleMeasureUnavailable && typeof document !== 'undefined') {
    if (!titleMeasureContext) {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (context) {
        const fontFamily = getComputedStyle(document.body).fontFamily || 'sans-serif';
        context.font = `600 ${TITLE_FONT_SIZE}px ${fontFamily}`;
        titleMeasureContext = context;
      } else {
        titleMeasureUnavailable = true;
      }
    }
    if (titleMeasureContext) {
      const width = titleMeasureContext.measureText(text).width;
      if (titleWidthCache.size > 20000) titleWidthCache.clear();
      titleWidthCache.set(text, width);
      return width;
    }
  }

  const width = fallbackTextWidth(text);
  titleWidthCache.set(text, width);
  return width;
}

/** 把标题切成 token：拉丁词整体、CJK 字符逐个、空格单独；标点做行首/行尾亲和处理。 */
function tokenizeTitle(text: string): string[] {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (!clean) return [];

  const raw: string[] = [];
  let word = '';
  for (const char of clean) {
    if (char === ' ') {
      if (word) {
        raw.push(word);
        word = '';
      }
      raw.push(' ');
    } else if (WIDE_CHAR_RE.test(char)) {
      if (word) {
        raw.push(word);
        word = '';
      }
      raw.push(char);
    } else {
      word += char;
    }
  }
  if (word) raw.push(word);

  const attached: string[] = [];
  for (const token of raw) {
    if (token.length === 1 && CLOSING_PUNCTUATION.has(token)) {
      let index = attached.length - 1;
      while (index >= 0 && attached[index] === ' ') index -= 1;
      if (index >= 0) {
        attached[index] += token;
        continue;
      }
    }
    attached.push(token);
  }

  const merged: string[] = [];
  for (let index = 0; index < attached.length; index += 1) {
    const token = attached[index];
    if (token.length === 1 && OPENING_PUNCTUATION.has(token)) {
      let next = index + 1;
      while (next < attached.length && attached[next] === ' ') next += 1;
      if (next < attached.length) {
        merged.push(token + attached[next]);
        index = next;
        continue;
      }
    }
    merged.push(token);
  }
  return merged;
}

/** 允许 2px 的排版溢出容差（Canvas 测量未含 letter-spacing，且 SVG 文本可轻微出界） */
const FIT_TOLERANCE = 2;

/** 单个 token 比整行还宽时（超长英文单词），只能退回按字符硬切。 */
function splitOverlongTokens(tokens: string[], maxWidth: number): string[] {
  const result: string[] = [];
  for (const token of tokens) {
    if (token === ' ' || measureTitleText(token) <= maxWidth + FIT_TOLERANCE) {
      result.push(token);
      continue;
    }
    let chunk = '';
    for (const char of token) {
      if (chunk && measureTitleText(chunk + char) > maxWidth) {
        result.push(chunk);
        chunk = '';
      }
      chunk += char;
    }
    if (chunk) result.push(chunk);
  }
  return result;
}

/** 按整词/标点折行（最多 maxLines 行，放不下则截断加 …）。 */
function wrapTitle(title: string, maxWidth: number, maxLines: number): string[] {
  if (maxWidth <= 0 || maxLines <= 0) return [];
  const tokens = splitOverlongTokens(tokenizeTitle(title), maxWidth);
  if (tokens.length === 0) return [];

  const lines: string[] = [];
  let current = '';
  let currentWidth = 0;
  let truncated = false;

  const pushLine = () => {
    if (!current) return;
    lines.push(current.trimEnd());
    current = '';
    currentWidth = 0;
  };

  for (const token of tokens) {
    if (token === ' ') {
      if (!current) continue;
      current += ' ';
      currentWidth += measureTitleText(' ');
      continue;
    }
    const tokenWidth = measureTitleText(token);
    if (current && currentWidth + tokenWidth > maxWidth + FIT_TOLERANCE) {
      pushLine();
      if (lines.length >= maxLines) {
        truncated = true;
        break;
      }
    }
    current += token;
    currentWidth += tokenWidth;
  }

  if (!truncated) {
    pushLine();
    if (lines.length <= maxLines) return lines;
    truncated = true;
  }

  if (lines.length === 0) return [];
  const lastIndex = Math.min(lines.length, maxLines) - 1;
  const sliced = lines.slice(0, maxLines);
  let last = sliced[lastIndex] ?? '';
  while (last.length > 0 && measureTitleText(`${last}…`) > maxWidth) last = last.slice(0, -1);
  sliced[lastIndex] = `${last}…`;
  return sliced;
}

function formatPercent(zoom: number): string {
  return `${Math.round(zoom * 100)}%`;
}

interface TimelineBlockViewProps {
  block: TimelineBlockModel;
  selected: boolean;
  onSelect: (entry: Entry) => void;
}

const TimelineBlockView = memo(function TimelineBlockView({ block, selected, onSelect }: TimelineBlockViewProps) {
  const { entry, color, fg } = block;
  const showLabel = block.showTitle && !block.dim;

  return (
    <g
      className={`tl-block${selected ? ' is-selected' : ''}${block.dim ? ' is-dimmed' : ''}`}
      data-entry-id={entry.id}
      role="button"
      tabIndex={0}
      aria-label={`${entry.title}，${formatDate(entry.date)}，影响力 ${entry.importance}/10，${importanceLabel(
        entry.importance,
      )}`}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar') {
          event.preventDefault();
          onSelect(entry);
        }
      }}
    >
      <rect
        className="tl-block-fill"
        x={block.x}
        y={block.y}
        width={block.w}
        height={block.h}
        rx={block.rx}
        fill={color}
        stroke="rgba(0, 0, 0, 0.35)"
        strokeWidth={1}
      />
      {showLabel && (
        <text
          className="tl-block-title"
          x={Math.round(block.x + 6)}
          y={Math.round(block.y + 17)}
          fill={fg}
          stroke={fg === DARK_TEXT ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.38)'}
          strokeWidth={2.5}
          strokeLinejoin="round"
        >
          {block.titleLines.map((line, index) => (
            <tspan key={index} x={Math.round(block.x + 6)} dy={index === 0 ? 0 : TITLE_LINE_HEIGHT}>
              {line}
            </tspan>
          ))}
        </text>
      )}
      {block.showImportance && !block.dim && (
        <text
          className="tl-block-importance"
          x={Math.round(block.x + block.w - 5)}
          y={Math.round(block.y + 14)}
          textAnchor="end"
          fill={fg}
        >
          {entry.importance}
        </text>
      )}
    </g>
  );
});

/**
 * 把「有数据的年份」补成 minYear..maxYear 的连续年份列：
 * 无数据年份保留一个空列（画一条极淡的「—」），让时间轴在视觉上连续、诚实。
 * 异常跨度（例如未来把 <2012 奠基条目并入全量数据）时退回只渲染有数据的年份。
 */
function continuousYearGroups(groups: YearGroup[]): YearGroup[] {
  if (groups.length <= 1) return groups;
  const minYear = groups[0].year;
  const maxYear = groups[groups.length - 1].year;
  const span = maxYear - minYear + 1;
  if (span <= 0 || span > MAX_CONTINUOUS_YEARS) return groups;
  const byYear = new Map(groups.map((group) => [group.year, group]));
  const result: YearGroup[] = [];
  for (let year = minYear; year <= maxYear; year += 1) {
    result.push(byYear.get(year) ?? { year, entries: [], totalImportance: 0 });
  }
  return result;
}

/**
 * 时间轴主视图：
 * - 等宽年份列（minYear..maxYear 连续，无数据年份留空列）；列高 ∝ 该年总影响力（全局统一比例尺 k），列内 treemap 块面积 = k × importance；
 * - 缩放 1–3x（滚轮以指针为锚点）、拖拽平移、年份 chip 跳转、方向键平移、双击空白重置；
 * - 图例筛选只 dim 不重排，保持「面积 = 影响力」稳定。
 */
export function TimelineCanvas({ entries, hiddenCategories, selectedId, onSelect }: TimelineCanvasProps): JSX.Element {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);

  const [size, setSize] = useState<Size>({ width: 0, height: 0 });
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [flashYear, setFlashYear] = useState<number | null>(null);

  const pointerRef = useRef<{ x: number; y: number } | null>(null);
  const dragRef = useRef<DragState>({ active: false, moved: false, startX: 0, startY: 0, panStart: 0, pointerId: -1 });
  const flashTimerRef = useRef<number | null>(null);
  const wheelAccumulatorRef = useRef<{ factor: number; anchorX: number }>({ factor: 1, anchorX: 0 });
  const wheelFrameRef = useRef<number | null>(null);
  const onSelectRef = useRef(onSelect);

  const groups = useMemo(() => continuousYearGroups(groupByYear(entries)), [entries]);
  const hiddenSet = useMemo(() => new Set(hiddenCategories), [hiddenCategories]);
  const entryById = useMemo(() => new Map(entries.map((entry) => [entry.id, entry])), [entries]);

  const yearCount = groups.length;
  const viewW = size.width;
  const viewH = size.height;
  const plotH = Math.max(0, viewH - AXIS_H - PLOT_TOP);
  const baseColW = yearCount > 0 ? Math.max(MIN_COL_W, (viewW - PAD * 2) / yearCount) : MIN_COL_W;
  const colW = baseColW * zoom;
  const worldW = PAD * 2 + colW * yearCount;
  const pan = clampPan(panX, viewW, worldW);

  const layout = useMemo<TimelineLayout>(() => {
    if (yearCount === 0 || viewW <= 0 || viewH <= 0 || colW <= 0 || plotH <= 0) {
      return { blocks: [], years: [] };
    }

    const maxTotal = Math.max(
      ...groups.map((group) => group.totalImportance),
      1,
    );
    const blocks: TimelineBlockModel[] = [];
    const years: TimelineYear[] = [];

    groups.forEach((group, index) => {
      const x = PAD + index * colW;
      const columnHeight = group.totalImportance > 0 ? plotH * (group.totalImportance / maxTotal) : 0;
      const y = PLOT_TOP + plotH - columnHeight;
      years.push({ year: group.year, x, count: group.entries.length, totalImportance: group.totalImportance });
      if (columnHeight <= 0) return;

      const entriesById = new Map(group.entries.map((entry) => [entry.id, entry]));
      const placements = layoutTreemap(
        group.entries.map((entry) => ({ id: entry.id, weight: entry.importance })),
        { x, y, w: colW, h: columnHeight },
        { gap: BLOCK_GAP },
      );

      for (const placement of placements) {
        const entry = entriesById.get(placement.id);
        if (!entry) continue;
        const rect = placement.rect;
        const color = categoryColor(primaryCategory(entry.categories));
        const showTitle = rect.w >= 56 && rect.h >= 30;
        const showImportance = rect.w >= 90 && rect.h >= 54;
        // 右上角 importance 数字最多占约 17px；标题右侧留 24px 避免压字
        const titleMaxWidth = rect.w - (showImportance ? 24 : 12);
        const titleLines = showTitle ? wrapTitle(entry.title, titleMaxWidth, rect.h >= 46 ? 2 : 1) : [];

        blocks.push({
          entry,
          x: rect.x,
          y: rect.y,
          w: rect.w,
          h: rect.h,
          color,
          fg: textOn(color),
          dim: entry.categories.some((category) => hiddenSet.has(category)),
          showTitle: titleLines.length > 0,
          showImportance,
          titleLines,
          rx: Math.min(2, rect.w / 2, rect.h / 2),
        });
      }
    });

    return { blocks, years };
  }, [groups, yearCount, viewW, viewH, colW, plotH, hiddenSet]);

  const selectedEntry = selectedId ? entryById.get(selectedId) : undefined;
  const selectedYear = selectedEntry ? Number(selectedEntry.date.slice(0, 4)) : null;
  const hoveredEntry = hoveredId ? entryById.get(hoveredId) ?? null : null;

  // 用 ref 保存布局现场，给事件回调读取，避免每次事件都重建监听器。
  const sceneRef = useRef<Scene>({
    pad: PAD,
    baseColW,
    colW,
    worldW,
    viewW,
    viewH,
    plotH,
    zoom,
    pan,
    yearCount,
  });
  useLayoutEffect(() => {
    sceneRef.current = { pad: PAD, baseColW, colW, worldW, viewW, viewH, plotH, zoom, pan, yearCount };
  });

  useLayoutEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  // 容器自适应：铺满父级 .timeline-stage
  useEffect(() => {
    const element = rootRef.current;
    if (!element) return;
    const update = () => {
      const rect = element.getBoundingClientRect();
      setSize((previous) => {
        if (Math.abs(previous.width - rect.width) < 0.5 && Math.abs(previous.height - rect.height) < 0.5) {
          return previous;
        }
        return { width: rect.width, height: rect.height };
      });
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // 视口/缩放变化后把平移量收回到合法范围（worldW < viewW 时自动居中）
  useEffect(() => {
    setPanX((previous) => {
      const next = clampPan(previous, viewW, worldW);
      return Math.abs(next - previous) < 0.5 ? previous : next;
    });
  }, [viewW, worldW]);

  useEffect(() => {
    return () => {
      if (flashTimerRef.current !== null) window.clearTimeout(flashTimerRef.current);
    };
  }, []);

  const handleSelect = useCallback((entry: Entry) => {
    onSelectRef.current(entry);
  }, []);

  const flashYearLabel = useCallback((year: number) => {
    setFlashYear(year);
    if (flashTimerRef.current !== null) window.clearTimeout(flashTimerRef.current);
    flashTimerRef.current = window.setTimeout(() => {
      flashTimerRef.current = null;
      setFlashYear(null);
    }, 1100);
  }, []);

  const positionTooltip = useCallback((clientX: number, clientY: number) => {
    const root = rootRef.current;
    const tooltip = tooltipRef.current;
    if (!root || !tooltip) return;
    const bounds = root.getBoundingClientRect();
    const offset = 16;
    const maxLeft = bounds.width - 8;
    const maxTop = bounds.height - 8;
    let left = clientX - bounds.left + offset;
    let top = clientY - bounds.top + offset;
    if (left + tooltip.offsetWidth > maxLeft) left = clientX - bounds.left - tooltip.offsetWidth - offset;
    if (top + tooltip.offsetHeight > maxTop) top = clientY - bounds.top - tooltip.offsetHeight - offset;
    tooltip.style.left = `${clamp(left, 8, Math.max(8, maxLeft - tooltip.offsetWidth))}px`;
    tooltip.style.top = `${clamp(top, 8, Math.max(8, maxTop - tooltip.offsetHeight))}px`;
  }, []);

  useLayoutEffect(() => {
    if (!hoveredEntry) return;
    const pointer = pointerRef.current;
    if (pointer) positionTooltip(pointer.x, pointer.y);
  }, [hoveredEntry, positionTooltip]);

  /** 以 anchorX（相对容器左边缘）为锚点缩放到 nextZoom */
  const applyZoom = useCallback((nextZoomRaw: number, anchorX: number) => {
    const scene = sceneRef.current;
    if (scene.yearCount === 0 || scene.viewW <= 0) return;
    const nextZoom = clamp(nextZoomRaw, MIN_ZOOM, MAX_ZOOM);
    if (Math.abs(nextZoom - scene.zoom) < 1e-4) return;

    const yearPosition = (anchorX - scene.pan - scene.pad) / scene.colW;
    const nextColW = scene.baseColW * nextZoom;
    const nextWorldW = scene.pad * 2 + nextColW * scene.yearCount;
    const nextPan = clampPan(anchorX - scene.pad - yearPosition * nextColW, scene.viewW, nextWorldW);
    setZoom(nextZoom);
    setPanX(nextPan);
  }, []);

  const zoomBy = useCallback(
    (factor: number) => {
      const scene = sceneRef.current;
      applyZoom(scene.zoom * factor, scene.viewW / 2);
    },
    [applyZoom],
  );

  const resetView = useCallback(() => {
    setZoom(1);
    setPanX(0);
  }, []);

  const jumpToYear = useCallback(
    (year: number) => {
      const scene = sceneRef.current;
      const index = groups.findIndex((group) => group.year === year);
      if (index < 0 || scene.colW <= 0) return;
      const center = scene.pad + (index + 0.5) * scene.colW;
      setPanX(clampPan(scene.viewW / 2 - center, scene.viewW, scene.worldW));
      flashYearLabel(year);
    },
    [groups, flashYearLabel],
  );

  const panBy = useCallback((delta: number) => {
    const scene = sceneRef.current;
    setPanX((previous) => clampPan(previous + delta, scene.viewW, scene.worldW));
  }, []);

  // 滚轮缩放：React 的 wheel 监听是 passive 的，这里用原生监听才能 preventDefault。
  // 一帧内的多个 wheel 事件先累乘再统一应用，避免连续事件读到旧 zoom 导致缩放变慢。
  useEffect(() => {
    const element = rootRef.current;
    if (!element) return;

    const flushWheel = () => {
      wheelFrameRef.current = null;
      const accumulator = wheelAccumulatorRef.current;
      const factor = accumulator.factor;
      accumulator.factor = 1;
      if (factor === 1) return;
      applyZoom(sceneRef.current.zoom * factor, accumulator.anchorX);
    };

    const handleWheel = (event: WheelEvent) => {
      if (sceneRef.current.yearCount === 0) return;
      event.preventDefault();
      setHoveredId(null);
      const bounds = element.getBoundingClientRect();
      const anchorX = event.clientX - bounds.left;
      const delta = event.deltaY * (event.deltaMode === 1 ? 16 : 1);
      const accumulator = wheelAccumulatorRef.current;
      accumulator.factor *= Math.exp(-delta * 0.0016);
      accumulator.anchorX = anchorX;
      if (wheelFrameRef.current === null) {
        wheelFrameRef.current = requestAnimationFrame(flushWheel);
      }
    };

    element.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      element.removeEventListener('wheel', handleWheel);
      if (wheelFrameRef.current !== null) {
        cancelAnimationFrame(wheelFrameRef.current);
        wheelFrameRef.current = null;
      }
    };
  }, [applyZoom]);

  // ←/→ 键平移（抽屉打开时不抢键盘）
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (selectedId) return;
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        panBy(KEY_PAN_STEP);
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        panBy(-KEY_PAN_STEP);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [panBy, selectedId]);

  const handlePointerDown = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (event.button !== 0) return;
    if (sceneRef.current.yearCount === 0) return;
    const drag = dragRef.current;
    drag.active = true;
    drag.moved = false;
    drag.startX = event.clientX;
    drag.startY = event.clientY;
    drag.panStart = sceneRef.current.pan;
    drag.pointerId = event.pointerId;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: ReactPointerEvent<SVGSVGElement>) => {
    const drag = dragRef.current;
    if (drag.active) {
      const dx = event.clientX - drag.startX;
      const dy = event.clientY - drag.startY;
      if (!drag.moved && Math.hypot(dx, dy) > DRAG_THRESHOLD) {
        drag.moved = true;
        setIsDragging(true);
        setHoveredId(null);
      }
      if (drag.moved) {
        const scene = sceneRef.current;
        setPanX(clampPan(drag.panStart + dx, scene.viewW, scene.worldW));
        return;
      }
      // 已按下但还没到拖拽阈值：保持当前 hover，避免 pointer capture 把 event.target 变成 svg 后 tooltip 闪烁。
      pointerRef.current = { x: event.clientX, y: event.clientY };
      if (hoveredId) positionTooltip(event.clientX, event.clientY);
      return;
    }

    pointerRef.current = { x: event.clientX, y: event.clientY };
    const target = event.target as Element | null;
    const blockElement = target?.closest('[data-entry-id]') ?? null;
    const nextId = blockElement?.getAttribute('data-entry-id') ?? null;
    setHoveredId((previous) => (previous === nextId ? previous : nextId));
    if (nextId) positionTooltip(event.clientX, event.clientY);
  };

  const endDrag = (event: ReactPointerEvent<SVGSVGElement>) => {
    const drag = dragRef.current;
    if (!drag.active) return;
    const wasMoved = drag.moved;
    drag.active = false;
    setIsDragging(false);
    if (drag.pointerId >= 0 && event.currentTarget.hasPointerCapture(drag.pointerId)) {
      event.currentTarget.releasePointerCapture(drag.pointerId);
    }
    drag.pointerId = -1;

    // 选中不依赖 click（pointer capture 会改变 click 的派发目标），用命中测试更稳。
    if (!wasMoved) {
      const element = document.elementFromPoint(event.clientX, event.clientY);
      const blockElement = element?.closest('[data-entry-id]') ?? null;
      const entryId = blockElement?.getAttribute('data-entry-id');
      if (entryId) {
        const targetEntry = entryById.get(entryId);
        if (targetEntry) onSelectRef.current(targetEntry);
      }
      drag.moved = false;
    }
  };

  const handlePointerLeave = () => {
    if (dragRef.current.active) return;
    setHoveredId(null);
  };

  const handleDoubleClick = (event: ReactMouseEvent<SVGSVGElement>) => {
    const target = event.target as Element | null;
    if (target?.closest('.tl-block')) return;
    resetView();
    setHoveredId(null);
  };

  if (entries.length === 0) {
    return (
      <div className="tl-root" ref={rootRef}>
        <div className="tl-empty">
          <EmptyState
            title="时间轴上还没有条目"
            description="数据正在准备中。每条数据落位后，会按年份与影响力自动出现在这里。"
          />
        </div>
      </div>
    );
  }

  return (
    <div className={`tl-root${isDragging ? ' is-dragging' : ''}`} ref={rootRef}>
      <svg
        className="tl-svg"
        width={viewW || 1}
        height={viewH || 1}
        viewBox={`0 0 ${Math.max(1, viewW)} ${Math.max(1, viewH)}`}
        aria-label={`AI 演进时间轴，共 ${entries.length} 个条目，覆盖 ${yearCount} 个年份；点击块查看详情`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onPointerLeave={handlePointerLeave}
        onDoubleClick={handleDoubleClick}
      >
        {viewW > 0 && viewH > 0 && (
          <g transform={`translate(${pan} 0)`}>
            <line
              className="tl-baseline"
              x1={PAD}
              x2={PAD + colW * yearCount}
              y1={PLOT_TOP + plotH + 0.5}
              y2={PLOT_TOP + plotH + 0.5}
            />
            {layout.blocks.map((block) => (
              <TimelineBlockView
                key={block.entry.id}
                block={block}
                selected={block.entry.id === selectedId}
                onSelect={handleSelect}
              />
            ))}
            {layout.years.map((year) => (
              <g key={year.year}>
                {year.count === 0 && (
                  <text
                    className="tl-year-gap"
                    x={Math.round(year.x + colW / 2)}
                    y={Math.round(PLOT_TOP + plotH - 12)}
                    textAnchor="middle"
                    aria-hidden="true"
                  >
                    —
                  </text>
                )}
                <text
                  className={`tl-year-label${
                    year.year === selectedYear || year.year === flashYear ? ' is-active' : ''
                  }`}
                  x={year.x + colW / 2}
                  y={PLOT_TOP + plotH + 20}
                  textAnchor="middle"
                >
                  {year.year}
                </text>
              </g>
            ))}
          </g>
        )}
      </svg>

      {layout.years.length > 0 && (
        <>
          <div className="tl-overlay tl-yearbar" role="group" aria-label="按年份跳转">
            {layout.years.map((year) => (
              <button
                key={year.year}
                type="button"
                className={`tl-year-chip${year.count === 0 ? ' is-empty' : ''}${
                  year.year === flashYear ? ' is-flash' : ''
                }${year.year === selectedYear ? ' is-active' : ''}`}
                title={
                  year.count === 0
                    ? `${year.year} 年 · 暂无收录条目`
                    : `${year.year} 年 · ${year.count} 条 · 总影响力 ${year.totalImportance}`
                }
                onClick={() => jumpToYear(year.year)}
              >
                {year.year}
              </button>
            ))}
          </div>

          <div className="tl-overlay tl-zoom" role="group" aria-label="缩放控制">
            <button
              type="button"
              className="tl-zoom-btn"
              onClick={() => zoomBy(1 / 1.3)}
              disabled={zoom <= MIN_ZOOM + 1e-3}
              aria-label="缩小"
              title="缩小"
            >
              −
            </button>
            <span className="tl-zoom-value mono" aria-live="polite">
              {formatPercent(zoom)}
            </span>
            <button
              type="button"
              className="tl-zoom-btn"
              onClick={() => zoomBy(1.3)}
              disabled={zoom >= MAX_ZOOM - 1e-3}
              aria-label="放大"
              title="放大"
            >
              +
            </button>
            <button
              type="button"
              className="tl-zoom-btn tl-zoom-reset"
              onClick={resetView}
              aria-label="重置缩放与平移"
              title="重置视图（也可双击空白处）"
            >
              ⟲
            </button>
          </div>
        </>
      )}

      {hoveredEntry && !isDragging && (
        <div className="tl-tooltip" ref={tooltipRef} role="tooltip">
          <p className="tl-tooltip-title">{hoveredEntry.title}</p>
          <p className="tl-tooltip-meta">
            <span className="mono">{formatDate(hoveredEntry.date)}</span>
            <span className="tl-tooltip-sep" aria-hidden="true">
              ·
            </span>
            <span>影响力 {hoveredEntry.importance}/10</span>
            <span className="tl-tooltip-sep" aria-hidden="true">
              ·
            </span>
            <span>{importanceLabel(hoveredEntry.importance)}</span>
          </p>
          <p className="tl-tooltip-cats">
            {hoveredEntry.categories.map((category) => (
              <span key={category} className="tl-tooltip-cat">
                <span
                  className="tl-tooltip-swatch"
                  style={{ background: categoryColor(category) }}
                  aria-hidden="true"
                />
                {categoryLabel(category)}
              </span>
            ))}
          </p>
          {hoveredEntry.needs_review && (
            <p className="tl-tooltip-warn">
              <span aria-hidden="true">⚠</span> 待核对
            </p>
          )}
        </div>
      )}
    </div>
  );
}
