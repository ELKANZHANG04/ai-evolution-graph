import { useMemo, useState } from 'react';
import type { JSX } from 'react';
import { CategoryChips, ImportanceBadge, NewBadge, ReviewBadge, TypeBadge } from '../components/common/Badges';
import { EmptyState } from '../components/common/EmptyState';
import type { HashRoute } from '../hooks/useHashRoute';
import { planCuration } from '../lib/curation';
import { ENTRIES, META } from '../lib/data';
import { formatBuiltAt, formatDate, isRecent, todayISO } from '../lib/format';
import type { Entry, Maturity } from '../lib/types';
import { categoryColor, primaryCategory } from '../theme/categories';
import '../components/feed/feed.css';

export interface FeedPageProps {
  route: HashRoute;
}

type FeedWindow = '7d' | '30d' | 'all';

const WINDOW_OPTIONS: { key: FeedWindow; label: string; days: number | null }[] = [
  { key: '7d', label: '最近 7 天', days: 7 },
  { key: '30d', label: '最近 30 天', days: 30 },
  { key: 'all', label: '全部', days: null },
];

/** 创新雷达成熟度标签 */
const MATURITY_META: Record<Maturity, { label: string; color: string }> = {
  paper: { label: '论文', color: '#A78BFA' },
  prototype: { label: '原型', color: '#FB923C' },
  product: { label: '产品', color: '#2DD4BF' },
};

const MAX_POOL_CARDS = 12;
const MAX_INNOVATION_CARDS = 6;

/** 以 UTC 计算 N 天前的 YYYY-MM-DD（与数据日期口径一致，避免时区偏移） */
function daysAgoISO(days: number): string {
  const now = new Date();
  const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - days));
  return date.toISOString().slice(0, 10);
}

function sortByDateDesc(entries: readonly Entry[]): Entry[] {
  return [...entries].sort(
    (a, b) => b.date.localeCompare(a.date) || b.importance - a.importance || a.id.localeCompare(b.id),
  );
}

interface FeedCardProps {
  entry: Entry;
  added?: boolean;
  candidate?: boolean;
  onSelect: (entry: Entry) => void;
}

function FeedCard({ entry, added = false, candidate = false, onSelect }: FeedCardProps): JSX.Element {
  const recent = isRecent(entry, 7);
  return (
    <article
      className={`feed-card${added ? ' is-added' : ''}`}
      role="button"
      tabIndex={0}
      aria-label={`${entry.title}，${entry.date}，影响力 ${entry.importance}/10`}
      style={{ borderLeftColor: categoryColor(primaryCategory(entry.categories)) }}
      onClick={() => onSelect(entry)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar') {
          event.preventDefault();
          onSelect(entry);
        }
      }}
    >
      <div className="feed-card-top">
        <span className="feed-card-date mono">{formatDate(entry.date)}</span>
        {added && entry.added_at && <span className="feed-added-date mono">入库 {formatDate(entry.added_at)}</span>}
        <TypeBadge type={entry.type} />
        <ImportanceBadge value={entry.importance} />
        {entry.mainline && <span className="feed-state-badge is-mainline">主线</span>}
        {candidate && <span className="feed-state-badge is-candidate">候选晋升</span>}
        {entry.innovation && <span className="feed-state-badge is-innovation">创新</span>}
        {entry.innovation && entry.maturity && (
          <span className="feed-maturity-chip">{MATURITY_META[entry.maturity].label}</span>
        )}
        {entry.needs_review && <ReviewBadge compact />}
        {(recent || added) && <NewBadge />}
      </div>
      <h2 className="feed-card-title">{entry.title}</h2>
      <p className="feed-card-summary">{entry.summary}</p>
      {entry.categories.length > 0 && (
        <div className="feed-card-foot">
          <CategoryChips categories={entry.categories} max={4} />
        </div>
      )}
    </article>
  );
}

interface InnovationCardProps {
  entry: Entry;
  onSelect: (entry: Entry) => void;
}

