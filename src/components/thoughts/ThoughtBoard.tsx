import { useEffect, useMemo, useRef, useState } from 'react';
import type { JSX, KeyboardEvent as ReactKeyboardEvent } from 'react';
import { ImportanceBadge } from '../common/Badges';
import { CategoryChips, TypeBadge } from '../common/Badges';
import { EmptyState } from '../common/EmptyState';
import type { Entry } from '../../lib/types';
import type { ThoughtChainData, ThoughtStepData } from '../../lib/thoughtChains';
import { themeFreshness } from '../../lib/thoughtFreshness';
import { ThemeMindMap } from './ThemeMindMap';
import type { ThemeFreshness, ThemeYearBucket } from '../../lib/thoughtFreshness';
import { categoryColor, primaryCategory } from '../../theme/categories';
import './thoughts.css';

export interface ThoughtBoardProps {
  chains: ThoughtChainData[];
  selectedId: string | null;
  onSelect: (entry: Entry) => void;
}

/** 链底部「相关实践」最多展示的 chips 数 */
const MAX_CONTEXT = 3;
/** 筛选状态（主题 id 不会取这个值） */
const FILTER_ALL = 'all';
/** 突破点：importance ≥ 9（与主线一致） */
const BREAKTHROUGH_THRESHOLD = 9;
const LANDMARK_SCORE = 10;

/** 2022-03-29 → 2022 */
function yearOf(date: string): string {
  return date ? date.slice(0, 4) : '—';
}

function padNo(index: number): string {
  return String(index + 1).padStart(2, '0');
}

interface YearStripProps {
  buckets: ThemeYearBucket[];
}

