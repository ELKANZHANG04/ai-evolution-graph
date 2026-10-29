import { Fragment, useEffect, useRef, useState } from 'react';
import type { JSX, KeyboardEvent as ReactKeyboardEvent } from 'react';
import { EmptyState } from '../common/EmptyState';
import type { Entry, EntryType } from '../../lib/types';
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

const KIND_LABEL: Record<EntryType, string> = {
  insight: '观点',
  event: '事件',
  product: '产品',
};

/** 2022-03-29 → 2022 */
function yearOf(date: string): string {
  return date ? date.slice(0, 4) : '—';
}

function padNo(index: number): string {
  return String(index + 1).padStart(2, '0');
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
      aria-label={`${kind} · ${title}（${year}）· ${roleText}`}
      aria-current={selected ? 'true' : undefined}
      data-entry-id={entry.id}
      data-role={role}
      onClick={() => onSelect(entry)}
      onKeyDown={handleKeyDown}
    >
      <div className="tb-card-top">
        <span className="tb-year mono">{year}</span>
        <span className="tb-role-badge">{roleText}</span>
        <span className="tb-kind">{kind}</span>
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
        <span className="tb-card-link">看详情 →</span>
      </footer>
    </article>
  );
}


interface ThemeSectionProps {
  chain: ThoughtChainData;
  index: number;
  selectedId: string | null;
  onSelect: (entry: Entry) => void;
}

function ThemeSection({ chain, index, selectedId, onSelect }: ThemeSectionProps): JSX.Element {
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
          <span className="mono">{chain.steps.length}</span> 步 ·{' '}
          <span className="mono">{insightCount}</span> 条思想
        </p>
      </header>

      <div className="tb-track">
        {chain.steps.length === 0 && <p className="tb-theme-empty">暂无条目，待补充</p>}
        {chain.steps.map((step, stepIndex) => (
          <Fragment key={step.entry.id}>
            {stepIndex > 0 && (
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

/** 思想看板 v2：7 个主题纵向分区，每区内横向思想链（≤900px 纵向堆叠） */
export function ThoughtBoard({ chains, selectedId, onSelect }: ThoughtBoardProps): JSX.Element {
  const [activeId, setActiveId] = useState<string | null>(null);

  const totalSteps = chains.reduce((sum, chain) => sum + chain.steps.length, 0);
  const activeChain = activeId ? chains.find((chain) => chain.id === activeId) ?? null : null;
  const visibleChains = activeChain
    ? [{ chain: activeChain, index: chains.indexOf(activeChain) }]
    : chains.map((chain, index) => ({ chain, index }));

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
          className={`tb-filter-chip${activeId === null ? ' is-active' : ''}`}
          aria-pressed={activeId === null}
          onClick={() => setActiveId(null)}
        >
          <span className="tb-filter-name">全部主题</span>
          <span className="tb-filter-count mono">{totalSteps}</span>
        </button>
        {chains.map((chain, index) => {
          const isActive = activeId === chain.id;
          return (
            <button
              key={chain.id}
              type="button"
              className={`tb-filter-chip${isActive ? ' is-active' : ''}`}
              aria-pressed={isActive}
              title={chain.question}
              data-theme-id={chain.id}
              onClick={() => setActiveId(isActive ? null : chain.id)}
            >
              <span className="tb-filter-no mono">{padNo(index)}</span>
              <span className="tb-filter-name">{chain.title}</span>
              <span className="tb-filter-count mono">{chain.steps.length}</span>
            </button>
          );
        })}
      </div>

      {visibleChains.map(({ chain, index }) => (
        <ThemeSection
          key={chain.id}
          chain={chain}
          index={index}
          selectedId={selectedId}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
