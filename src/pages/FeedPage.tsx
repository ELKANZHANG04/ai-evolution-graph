import { useMemo, useState } from 'react';
import type { JSX } from 'react';
import { CategoryChips, ImportanceBadge, NewBadge, ReviewBadge, TypeBadge } from '../components/common/Badges';
import { EmptyState } from '../components/common/EmptyState';
import type { HashRoute } from '../hooks/useHashRoute';
import { ENTRIES, META } from '../lib/data';
import { formatBuiltAt, formatDate, isRecent } from '../lib/format';
import type { Entry } from '../lib/types';
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

/** 以 UTC 计算 N 天前的 YYYY-MM-DD（与数据日期口径一致，避免本地时区偏移） */
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
  onSelect: (entry: Entry) => void;
}

function FeedCard({ entry, added = false, onSelect }: FeedCardProps): JSX.Element {
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
        <TypeBadge type={entry.type} />
        <ImportanceBadge value={entry.importance} />
        {entry.needs_review && <ReviewBadge compact />}
        {recent && <NewBadge />}
        {added && <span className="feed-added-flag">新增</span>}
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

/**
 * 最新动态：按事件日期倒序的卡片流，支持 7 / 30 天时间窗；
 * 入库日期在近 7 天内的条目会出现在「新增」小节。
 */
export function FeedPage({ route }: FeedPageProps): JSX.Element {
  const [windowKey, setWindowKey] = useState<FeedWindow>('30d');

  const sorted = useMemo(() => sortByDateDesc(ENTRIES), []);
  const addedEntries = useMemo(() => sorted.filter((entry) => entry.added_at && isRecent(entry, 7)), [sorted]);
  const addedIds = useMemo(() => new Set(addedEntries.map((entry) => entry.id)), [addedEntries]);

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
    const base = sorted.filter((entry) => !addedIds.has(entry.id));
    if (!option.days) return base;
    const start = daysAgoISO(option.days);
    return base.filter((entry) => entry.date >= start);
  }, [sorted, addedIds, windowKey]);

  const latestDate = META.latestDate || sorted[0]?.date || '';

  const openEntry = (entry: Entry) => {
    route.setParams((params) => params.set('entry', entry.id));
  };

  const activeWindow = WINDOW_OPTIONS.find((item) => item.key === windowKey) ?? WINDOW_OPTIONS[1];
  const isEmpty = windowEntries.length === 0;

  return (
    <div className="feed-page">
      <header className="feed-head">
        <div className="feed-copy">
          <p className="feed-kicker mono">LATEST · 最新动态</p>
          <h1>最新动态</h1>
          <p className="feed-sub">按事件日期倒序；每日 08:30 增量更新。</p>
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
        </dl>
      </header>

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
        <span className="feed-toolbar-note">按事件日期 · 倒序</span>
      </div>

      {addedEntries.length > 0 && (
        <section className="feed-section" aria-labelledby="feed-added-title">
          <div className="feed-section-head">
            <h2 className="feed-section-title" id="feed-added-title">
              新增 <span className="feed-section-count mono">{addedEntries.length}</span>
            </h2>
            <span className="feed-section-note">最近 7 天入库</span>
          </div>
          <div className="feed-list">
            {addedEntries.map((entry) => (
              <FeedCard key={entry.id} entry={entry} added onSelect={openEntry} />
            ))}
          </div>
        </section>
      )}

      <section className="feed-section" aria-labelledby="feed-stream-title">
        <div className="feed-section-head">
          <h2 className="feed-section-title" id="feed-stream-title">
            {activeWindow.label}
            <span className="feed-section-count mono">{windowEntries.length}</span>
          </h2>
          {windowKey === 'all' && <span className="feed-section-note">共 {sorted.length} 条</span>}
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
              <FeedCard key={entry.id} entry={entry} onSelect={openEntry} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