/** 年份活动条：2012 → 今年每年一个刻度，有讨论的年份点亮，最近两年高亮 */
function YearStrip({ buckets }: YearStripProps): JSX.Element {
  const first = buckets[0]?.year;
  const last = buckets[buckets.length - 1]?.year;
  const litYears = buckets.filter((bucket) => bucket.count > 0);
  const label =
    litYears.length > 0
      ? `${first}–${last} 年讨论分布：${litYears.map((bucket) => `${bucket.year} 年 ${bucket.count} 条`).join('，')}`
      : `${first}–${last} 年暂无讨论`;

  return (
    <div className="tb-years-wrap">
      <div className="tb-years" role="img" aria-label={label}>
        {buckets.map((bucket) => (
          <span
            key={bucket.year}
            className={[
              'tb-year-tick',
              bucket.count > 0 ? 'is-on' : '',
              bucket.recent ? 'is-recent' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            title={`${bucket.year} 年${bucket.count > 0 ? ` · ${bucket.count} 条讨论` : ' · 暂无'}`}
            data-year={bucket.year}
            data-count={bucket.count}
          />
        ))}
      </div>
      <span className="tb-years-range mono" aria-hidden="true">
        {first}–{last}
      </span>
    </div>
  );
}

interface StepCardProps {
  step: ThoughtStepData;
  selected: boolean;
  onSelect: (entry: Entry) => void;
}

/**
 * 思想卡：与主线里程碑卡同一套标注——年份、类型、影响力分数、类别、一句话主张 + 概括。
 * 不再使用「命题/推进/修正/反驳」角色标签，也不再用置顶/雷达/成熟度徽标抢注意力；
 * 视觉强调只由重要性决定（≥9 突破、=10 里程碑）。
 */
function StepCard({ step, selected, onSelect }: StepCardProps): JSX.Element {
  const { entry } = step;
  const isInsight = entry.type === 'insight';
  const year = yearOf(entry.date);
  const breakthrough = entry.importance >= BREAKTHROUGH_THRESHOLD;
  const landmark = entry.importance >= LANDMARK_SCORE;

  const claim = entry.thought_claim?.trim() ?? '';
  const title = claim || entry.title;
  const thought = isInsight
    ? entry.thought_summary?.trim() || entry.significance?.trim() || entry.summary
    : entry.summary;
  const byline = [entry.speaker, entry.occasion].filter(Boolean).join(' · ');
  const quote = isInsight ? (entry.quote?.trim() ?? '') : '';
  const showQuote = quote.length > 0;

  // 原文默认折叠 2 行；只有真正溢出时才出现「展开原文」按钮
  const [expanded, setExpanded] = useState(false);
  const [canExpand, setCanExpand] = useState(false);
  const quoteRef = useRef<HTMLParagraphElement | null>(null);

  useEffect(() => {
    if (!showQuote || expanded) return undefined;
    const node = quoteRef.current;
    if (!node) return undefined;
    const measure = () => {
      if (node.scrollHeight > node.clientHeight + 1) setCanExpand(true);
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [showQuote, expanded, quote]);

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLElement>) => {
    // 展开按钮等内部控件自己处理键盘，不冒泡成打开详情
    if (event.target !== event.currentTarget) return;
    if (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar') {
      event.preventDefault();
      onSelect(entry);
    }
  };

  const className = [
    'tb-card',
    breakthrough ? 'is-breakthrough' : '',
    landmark ? 'is-landmark' : '',
    selected ? 'is-selected' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <article
      className={className}
      role="button"
      tabIndex={0}
      aria-label={`${isInsight ? '观点' : entry.type === 'product' ? '产品' : '事件'} · ${title}（${year}）· 影响力 ${entry.importance}/10`}
      aria-current={selected ? 'true' : undefined}
      data-entry-id={entry.id}
      data-date={entry.date}
      data-importance={entry.importance}
      data-type={entry.type}
      style={{ borderLeftColor: categoryColor(primaryCategory(entry.categories)) }}
      onClick={() => onSelect(entry)}
      onKeyDown={handleKeyDown}
    >
      <div className="tb-card-top">
        <span className="tb-year mono">{year}</span>
        <TypeBadge type={entry.type} />
        <ImportanceBadge value={entry.importance} />
      </div>

      <p className={`tb-claim${claim ? '' : ' is-title'}`} title={entry.title}>
        {title}
      </p>
      <p className="tb-card-summary">{thought}</p>

      {isInsight && byline && (
        <p className="tb-byline" title={byline}>
          {byline}
        </p>
      )}

      {showQuote && (
        <div className="tb-quote-block">
          <p ref={quoteRef} className={`tb-quote${expanded ? ' is-expanded' : ''}`}>
            “{quote}”
          </p>
          {canExpand && (
            <button
              type="button"
              className="tb-quote-toggle"
              aria-expanded={expanded}
              onClick={(event) => {
                event.stopPropagation();
                setExpanded((value) => !value);
              }}
              onKeyDown={(event) => event.stopPropagation()}
            >
              {expanded ? '收起原文 ▴' : '展开原文 ▾'}
            </button>
          )}
        </div>
      )}

      <footer className="tb-card-foot">
        <CategoryChips categories={entry.categories} max={2} />
        <span className="tb-card-link">看详情 →</span>
      </footer>
    </article>
  );
}

type BoardView = 'map' | 'board';

interface ThemeSectionProps {
  chain: ThoughtChainData;
  index: number;
  freshness: ThemeFreshness;
  view: BoardView;
  selectedId: string | null;
  onSelect: (entry: Entry) => void;
}

function ThemeSection({
  chain,
  index,
  freshness,
  view,
  selectedId,
  onSelect,
}: ThemeSectionProps): JSX.Element {
  const titleId = `tb-theme-title-${chain.id}`;
  const insightCount = chain.steps.filter((step) => step.entry.type === 'insight').length;
  const context = chain.context.slice(0, MAX_CONTEXT);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [scrollState, setScrollState] = useState({ scrollable: false, atEnd: false });

  // 步骤多时横向滚动：只在实际溢出时显示「横向滚动」提示，避免误报
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return undefined;
    const update = () => {
      const max = track.scrollWidth - track.clientWidth;
      setScrollState({ scrollable: max > 8, atEnd: track.scrollLeft >= max - 8 });
    };
    update();
    track.addEventListener('scroll', update, { passive: true });
    let observer: ResizeObserver | undefined;
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(update);
      observer.observe(track);
    }
    return () => {
      track.removeEventListener('scroll', update);
      observer?.disconnect();
    };
  }, [chain.steps.length]);

  const scrollBy = (direction: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;
    const reduceMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const step = direction === 1 ? Math.max(280, track.clientWidth * 0.8) : -track.scrollWidth;
    track.scrollBy({ left: step, behavior: reduceMotion ? 'auto' : 'smooth' });
  };

  return (
    <section
      className="tb-theme"
      aria-labelledby={titleId}
      data-theme-id={chain.id}
      data-latest={freshness.latestMonth ?? ''}
    >
      <header className="tb-theme-head">
        <div className="tb-theme-main">
          <p className="tb-theme-kicker">
            <span className="tb-theme-no mono">{padNo(index)}</span>
            <span>思想主题</span>
          </p>
          <h2 className="tb-theme-title" id={titleId}>
            {chain.title}
          </h2>
          <p className="tb-theme-q">{chain.question}</p>
          <p className="tb-theme-desc">{chain.description}</p>
          {freshness.newDirections.length > 0 && (
            <p className="tb-theme-new">
              <span className="tb-theme-new-label">新方向：</span>
              {freshness.newDirections.map((direction) => (
                <span className="tb-theme-new-item" key={direction} title={direction}>
                  {direction}
                </span>
              ))}
            </p>
          )}
        </div>
        <div className="tb-theme-side">
          <p className="tb-theme-meta">
            <span className="mono">{chain.steps.length}</span> 步 ·{' '}
            <span className="mono">{insightCount}</span> 观点 · 最新{' '}
            <span className="mono">{freshness.latestMonth ?? '—'}</span>
          </p>
          <YearStrip buckets={freshness.yearBuckets} />
        </div>
      </header>

      {view === 'board' ? (
        <>
          <div className="tb-track" ref={trackRef}>
            {chain.steps.length === 0 && <p className="tb-theme-empty">暂无条目，待补充</p>}
            {chain.steps.map((step) => (
              <StepCard
                key={step.entry.id}
                step={step}
                selected={selectedId === step.entry.id}
                onSelect={onSelect}
              />
            ))}
          </div>

          <p className="tb-track-order">时间倒序：最左为最新，向右逐步回溯</p>

          {scrollState.scrollable && (
            <div className="tb-track-nav">
              <button
                type="button"
                className="tb-track-next"
                onClick={() => scrollBy(scrollState.atEnd ? -1 : 1)}
              >
                {scrollState.atEnd ? '← 回到开头' : `向右回溯更早的 ${chain.steps.length} 步 →`}
              </button>
            </div>
          )}
        </>
      ) : (
        <ThemeMindMap
          themeId={chain.id}
          themeTitle={chain.title}
          branches={chain.branches}
          selectedId={selectedId}
          onSelect={onSelect}
        />
      )}

      {context.length > 0 && (
        <footer className="tb-theme-context">
          <span className="tb-context-label">相关实践</span>
          <ul className="tb-context-list">
            {context.map((entry) => (
              <li key={entry.id}>
                <button
                  type="button"
                  className="tb-context-chip"
                  title={`${entry.title} · ${entry.date}`}
                  onClick={() => onSelect(entry)}
                >
                  {entry.title}
                </button>
              </li>
            ))}
          </ul>
        </footer>
      )}
    </section>
  );
}

