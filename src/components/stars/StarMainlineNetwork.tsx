import { useEffect, useMemo, useRef, useState } from 'react';
import type { JSX, KeyboardEvent, PointerEvent as ReactPointerEvent } from 'react';
import { categoryColor, primaryCategory } from '../../theme/categories';
import { formatDate } from '../../lib/format';
import type {
  ChapterStripData,
  MainlineNodePlacement,
  StarMainlineNetworkData,
  StarPlacement,
} from '../../lib/mainline-network';
import './star-network.css';

export interface StarMainlineNetworkProps {
  network: StarMainlineNetworkData;
  selectedId: string | null;
  onSelect: (entryId: string) => void;
}

interface Point {
  x: number;
  y: number;
}

interface DragState {
  id: string;
  origin: Point;
  startClientX: number;
  startClientY: number;
  moved: boolean;
}

function starTooltip(star: StarPlacement): string {
  const anchorLine =
    star.anchors.length > 0
      ? `接上主线：${star.anchors.map((anchor) => anchor.title).join('、')}`
      : star.novel
        ? '尚未接上主线里程碑（新方向）'
        : '';
  return [star.entry.title, formatDate(star.entry.date), anchorLine, star.position]
    .filter(Boolean)
    .join('\n');
}

function linkPath(from: Point & { radius: number }, to: Point & { radius: number }): string {
  const x1 = from.x;
  const y1 = from.y + from.radius;
  const x2 = to.x;
  const y2 = to.y - to.radius;
  const middle = (y1 + y2) / 2;
  return `M ${x1} ${y1} C ${x1} ${middle}, ${x2} ${middle}, ${x2} ${y2}`;
}

function labelWeight(char: string): number {
  return /[\u2E80-\u9FFF\uFF00-\uFFEF]/.test(char) ? 1 : 0.52;
}

/** 按可用宽度截断标签（中文占 1、英文约 0.5），避免等距节点标签互相压住 */
function truncateByWeight(title: string, maxWeight: number): string {
  let weight = 0;
  let result = '';
  for (const char of [...title]) {
    const next = weight + labelWeight(char);
    if (next > maxWeight) return `${result}…`;
    weight = next;
    result += char;
  }
  return title;
}

function chapterHeader(strip: ChapterStripData, width: number): JSX.Element {
  const stars = strip.stars.length;
  const novel = strip.novelCount;
  return (
    <g className="smn-strip-head" aria-hidden="true">
      <text className="smn-strip-index" x={20} y={strip.top + 20}>
        {String(strip.index + 1).padStart(2, '0')}
      </text>
      <text className="smn-strip-title" x={54} y={strip.top + 20}>
        {strip.chapter.title}
      </text>
      <text className="smn-strip-range" x={54} y={strip.top + 32}>
        {strip.chapter.dateStart.slice(0, 4)}–{strip.chapter.dateEnd.slice(0, 4)}
      </text>
      <text className="smn-strip-count mono" x={width - 16} y={strip.top + 20} textAnchor="end">
        {stars > 0 ? `${stars} 星标${novel > 0 ? ` · ${novel} 新方向` : ''}` : '暂无星标'}
      </text>
    </g>
  );
}

function MainlineLabel({
  node,
  networkWidth,
  maxWeight,
}: {
  node: MainlineNodePlacement;
  networkWidth: number;
  maxWeight: number;
}): JSX.Element {
  void networkWidth;
  return (
    <text className="smn-mainline-label" y={-node.radius - 7} textAnchor="middle">
      {truncateByWeight(node.entry.title, maxWeight)}
    </text>
  );
}