function InnovationCard({ entry, onSelect }: InnovationCardProps): JSX.Element {
  const maturity = entry.maturity ? MATURITY_META[entry.maturity] : null;
  const claim = entry.thought_claim?.trim() || entry.title;
  return (
    <article
      className="feed-innovation"
      role="button"
      tabIndex={0}
      aria-label={`创新雷达：${entry.title}，${entry.date}`}
      onClick={() => onSelect(entry)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar') {
          event.preventDefault();
          onSelect(entry);
        }
      }}
    >
      <div className="feed-innovation-top">
        {maturity && (
          <span
            className="feed-maturity-chip is-inline"
            style={{ color: maturity.color, borderColor: `${maturity.color}66`, background: `${maturity.color}1a` }}
          >
            {maturity.label}
          </span>
        )}
        <span className="feed-innovation-date mono">{formatDate(entry.date)}</span>
        {entry.thought_pin === 'top' && <span className="feed-innovation-pin">新路线</span>}
      </div>
      <p className="feed-innovation-claim">{claim}</p>
      {entry.why_underrated && <p className="feed-innovation-why">{entry.why_underrated}</p>}
      <p className="feed-innovation-source">{entry.title}</p>
    </article>
  );
}

/**
 * 最新动态 v2：活新闻流。
 * 页头（主线容量/候选池）→ 最近新增（按入库）→ 最新事件（按事件日期，时间窗）→ 候选晋升池 → 创新雷达。
 */
