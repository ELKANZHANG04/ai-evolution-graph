import { Fragment, useEffect, useRef, useState } from 'react';
import type { JSX, KeyboardEvent as ReactKeyboardEvent } from 'react';
import { EmptyState } from '../common/EmptyState';
import type { Entry, EntryType, Maturity } from '../../lib/types';
import type { ThoughtChainData, ThoughtStepData } from '../../lib/thoughtChains';
import { roleLabel } from '../../lib/thoughtChains';
import './thoughts.css';

export interface ThoughtBoardProps {
  chains: ThoughtChainData[];
  selectedId: string | null;
  onSelect: (entry: Entry) => void;
}

/** 链底部「相关实践」最多展示的 chips 数 */
const MAX_CONTEXT = 3;
/** NEW 徽标时间窗（近 7 天入库） */
const NEW_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
/** 创新雷达筛选态的固定 filter 值（主题 id 不会是这两个值） */
const FILTER_ALL = 'all';
const FILTER_RADAR = 'radar';

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

/** added_at 距今 ≤7 天（没有 added_at 的种子数据不算 NEW） */
function isNewEntry(entry: Entry, now: number = Date.now()): boolean {
  if (!entry.added_at) return false;
  const stamp = Date.parse(`${entry.added_at}T00:00:00`);
  if (Number.isNaN(stamp)) return false;
  const diff = now - stamp;
  return diff >= 0 && diff <= NEW_WINDOW_MS;
}

interface StepCardProps {
  step: ThoughtStepData;
  selected: boolean;
  onSelect: (entry: Entry) => void;
}