export function StarMainlineNetwork({
  network,
  selectedId,
  onSelect,
}: StarMainlineNetworkProps): JSX.Element {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [dragPositions, setDragPositions] = useState<Map<string, Point>>(() => new Map());
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [hoveredStar, setHoveredStar] = useState<string | null>(null);
  const [hoveredMainline, setHoveredMainline] = useState<string | null>(null);
  const dragRef = useRef<DragState | null>(null);

  // 星标集合变化时清掉已不存在的拖拽位置
  useEffect(() => {
    const valid = new Set(network.stars.map((star) => star.entry.id));
    setDragPositions((previous) => {
      let changed = false;
      const next = new Map<string, Point>();
      for (const [id, point] of previous) {
        if (!valid.has(id)) {
          changed = true;
          continue;
        }
        next.set(id, point);
      }
      return changed ? next : previous;
    });
  }, [network.stars]);

  const mainlineById = useMemo(() => {
    const map = new Map<string, MainlineNodePlacement>();
    for (const strip of network.strips) {
      for (const node of strip.mainline) map.set(node.entry.id, node);
    }
    return map;
  }, [network.strips]);

  const satelliteById = useMemo(() => {
    const map = new Map<string, StarPlacement>();
    for (const star of network.stars) {
      if (!star.isMainlineMilestone) map.set(star.entry.id, star);
    }
    return map;
  }, [network.stars]);

  const starPositions = useMemo(() => {
    const map = new Map<string, Point>();
    for (const star of network.stars) {
      map.set(star.entry.id, dragPositions.get(star.entry.id) ?? { x: star.x, y: star.y });
    }
    return map;
  }, [network.stars, dragPositions]);

  const activeStar = hoveredStar;
  const activeMainline = hoveredMainline;

  const linkState = (starId: string, mainlineId: string): string => {
    if (activeStar) {
      return activeStar === starId ? ' is-active' : ' is-dim';
    }
    if (activeMainline) {
      return activeMainline === mainlineId ? ' is-active' : ' is-dim';
    }
    return '';
  };

  const isStarDim = (starId: string): boolean => {
    if (activeStar && activeStar !== starId) return true;
    if (activeMainline) {
      const star = satelliteById.get(starId);
      const links = star?.anchors.some((anchor) => anchor.id === activeMainline);
      if (!links) return true;
    }
    return false;
  };

  const beginDrag = (event: ReactPointerEvent<SVGGElement>, star: StarPlacement): void => {
    if (event.button !== 0 && event.pointerType === 'mouse') return;
    event.stopPropagation();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    const origin = starPositions.get(star.entry.id) ?? { x: star.x, y: star.y };
    dragRef.current = {
      id: star.entry.id,
      origin,
      startClientX: event.clientX,
      startClientY: event.clientY,
      moved: false,
    };
    setDraggingId(star.entry.id);
  };

  const moveDrag = (event: ReactPointerEvent<SVGGElement>): void => {
    const drag = dragRef.current;
    const svg = svgRef.current;
    if (!drag || !svg) return;
    const dx = event.clientX - drag.startClientX;
    const dy = event.clientY - drag.startClientY;
    if (!drag.moved && Math.hypot(dx, dy) < 4) return;
    drag.moved = true;
    const rect = svg.getBoundingClientRect();
    const scale = rect.width > 0 ? rect.width / network.width : 1;
    const x = Math.min(network.width - 44, Math.max(44, drag.origin.x + dx / scale));
    const y = Math.min(network.height - 28, Math.max(24, drag.origin.y + dy / scale));
    setDragPositions((previous) => {
      const next = new Map(previous);
      next.set(drag.id, { x, y });
      return next;
    });
  };

  const endDrag = (event: ReactPointerEvent<SVGGElement>, star: StarPlacement): void => {
    const drag = dragRef.current;
    dragRef.current = null;
    setDraggingId(null);
    if (!drag) return;
    if (!drag.moved) onSelect(star.entry.id);
    else event.stopPropagation();
  };

  const cancelDrag = (): void => {
    dragRef.current = null;
    setDraggingId(null);
  };

  const handleStarKeyDown = (event: KeyboardEvent<SVGGElement>, star: StarPlacement): void => {
    if (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar') {
      event.preventDefault();
      onSelect(star.entry.id);
    }
  };

  const handleMainlineKeyDown = (
    event: KeyboardEvent<SVGGElement>,
    node: MainlineNodePlacement,
  ): void => {
    if (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar') {
      event.preventDefault();
      onSelect(node.entry.id);
    }
  };

  const resetDrag = (): void => setDragPositions(new Map());

  return (
    <div className="smn-root">
      <div className="smn-toolbar">
        <ul className="smn-legend" aria-label="图例">
          <li>
            <span className="smn-legend-mainline" aria-hidden="true" />
            主线里程碑
          </li>
          <li>
            <span className="smn-legend-star" aria-hidden="true">
              ★
            </span>
            星标
          </li>
          <li>
            <span className="smn-legend-novel" aria-hidden="true">
              ★
            </span>
            新方向（未接上主线）
          </li>
          <li className="smn-legend-hint">拖动星标可调整位置 · 点击看详情</li>
        </ul>
        {dragPositions.size > 0 && (
          <button type="button" className="smn-reset" onClick={resetDrag}>
            复位拖拽
          </button>
        )}
      </div>

      <div className="smn-scroll">
        <svg
          ref={svgRef}
          className="smn-svg"
          viewBox={`0 0 ${network.width} ${network.height}`}
          width={network.width}
          height={network.height}
          role="img"
          aria-label={`主线网络：${network.stats.mainline} 个主线里程碑、${network.stats.stars} 条星标；${network.stats.connected} 条接上主线，${network.stats.novel} 条新方向。星标节点可拖动，点击查看详情。`}
        >
          {network.strips.map((strip) => {
            const isEven = strip.index % 2 === 0;
            const first = strip.mainline[0];
            const last = strip.mainline[strip.mainline.length - 1];
            const spacing =
              strip.mainline.length > 1 && first && last
                ? (last.x - first.x) / (strip.mainline.length - 1)
                : 220;
            const mainlineLabelWeight = Math.min(14, Math.max(7, Math.floor(spacing / 12)));
            return (
              <g key={strip.chapter.id} className={`smn-strip${isEven ? ' is-even' : ''}`}>
                <rect
                  className="smn-strip-bg"
                  x={8}
                  y={strip.top}
                  width={network.width - 16}
                  height={strip.height}
                  rx={12}
                />
                {chapterHeader(strip, network.width)}

                {first && last && (
                  <line
                    className="smn-spine"
                    x1={Math.max(24, first.x - 22)}
                    x2={Math.min(network.width - 24, last.x + 22)}
                    y1={strip.mainlineY}
                    y2={strip.mainlineY}
                  />
                )}

                {/* 星标 → 主线连线 */}
                <g className="smn-star-links">
                  {strip.links.map((link) => {
                    const star = satelliteById.get(link.starId);
                    const anchor = mainlineById.get(link.mainlineId);
                    const starPoint = starPositions.get(link.starId);
                    if (!star || !anchor || !starPoint) return null;
                    const state = linkState(link.starId, link.mainlineId);
                    const tier = link.anchored ? link.tier : 'weak';
                    return (
                      <path
                        key={`${link.starId}-${link.mainlineId}`}
                        className={`smn-link is-${tier}${link.anchored ? '' : ' is-provisional'}${state}`}
                        d={linkPath(anchor, { ...starPoint, radius: star.radius })}
                      >
                        <title>
                          {link.anchored
                            ? `接上主线：${link.reasons.join('；')}`
                            : '新方向：还没有直接接上主线里程碑'}
                        </title>
                      </path>
                    );
                  })}
                </g>

                {/* 主线节点 */}
                <g className="smn-mainline-nodes">
                  {strip.mainline.map((node) => {
                    const starred = node.starred;
                    const selected = selectedId === node.entry.id;
                    const dim = activeMainline !== null && activeMainline !== node.entry.id;
                    return (
                      <g
                        key={node.entry.id}
                        className={`smn-mainline-node${starred ? ' is-starred' : ''}${
                          node.nudged ? ' is-nudged' : ''
                        }${selected ? ' is-selected' : ''}${dim ? ' is-dim' : ''}`}
                        style={{ transform: `translate(${node.x}px, ${node.y}px)` }}
                        tabIndex={0}
                        role="button"
                        aria-label={`主线里程碑：${node.entry.title}（${formatDate(node.entry.date)}）${
                          starred ? '，已加星' : ''
                        }`}
                        onPointerEnter={() => setHoveredMainline(node.entry.id)}
                        onPointerLeave={() => setHoveredMainline(null)}
                        onClick={() => onSelect(node.entry.id)}
                        onKeyDown={(event) => handleMainlineKeyDown(event, node)}
                      >
                        {starred && <circle className="smn-mainline-star-ring" r={node.radius + 5} />}
                        <circle
                          className="smn-mainline-dot"
                          r={node.radius}
                          fill={categoryColor(primaryCategory(node.entry.categories))}
                        />
                        <MainlineLabel
                          node={node}
                          networkWidth={network.width}
                          maxWeight={mainlineLabelWeight}
                        />
                        {starred && (
                          <text className="smn-mainline-star-glyph" x={node.radius + 6} y={0}>
                            ★
                          </text>
                        )}
                        <title>
                          {node.entry.title}
                          {'\n'}
                          {formatDate(node.entry.date)} · 主线里程碑 · 影响力 {node.entry.importance}/10
                          {starred ? '\n已加星' : ''}
                        </title>
                      </g>
                    );
                  })}
                </g>

                {/* 星标节点 */}
                <g className="smn-stars">
                  {strip.satellites.map((star) => {
                    const point = starPositions.get(star.entry.id) ?? { x: star.x, y: star.y };
                    const dragging = draggingId === star.entry.id;
                    const hovered = hoveredStar === star.entry.id;
                    const dim = isStarDim(star.entry.id);
                    return (
                      <g
                        key={star.entry.id}
                        className={`smn-star-node${star.novel ? ' is-novel' : ''}${
                          dragging ? ' is-dragging' : ''
                        }${hovered ? ' is-hover' : ''}${dim ? ' is-dim' : ''}`}
                        style={{ transform: `translate(${point.x}px, ${point.y}px)` }}
                        tabIndex={0}
                        role="button"
                        aria-label={`星标：${star.entry.title}（${formatDate(star.entry.date)}）${
                          star.novel ? '，新方向' : '，接上主线'
                        }`}
                        onPointerDown={(event) => beginDrag(event, star)}
                        onPointerMove={moveDrag}
                        onPointerUp={(event) => endDrag(event, star)}
                        onPointerCancel={cancelDrag}
                        onPointerEnter={() => setHoveredStar(star.entry.id)}
                        onPointerLeave={() => setHoveredStar(null)}
                        onKeyDown={(event) => handleStarKeyDown(event, star)}
                      >
                        <circle className="smn-star-hit" r={star.radius + 8} />
                        {star.novel && <circle className="smn-star-ring" r={star.radius + 4} />}
                        {star.novel && (
                          <text className="smn-star-tag" x={star.radius + 6} y={2}>
                            新方向
                          </text>
                        )}
                        <circle className="smn-star-dot" r={star.radius} />
                        <text className="smn-star-glyph" dy="0.34em">
                          ★
                        </text>
                        <text className="smn-star-label" y={star.radius + 14}>
                          {truncateByWeight(star.entry.title, 12)}
                        </text>
                        <title>{starTooltip(star)}</title>
                      </g>
                    );
                  })}
                </g>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
