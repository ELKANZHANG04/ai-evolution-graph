import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import type { JSX, KeyboardEvent as ReactKeyboardEvent } from 'react';
import { ImportanceBadge } from '../common/Badges';
import { EmptyState } from '../common/EmptyState';
import type { Entry, EntryType, Maturity } from '../../lib/types';
import type { ThoughtChainData, ThoughtStepData } from '../../lib/thoughtChains';
import { roleLabel } from '../../lib/thoughtChains';
import { themeFreshness } from '../../lib/thoughtFreshness';
import type { ThemeFreshness, ThemeYearBucket } from '../../lib/thoughtFreshness';
import './thoughts.css';

export interface ThoughtBoardProps {
  chains: ThoughtChainData[];
  selectedId: string | null;
  onSelect: (entry: Entry) => void;
}

/** 链底部「相关实践」最多展示的 chips 数 */
const MAX_CONTEXT = 3;
const DAY_MS = 24 * 60 * 60 * 1000;
/** NEW 徽标时间窗（近 7 天入库） */
const NEW_WINDOW_MS = 7 * DAY_MS;
/** 卡片雷达徽标时间窗：新入库 30 天内的代表条目才逐条标注 */
const RADAR_WINDOW_MS = 30 * DAY_MS;
/** 筛选状态（主题 id 不会取这三个值） */
const FILTER_ALL = 'all';
const FILTER_ACTIVE = 'active';
const FILTER_STALE = 'stale';

const KIND_LABEL: Record<EntryType, string> = {
  insight: '观点',
  event: '事件',
  product: '产品',
};

const MATURITY_LABEL: Record<Maturity, string> = {
  paper: '论文',
  prototype: '原型',
  product: '产品',
};

/** 2022-03-29 → 2022 */
function yearOf(date: string): string {
  return date ? date.slice(0, 4) : '—';
}

function padNo(index: number): string {
  return String(index + 1).padStart(2, '0');
}

/** date（YYYY-MM-DD）距今是否在 windowMs 内；没有日期或未来日期返回 false */
function isWithinWindow(date: string | undefined, windowMs: number, now: number): boolean {
  if (!date) return false;
  const stamp = Date.parse(`${date}T00:00:00`);
  if (Number.isNaN(stamp)) return false;
  const diff = now - stamp;
  return diff >= 0 && diff <= windowMs;
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
  now: number;
  onSelect: (entry: Entry) => void;
}

function StepCard({ step, selected, now, onSelect }: StepCardProps): JSX.Element {
  const { entry, role } = step;
  const isInsight = entry.type === 'insight';
  const roleText = roleLabel(role);
  const year = yearOf(entry.date);
  const kind = KIND_LABEL[entry.type] ?? '事件';

  // 创新雷达：不逐条铺标签——只有「代表条目（置顶）」或「近 30 天新入库」才显示雷达徽标
  const isInnovation = entry.innovation === true;
  const maturity = entry.maturity;
  const isPinned = entry.thought_pin === 'top';
  const isNew = isWithinWindow(entry.added_at, NEW_WINDOW_MS, now);
  const showRadar = isInnovation && (isPinned || isWithinWindow(entry.added_at, RADAR_WINDOW_MS, now));
  const underrated = showRadar ? (entry.why_underrated?.trim() ?? '') : '';

  // 思想优先：主张当标题、概括当正文；事件卡退回标题 + summary
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
    isInsight ? 'tb-card-insight' : 'tb-card-event',
    isInnovation ? 'is-innovation' : '',
    `tb-role-${role}`,
    selected ? 'is-selected' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <article
      className={className}
      role="button"
      tabIndex={0}
      aria-label={`${kind} · ${title}（${year}）· 影响力 ${entry.importance}/10 · ${roleText}${showRadar ? ' · 创新雷达' : ''}`}
      aria-current={selected ? 'true' : undefined}
      data-entry-id={entry.id}
      data-date={entry.date}
      data-role={role}
      data-importance={entry.importance}
      data-innovation={isInnovation ? 'true' : undefined}
      data-radar={showRadar ? 'true' : undefined}
      data-pinned={isPinned ? 'true' : undefined}
      data-new={isNew ? 'true' : undefined}
      onClick={() => onSelect(entry)}
      onKeyDown={handleKeyDown}
    >
      {isPinned && <span className="tb-pin">新方向</span>}

      <div className="tb-card-top">
        <span className="tb-year mono">{year}</span>
        <span className="tb-role-badge">{roleText}</span>
        <span className="tb-card-facts">
          <span className="tb-importance" title={`影响力 ${entry.importance}/10`}>
            <ImportanceBadge value={entry.importance} />
            <span className="tb-importance-den mono" aria-hidden="true">
              /10
            </span>
          </span>
          <span className="tb-kind">{kind}</span>
        </span>
      </div>

      {(showRadar || isNew) && (
        <div className="tb-card-tags">
          {showRadar && <span className="tb-radar-badge">创新雷达</span>}
          {showRadar && maturity && (
            <span className={`tb-maturity tb-maturity-${maturity}`}>{MATURITY_LABEL[maturity]}</span>
          )}
          {isNew && <span className="badge badge-new tb-new">NEW</span>}
        </div>
      )}

      <p className={`tb-claim${claim ? '' : ' is-title'}`} title={entry.title}>
        {title}
      </p>
      <p className="tb-card-summary">{thought}</p>

      {underrated && (
        <p className="tb-underrated">
          <span className="tb-underrated-label">为什么被低估：</span>
          {underrated}
        </p>
      )}

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
        <span className="tb-card-link">看详情 →</span>
      </footer>
    </article>
  );
}

interface ThemeSectionProps {
  chain: ThoughtChainData;
  index: number;
  freshness: ThemeFreshness;
  now: number;
  selectedId: string | null;
  onSelect: (entry: Entry) => void;
}