function StepCard({ step, selected, onSelect }: StepCardProps): JSX.Element {
  const { entry, role } = step;
  const isInsight = entry.type === 'insight';
  const roleText = roleLabel(role);
  const year = yearOf(entry.date);
  const kind = KIND_LABEL[entry.type] ?? '事件';

  // 创新雷达标注
  const isInnovation = entry.innovation === true;
  const maturity = entry.maturity;
  const isNew = isNewEntry(entry);
  const isPinned = entry.thought_pin === 'top';
  const underrated = isInnovation ? (entry.why_underrated?.trim() ?? '') : '';

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
      aria-label={`${kind} · ${title}（${year}）· ${roleText}${isInnovation ? ' · 创新雷达' : ''}`}
      aria-current={selected ? 'true' : undefined}
      data-entry-id={entry.id}
      data-role={role}
      data-innovation={isInnovation ? 'true' : undefined}
      data-pinned={isPinned ? 'true' : undefined}
      data-new={isNew ? 'true' : undefined}
      onClick={() => onSelect(entry)}
      onKeyDown={handleKeyDown}
    >
      {isPinned && <span className="tb-pin">新路线</span>}

      <div className="tb-card-top">
        <span className="tb-year mono">{year}</span>
        <span className="tb-role-badge">{roleText}</span>
        <span className="tb-kind">{kind}</span>
      </div>

      {(isInnovation || isNew) && (
        <div className="tb-card-tags">
          {isInnovation && <span className="tb-radar-badge">创新雷达</span>}
          {isInnovation && maturity && (
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
  steps: ThoughtStepData[];
  radarMode: boolean;
  selectedId: string | null;
  onSelect: (entry: Entry) => void;
}

function ThemeSection({
  chain,
  index,
  steps,
  radarMode,
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
  }, [chain.steps.length, steps.length, radarMode]);

  // 切换筛选态后回到链首，避免停留在旧滚动位置
  useEffect(() => {
    const track = trackRef.current;
    if (track) track.scrollLeft = 0;
  }, [steps.length, radarMode]);

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
    <section className="tb-theme" aria-labelledby={titleId} data-theme-id={chain.id}>
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
        </div>
        <p className="tb-theme-meta">
          {radarMode ? (
            <>
              <span className="mono">{steps.length}</span> 条创新 · 共{' '}
              <span className="mono">{chain.steps.length}</span> 步
            </>
          ) : (
            <>
              <span className="mono">{chain.steps.length}</span> 步 ·{' '}
              <span className="mono">{insightCount}</span> 条思想
            </>
          )}
        </p>
      </header>

      <div className="tb-track" ref={trackRef}>
        {steps.length === 0 && <p className="tb-theme-empty">暂无条目，待补充</p>}
        {steps.map((step, stepIndex) => (
          <Fragment key={step.entry.id}>
            {!radarMode && stepIndex > 0 && (
              <div className={`tb-arrow tb-role-${step.role}`} aria-hidden="true">
                <span className="tb-arrow-glyph">→</span>
                <span className="tb-arrow-label">{step.arrow}</span>
              </div>
            )}
            <StepCard step={step} selected={selectedId === step.entry.id} onSelect={onSelect} />
          </Fragment>
        ))}
      </div>

      {scrollState.scrollable && (
        <div className="tb-track-nav">
          <button
            type="button"
            className="tb-track-next"
            onClick={() => scrollBy(scrollState.atEnd ? -1 : 1)}
          >
            {scrollState.atEnd
              ? '← 回到开头'
              : `横向滚动查看全部 ${steps.length} ${radarMode ? '条' : '步'} →`}
          </button>
        </div>
      )}

      {!radarMode && context.length > 0 && (
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

/** 思想看板 v3：11 个主题纵向分区 + 创新雷达筛选（创新卡标注 / 新路线置顶） */
export function ThoughtBoard({ chains, selectedId, onSelect }: ThoughtBoardProps): JSX.Element {
  const [activeFilter, setActiveFilter] = useState<string>(FILTER_ALL);

  const totalSteps = chains.reduce((sum, chain) => sum + chain.steps.length, 0);
  const innovationCount = chains.reduce(
    (sum, chain) => sum + chain.steps.filter((step) => step.entry.innovation === true).length,
    0,
  );

  const isRadar = activeFilter === FILTER_RADAR;
  const activeChain =
    !isRadar && activeFilter !== FILTER_ALL
      ? chains.find((chain) => chain.id === activeFilter) ?? null
      : null;
  const themeMode = activeChain !== null;
  const allMode = !isRadar && !themeMode;

  const themeViews = chains
    .map((chain, index) => ({
      chain,
      index,
      steps: isRadar ? chain.steps.filter((step) => step.entry.innovation === true) : chain.steps,
    }))
    .filter(({ chain, steps }) => {
      if (isRadar) return steps.length > 0;
      if (themeMode) return chain.id === activeChain.id;
      return true;
    });

  if (chains.length === 0 || totalSteps === 0) {
    return (
      <div className="tb-board tb-board-empty">
        <EmptyState title="暂无思想条目" description="新的思想与观点正在整理中，稍后补充。" />
      </div>
    );
  }

  return (
    <div className="tb-board">
      <div className="tb-filter" role="group" aria-label="按思想主题筛选">
        <button
          type="button"
          className={`tb-filter-chip${allMode ? ' is-active' : ''}`}
          aria-pressed={allMode}
          onClick={() => setActiveFilter(FILTER_ALL)}
        >
          <span className="tb-filter-name">全部主题</span>
          <span className="tb-filter-count mono">{totalSteps}</span>
        </button>

        <button
          type="button"
          className={`tb-filter-chip is-radar${isRadar ? ' is-active' : ''}`}
          aria-pressed={isRadar}
          data-filter="radar"
          title="只显示尚未被充分重视的新想法"
          onClick={() => setActiveFilter(isRadar ? FILTER_ALL : FILTER_RADAR)}
        >
          <span className="tb-radar-dot" aria-hidden="true" />
          <span className="tb-filter-name">创新雷达</span>
          <span className="tb-filter-count mono">{innovationCount}</span>
        </button>

        {chains.map((chain, index) => {
          const isActive = activeChain?.id === chain.id;
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

      {isRadar && (
        <p className="tb-radar-hint" role="status">
          <span className="tb-radar-hint-dot" aria-hidden="true" />
          <span>
            创新雷达：只显示尚未被充分重视的新想法（<strong>{innovationCount}</strong> 条）。它们已置顶在所属主题；点卡片看完整论证。
          </span>
        </p>
      )}

      {isRadar && themeViews.length === 0 && (
        <p className="tb-radar-empty">暂无创新雷达条目，等待数据补充。</p>
      )}

      {themeViews.map(({ chain, index, steps }) => (
        <ThemeSection
          key={chain.id}
          chain={chain}
          index={index}
          steps={steps}
          radarMode={isRadar}
          selectedId={selectedId}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
