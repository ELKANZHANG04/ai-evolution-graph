import { useMemo } from 'react';
import type { JSX } from 'react';
import { CategoryChips, ImportanceBadge, TypeBadge } from '../components/common/Badges';
import { StarButton } from '../components/common/StarButton';
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

/** 统一时间序：事件日期倒序（最新在前），同日按入库时间、重要性排序 */
function sortNewEntries(entries: readonly Entry[]): Entry[] {
  return [...entries].sort(
    (a, b) =>
      b.date.localeCompare(a.date) ||
      (b.added_at ?? '').localeCompare(a.added_at ?? '') ||
      b.importance - a.importance ||
      a.id.localeCompare(b.id),
  );
}

interface FeedCardProps {
  entry: Entry;
  onSelect: (entry: Entry) => void;
}

/** 与主线里程碑卡一致的简明标注：日期、类型、贡献度（影响力分数）、类别 */
function FeedCard({ entry, onSelect }: FeedCardProps): JSX.Element {
  return (
    <article
      className="feed-card"
      role="button"
      tabIndex={0}
      aria-label={`${entry.title}，${entry.date}，影响力 ${entry.importance}/10`}
      data-date={entry.date}
      data-added={entry.added_at}
      data-importance={entry.importance}
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
        {entry.added_at && (
          <span className="feed-added-date mono">入库 {formatDate(entry.added_at)}</span>
        )}
        <TypeBadge type={entry.type} />
        <span className="feed-card-score">
          <ImportanceBadge value={entry.importance} />
        </span>
        {entry.innovation && <span className="feed-innovation-badge">创新雷达</span>}
        <StarButton entryId={entry.id} />
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
 * 最新动态 v4：不再按「事件 / 思想」拆栏，模型发布、事件、思想统一成一条流；
 * 每条按主线同样的简明标注（类型 + 影响力分数 + 类别），保证每个思想都能被抓到。
 */
export function FeedPage({ route }: FeedPageProps): JSX.Element {
  const today = useMemo(() => todayISO(), []);

  const { recent, eventCount, insightCount, latestAddedAt } = useMemo(() => {
    const from = daysBeforeISO(today, RECENT_DAYS - 1);
    const freshFrom = daysBeforeISO(today, FRESH_EVENT_DAYS - 1);
    const recent = sortNewEntries(
      ENTRIES.filter(
        (entry) =>
          entry.added_at !== undefined && entry.added_at >= from && entry.date >= freshFrom,
      ),
    );
    const latest = ENTRIES.reduce((max, entry) => {
      const stamp = entry.added_at ?? '';
      return stamp > max ? stamp : max;
    }, '');
    return {
      recent,
      eventCount: recent.filter((entry) => entry.type !== 'insight').length,
      insightCount: recent.filter((entry) => entry.type === 'insight').length,
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
            每天 08:30 抓取。模型发布、事件与思想不拆栏，统一成一条「最近入库」流：只收最近 5 天入库、且事件发生在近半年内的内容，按时间倒序，每条标出贡献度（影响力分数）。
          </p>
        </div>
        <dl className="feed-meta">
          <div>
            <dt>数据更新于</dt>
            <dd className="mono">{META.builtAt ? formatBuiltAt(META.builtAt) : '未知'}</dd>
          </div>
          <div>
            <dt>最近 5 天入库</dt>
            <dd className="mono">{recent.length}</dd>
          </div>
        </dl>
      </header>

      <section className="feed-section" aria-labelledby="feed-stream-title">
        <div className="feed-section-head">
          <h2 className="feed-section-title" id="feed-stream-title">
            最近入库
            <span className="feed-section-count mono">{recent.length}</span>
          </h2>
          <span className="feed-section-note">
            事件 {eventCount} · 思想 {insightCount} · 近半年 · 按时间倒序
          </span>
        </div>
        {recent.length > 0 ? (
          <div className="feed-list">
            {recent.map((entry) => (
              <FeedCard key={entry.id} entry={entry} onSelect={openEntry} />
            ))}
          </div>
        ) : (
          <p className="feed-empty-line">
            最近 5 天暂无近半年的新入库 · 每日 08:30 自动更新 · 最近一次入库：
            {latestAddedAt ? formatDate(latestAddedAt) : '暂无记录'}
          </p>
        )}
      </section>

      <footer className="feed-foot">
        <a className="feed-thoughts-link" href="#/thoughts">
          去思想看板 →
        </a>
      </footer>
    </div>
  );
}