export function FeedPage({ route }: FeedPageProps): JSX.Element {
  const [windowKey, setWindowKey] = useState<FeedWindow>('30d');
  const today = useMemo(() => todayISO(), []);

  const sorted = useMemo(() => sortByDateDesc(ENTRIES), []);
  const plan = useMemo(() => planCuration(ENTRIES, { today }), [today]);
  const poolIds = useMemo(() => new Set(plan.pool.map((entry) => entry.id)), [plan]);

  const addedEntries = useMemo(
    () =>
      [...ENTRIES]
        .filter((entry) => entry.added_at && isRecent(entry, 7))
        .sort(
          (a, b) =>
            (b.added_at ?? '').localeCompare(a.added_at ?? '') ||
            b.date.localeCompare(a.date) ||
            a.id.localeCompare(b.id),
        ),
    [],
  );

  const windowCounts = useMemo(() => {
    const counts: Record<FeedWindow, number> = { '7d': 0, '30d': 0, all: sorted.length };
    for (const option of WINDOW_OPTIONS) {
      if (!option.days) continue;
      const start = daysAgoISO(option.days);
      counts[option.key] = sorted.filter((entry) => entry.date >= start).length;
    }
    return counts;
  }, [sorted]);

  const windowEntries = useMemo(() => {
    const option = WINDOW_OPTIONS.find((item) => item.key === windowKey) ?? WINDOW_OPTIONS[1];
    if (!option.days) return sorted;
    const start = daysAgoISO(option.days);
    return sorted.filter((entry) => entry.date >= start);
  }, [sorted, windowKey]);

  const innovationCount = useMemo(() => ENTRIES.filter((entry) => entry.innovation).length, []);
  const innovationEntries = useMemo(
    () =>
      [...ENTRIES]
        .filter((entry) => entry.innovation)
        .sort((a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id))
        .slice(0, MAX_INNOVATION_CARDS),
    [],
  );

  const latestDate = META.latestDate || sorted[0]?.date || '';
  const activeWindow = WINDOW_OPTIONS.find((item) => item.key === windowKey) ?? WINDOW_OPTIONS[1];
  const isEmpty = windowEntries.length === 0;
  const poolCards = plan.pool.slice(0, MAX_POOL_CARDS);

  const openEntry = (entry: Entry) => {
    route.setParams((params) => params.set('entry', entry.id));
  };

  return (
    <div className="feed-page">
      <header className="feed-head">
        <div className="feed-copy">
          <p className="feed-kicker mono">LATEST · 最新动态</p>
          <h1>最新动态</h1>
          <p className="feed-sub">
            每日 08:30 抓取新闻与创新信号；重要事件会晋升到主线，主线满额后按重要度末位淘汰。
          </p>
        </div>
        <dl className="feed-meta">
          <div>
            <dt>数据更新于</dt>
            <dd className="mono">{META.builtAt ? formatBuiltAt(META.builtAt) : '未知'}</dd>
          </div>
          <div>
            <dt>事件总数</dt>
            <dd className="mono">{META.count}</dd>
          </div>
          <div>
            <dt>主线容量</dt>
            <dd className="mono">
              <span className={plan.mainlineBefore >= plan.cap ? 'feed-stat-warn' : 'feed-stat-strong'}>
                {plan.mainlineBefore}
              </span>
              /{plan.cap}
            </dd>
          </div>
          <div>
            <dt>候选池</dt>
            <dd className={`mono${plan.pool.length > 0 ? ' feed-stat-accent' : ''}`}>{plan.pool.length}</dd>
          </div>
        </dl>
      </header>

      {/* ---------- 最近新增（按入库日期） ---------- */}
      <section className="feed-section" aria-labelledby="feed-added-title">
        <div className="feed-section-head">
          <h2 className="feed-section-title" id="feed-added-title">
            最近新增
            <span className="feed-section-count mono">{addedEntries.length}</span>
          </h2>
          <span className="feed-section-note">入库于最近 7 天 · 每日 08:30 抓取</span>
        </div>
        {addedEntries.length > 0 ? (
          <div className="feed-list">
            {addedEntries.map((entry) => (
              <FeedCard key={entry.id} entry={entry} added onSelect={openEntry} />
            ))}
          </div>
        ) : (
          <p className="feed-note-line">今日暂无新增 · 每日 08:30 自动更新</p>
        )}
      </section>

      {/* ---------- 最新事件（按事件日期） ---------- */}
      <section className="feed-section" aria-labelledby="feed-stream-title">
        <div className="feed-section-head">
          <h2 className="feed-section-title" id="feed-stream-title">
            最新事件
            <span className="feed-section-count mono">{windowEntries.length}</span>
          </h2>
          <span className="feed-section-note">按事件日期 · 倒序 · 当前：{activeWindow.label}</span>
        </div>

        <div className="feed-toolbar" role="tablist" aria-label="时间窗筛选">
          {WINDOW_OPTIONS.map((option) => {
            const active = option.key === windowKey;
            return (
              <button
                key={option.key}
                type="button"
                role="tab"
                aria-selected={active}
                className={`feed-tab${active ? ' is-active' : ''}`}
                onClick={() => setWindowKey(option.key)}
              >
                {option.label}
                <span className="feed-tab-count mono">{windowCounts[option.key]}</span>
              </button>
            );
          })}
        </div>

        {isEmpty ? (
          <div className="feed-empty">
            <EmptyState
              title={`${activeWindow.label}暂无新事件`}
              description={`最近更新于 ${latestDate ? formatDate(latestDate) : '—'}（取最新条目日期）。`}
            />
            {windowKey !== 'all' && (
              <div className="feed-empty-actions">
                <button type="button" className="feed-btn" onClick={() => setWindowKey('all')}>
                  查看全部 {sorted.length} 条事件
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="feed-list">
            {windowEntries.map((entry) => (
              <FeedCard key={entry.id} entry={entry} candidate={poolIds.has(entry.id)} onSelect={openEntry} />
            ))}
          </div>
        )}
      </section>

      {/* ---------- 候选晋升池 ---------- */}
      <section className="feed-section" aria-labelledby="feed-pool-title">
        <div className="feed-section-head">
          <h2 className="feed-section-title" id="feed-pool-title">
            候选晋升池
            <span className="feed-section-count mono">{plan.pool.length}</span>
          </h2>
          <span className="feed-section-note">
            主线容量 {plan.mainlineBefore}/{plan.cap} · 满额后按重要度末位淘汰 · 每日更新重新评估
          </span>
        </div>
        {poolCards.length > 0 ? (
          <div className="feed-list">
            {poolCards.map((entry) => (
              <FeedCard key={entry.id} entry={entry} candidate onSelect={openEntry} />
            ))}
          </div>
        ) : (
          <p className="feed-note-line">暂无候选：重要度 ≥8 的新事件会进入候选池</p>
        )}
      </section>

      {/* ---------- 创新雷达 ---------- */}
      <section className="feed-section" aria-labelledby="feed-innovation-title">
        <div className="feed-section-head">
          <h2 className="feed-section-title" id="feed-innovation-title">
            创新雷达
            <span className="feed-section-count mono">{innovationCount}</span>
          </h2>
          <a className="feed-section-link" href="#/thoughts">
            去思想看板 →
          </a>
        </div>
        {innovationEntries.length > 0 ? (
          <div className="feed-innovation-list">
            {innovationEntries.map((entry) => (
              <InnovationCard key={entry.id} entry={entry} onSelect={openEntry} />
            ))}
          </div>
        ) : (
          <p className="feed-note-line">暂无创新雷达条目 · 新想法入库后会出现在这里</p>
        )}
      </section>
    </div>
  );
}
