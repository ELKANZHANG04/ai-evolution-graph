import { useMemo } from 'react';
import type { JSX } from 'react';
import { CategoryChips, ImportanceBadge, NewBadge, ReviewBadge, TypeBadge } from '../components/common/Badges';
import type { HashRoute } from '../hooks/useHashRoute';
import { ENTRIES, META } from '../lib/data';
import { formatBuiltAt, formatDate, todayISO } from '../lib/format';
import type { Entry } from '../lib/types';
import { categoryColor, primaryCategory } from '../theme/categories';
import '../components/feed/feed.css';

export interface FeedPageProps {
  route: HashRoute;
}

/** 最新动态只展示最近 5 天（含今天）新入库的条目 */
const RECENT_DAYS = 5;
/** 事件本身也必须「新」：只保留近半年内发生的事件/思想，避免把补录的旧内容当新闻 */
const FRESH_EVENT_DAYS = 180;

/** today 往前推 days 天的 YYYY-MM-DD（UTC 对齐，避免时区导致差一天） */
function daysBeforeISO(today: string, days: number): string {
  const base = new Date(`${today}T00:00:00Z`);
  if (Number.isNaN(base.getTime())) return today;
  base.setUTCDate(base.getUTCDate() - days);
  return base.toISOString().slice(0, 10);
}

/** 按 added_at 倒序，其次事件日期倒序 */
function sortNewEntries(entries: readonly Entry[]): Entry[] {
  return [...entries].sort(
    (a, b) =>
      (b.added_at ?? '').localeCompare(a.added_at ?? '') ||
      b.date.localeCompare(a.date) ||
      b.importance - a.importance ||
      a.id.localeCompare(b.id),
  );
}

interface FeedCardProps {
  entry: Entry;
  onSelect: (entry: Entry) => void;
}

function FeedCard({ entry, onSelect }: FeedCardProps): JSX.Element {
  return (
    <article
      className="feed-card"
      role="button"
      tabIndex={0}
      aria-label={`${entry.title}，${entry.date}，影响力 ${entry.importance}/10`}
      data-date={entry.date}
      data-added={entry.added_at}
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
        {entry.added_at && <span className="feed-added-date mono">入库 {formatDate(entry.added_at)}</span>}
        <TypeBadge type={entry.type} />
        <ImportanceBadge value={entry.importance} />
        {entry.innovation && <span className="feed-innovation-badge">创新</span>}
        {entry.needs_review && <ReviewBadge compact />}
        <NewBadge />
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

interface FeedSectionProps {
  id: string;
  title: string;
  entries: Entry[];
  emptyText: string;
  onSelect: (entry: Entry) => void;
}

function FeedSection({ id, title, entries, emptyText, onSelect }: FeedSectionProps): JSX.Element {
  return (
    <section className="feed-section" aria-labelledby={id}>
      <div className="feed-section-head">
        <h2 className="feed-section-title" id={id}>
          {title}
          <span className="feed-section-count mono">{entries.length}</span>
        </h2>
      </div>
      {entries.length > 0 ? (
        <div className="feed-list">
          {entries.map((entry) => (
            <FeedCard key={entry.id} entry={entry} onSelect={onSelect} />
          ))}
        </div>
      ) : (
        <p className="feed-empty-line">{emptyText}</p>
      )}
    </section>
  );
}

/**
 * 最新动态 v3：只放「最近 5 天新入库」的事件与思想两块。
 * 创新雷达不再单独成栏，只作为卡片上的内联徽标（innovation: true）。
 */
export function FeedPage({ route }: FeedPageProps): JSX.Element {
  const today = useMemo(() => todayISO(), []);

  const { recentEvents, recentInsights, recentCount, latestAddedAt } = useMemo(() => {
    const from = daysBeforeISO(today, RECENT_DAYS - 1);
    const freshFrom = daysBeforeISO(today, FRESH_EVENT_DAYS - 1);
    const recent = sortNewEntries(
      ENTRIES.filter(
        (entry) =>
          entry.added_at !== undefined &&
          entry.added_at >= from &&
          entry.date >= freshFrom,
      ),
    );
    const latest = ENTRIES.reduce((max, entry) => {
      const stamp = entry.added_at ?? '';
      return stamp > max ? stamp : max;
    }, '');
    return {
      recentEvents: recent.filter((entry) => entry.type !== 'insight'),
      recentInsights: recent.filter((entry) => entry.type === 'insight'),
      recentCount: recent.length,
      latestAddedAt: latest,
    };
  }, [today]);

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
            每天 08:30 抓取；只展示最近 5 天新入库、且事件本身发生在近半年内的事件与思想——旧内容即使刚补录也不进「最新」。
          </p>
        </div>
        <dl className="feed-meta">
          <div>
            <dt>数据更新于</dt>
            <dd className="mono">{META.builtAt ? formatBuiltAt(META.builtAt) : '未知'}</dd>
          </div>
          <div>
            <dt>近 5 天入库（近半年）</dt>
            <dd className="mono">{recentCount}</dd>
          </div>
        </dl>
      </header>

      <FeedSection
        id="feed-events-title"
        title="新入库 · 事件"
        entries={recentEvents}
        emptyText="最近 5 天暂无近半年的新入库事件 · 每日 08:30 自动更新"
        onSelect={openEntry}
      />

      <FeedSection
        id="feed-insights-title"
        title="新入库 · 思想"
        entries={recentInsights}
        emptyText="最近 5 天暂无近半年的新入库思想 · 每日 08:30 自动更新"
        onSelect={openEntry}
      />

      {recentCount === 0 && (
        <p className="feed-empty-note">
          最近 5 天暂无近半年的新入库 · 每日 08:30 自动更新 · 最近一次入库：
          {latestAddedAt ? formatDate(latestAddedAt) : '暂无记录'}
        </p>
      )}

      <footer className="feed-foot">
        <a className="feed-thoughts-link" href="#/thoughts">
          去思想看板 →
        </a>
      </footer>
    </div>
  );
}