function ThemeSection({
  chain,
  index,
  freshness,
  now,
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
      className={`tb-theme is-${freshness.status}`}
      aria-labelledby={titleId}
      data-theme-id={chain.id}
      data-status={freshness.status}
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
            <span className="mono">{freshness.latestMonth ?? '—'}</span> · 近 18 个月{' '}
            <span className="mono">{freshness.recentCount}</span> 条
          </p>
          <div className="tb-theme-activity">
            <span className={`tb-theme-status is-${freshness.status}`}>
              {freshness.status === 'active' ? '持续活跃' : '待补充'}
            </span>
            <YearStrip buckets={freshness.yearBuckets} />
          </div>
        </div>
      </header>

      <div className="tb-track" ref={trackRef}>
        {chain.steps.length === 0 && <p className="tb-theme-empty">暂无条目，待补充</p>}
        {chain.steps.map((step, stepIndex) => (
          <Fragment key={step.entry.id}>
            {stepIndex > 0 && (
              <div
                className={`tb-arrow tb-role-${chain.steps[stepIndex - 1].role} is-reverse`}
                aria-hidden="true"
              >
                <span className="tb-arrow-glyph">←</span>
                <span className="tb-arrow-label">{chain.steps[stepIndex - 1].arrow}</span>
              </div>
            )}
            <StepCard
              step={step}
              selected={selectedId === step.entry.id}
              now={now}
              onSelect={onSelect}
            />
          </Fragment>
        ))}
      </div>

      <p className="tb-track-order">↤ 时间倒序：最左为最新，向右逐步回溯</p>

      {scrollState.scrollable && (
        <div className="tb-track-nav">
          <button
            type="button"
            className="tb-track-next"
            onClick={() => scrollBy(scrollState.atEnd ? -1 : 1)}
          >
            {scrollState.atEnd
              ? '← 回到开头'
              : `横向滚动查看全部 ${chain.steps.length} 步 →`}
          </button>
        </div>
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

/** 思想看板 v4：主题持续被讨论 + 年份活动条 + 创新雷达融入主题 */
export function ThoughtBoard({ chains, selectedId, onSelect }: ThoughtBoardProps): JSX.Element {
  const [activeFilter, setActiveFilter] = useState<string>(FILTER_ALL);
  const now = useMemo(() => Date.now(), []);
  const today = useMemo(() => new Date(now), [now]);

  const freshnessById = useMemo(() => {
    const map = new Map<string, ThemeFreshness>();
    for (const chain of chains) map.set(chain.id, themeFreshness(chain, today));
    return map;
  }, [chains, today]);

  const totalSteps = chains.reduce((sum, chain) => sum + chain.steps.length, 0);
  const activeCount = chains.filter(
    (chain) => freshnessById.get(chain.id)?.status === 'active',
  ).length;
  const staleCount = chains.length - activeCount;

  const isStatusFilter = activeFilter === FILTER_ACTIVE || activeFilter === FILTER_STALE;
  const isThemeFilter = chains.some((chain) => chain.id === activeFilter);
  const allMode = activeFilter === FILTER_ALL || (!isStatusFilter && !isThemeFilter);

  const themeViews = chains
    .map((chain, index) => ({ chain, index, freshness: freshnessById.get(chain.id) }))
    .filter(
      (view): view is { chain: ThoughtChainData; index: number; freshness: ThemeFreshness } =>
        view.freshness !== undefined,
    )
    .filter(({ chain, freshness }) => {
      if (allMode) return true;
      if (activeFilter === FILTER_ACTIVE) return freshness.status === 'active';
      if (activeFilter === FILTER_STALE) return freshness.status === 'stale';
      return chain.id === activeFilter;
    });

  if (chains.length === 0 || totalSteps === 0) {
    return (
      <div className="tb-board tb-board-empty">
        <EmptyState title="暂无思想条目" description="新的思想与观点正在整理中，稍后补充。" />
      </div>
    );
  }

  const emptyHint =
    activeFilter === FILTER_STALE
      ? '所有主题都在持续活跃讨论中。'
      : activeFilter === FILTER_ACTIVE
        ? '暂无持续活跃主题，等待数据补充。'
        : '暂无符合筛选的主题。';

  return (
    <div className="tb-board">
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

        <button
          type="button"
          className={`tb-filter-chip${activeFilter === FILTER_ACTIVE ? ' is-active' : ''}`}
          aria-pressed={activeFilter === FILTER_ACTIVE}
          title="近 18 个月有新讨论的主题"
          data-filter="active"
          onClick={() => setActiveFilter(FILTER_ACTIVE)}
        >
          <span className="tb-status-dot is-active" aria-hidden="true" />
          <span className="tb-filter-name">持续活跃</span>
          <span className="tb-filter-count mono">{activeCount}</span>
        </button>

        <button
          type="button"
          className={`tb-filter-chip${activeFilter === FILTER_STALE ? ' is-active' : ''}`}
          aria-pressed={activeFilter === FILTER_STALE}
          title="近 18 个月没有新讨论、需要补充的主题"
          data-filter="stale"
          onClick={() => setActiveFilter(FILTER_STALE)}
        >
          <span className="tb-status-dot is-stale" aria-hidden="true" />
          <span className="tb-filter-name">待补充</span>
          <span className="tb-filter-count mono">{staleCount}</span>
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

      {themeViews.length === 0 && (
        <p className="tb-filter-empty" role="status">
          {emptyHint}
        </p>
      )}

      {themeViews.map(({ chain, index, freshness }) => (
        <ThemeSection
          key={chain.id}
          chain={chain}
          index={index}
          freshness={freshness}
          now={now}
          selectedId={selectedId}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