/** 思想看板 v5：11 个主题纵向分区 + 时间倒序；标注方式与主线一致（重要性决定视觉强调） */
export function ThoughtBoard({ chains, selectedId, onSelect }: ThoughtBoardProps): JSX.Element {
  const [activeFilter, setActiveFilter] = useState<string>(FILTER_ALL);
  const [view, setView] = useState<BoardView>('map');
  const now = useMemo(() => new Date(), []);

  const freshnessById = useMemo(() => {
    const map = new Map<string, ThemeFreshness>();
    for (const chain of chains) map.set(chain.id, themeFreshness(chain, now));
    return map;
  }, [chains, now]);

  const totalSteps = chains.reduce((sum, chain) => sum + chain.steps.length, 0);
  const isThemeFilter = chains.some((chain) => chain.id === activeFilter);
  const allMode = !isThemeFilter;

  const themeViews = chains
    .map((chain, index) => ({ chain, index, freshness: freshnessById.get(chain.id) }))
    .filter(
      (view): view is { chain: ThoughtChainData; index: number; freshness: ThemeFreshness } =>
        view.freshness !== undefined,
    )
    .filter(({ chain }) => (allMode ? true : chain.id === activeFilter));

  if (chains.length === 0 || totalSteps === 0) {
    return (
      <div className="tb-board tb-board-empty">
        <EmptyState title="暂无思想条目" description="新的思想与观点正在整理中，稍后补充。" />
      </div>
    );
  }

  return (
    <div className="tb-board">
      <div className="tb-viewbar">
        <div className="tb-view-toggle" role="group" aria-label="视图切换">
          <button
            type="button"
            className={`tb-view-btn${view === 'map' ? ' is-active' : ''}`}
            aria-pressed={view === 'map'}
            onClick={() => setView('map')}
          >
            思维导图
          </button>
          <button
            type="button"
            className={`tb-view-btn${view === 'board' ? ' is-active' : ''}`}
            aria-pressed={view === 'board'}
            onClick={() => setView('board')}
          >
            看板
          </button>
        </div>
        <span className="tb-view-hint">每个主题一张导图：根 → 子方向 → 思想（最新在前）</span>
      </div>

      <div className="tb-filter" role="group" aria-label="按思想主题筛选">
        <button
          type="button"
          className={`tb-filter-chip${allMode ? ' is-active' : ''}`}
          aria-pressed={allMode}
          title={`${chains.length} 个思想主题`}
          onClick={() => setActiveFilter(FILTER_ALL)}
        >
          <span className="tb-filter-name">全部主题</span>
          <span className="tb-filter-count mono">{chains.length}</span>
        </button>

        {chains.map((chain, index) => {
          const isActive = activeFilter === chain.id;
          return (
            <button
              key={chain.id}
              type="button"
              className={`tb-filter-chip${isActive ? ' is-active' : ''}`}
              aria-pressed={isActive}
              title={chain.question}
              data-theme-id={chain.id}
              onClick={() => setActiveFilter(isActive ? FILTER_ALL : chain.id)}
            >
              <span className="tb-filter-no mono">{padNo(index)}</span>
              <span className="tb-filter-name">{chain.title}</span>
              <span className="tb-filter-count mono">{chain.steps.length}</span>
            </button>
          );
        })}
      </div>

      {themeViews.map(({ chain, index, freshness }) => (
        <ThemeSection
          key={chain.id}
          chain={chain}
          index={index}
          freshness={freshness}
          view={view}
          selectedId={selectedId}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
