import { useMemo } from 'react';
import type { JSX } from 'react';
import { CategoryChips, ImportanceBadge, NewBadge, ReviewBadge } from '../common/Badges';
import { EmptyState } from '../common/EmptyState';
import { groupByYear } from '../../lib/data';
import { formatDate, isRecent } from '../../lib/format';
import type { Category, Entry } from '../../lib/types';
import { categoryColor, primaryCategory } from '../../theme/categories';
import './timeline.css';

export interface MobileTimelineProps {
  entries: Entry[];
  hiddenCategories: Category[];
  onSelect: (entry: Entry) => void;
}

/**
 * < 768px 的纵向时间轴：年份升序分组 + importance 降序卡片。
 * 自身不负责详情抽屉（由页面统一渲染 EntryDrawer）。
 */
export function MobileTimeline({ entries, hiddenCategories, onSelect }: MobileTimelineProps): JSX.Element {
  const groups = useMemo(() => groupByYear(entries), [entries]);
  const hiddenSet = useMemo(() => new Set(hiddenCategories), [hiddenCategories]);

  if (groups.length === 0) {
    return (
      <div className="mobile-timeline">
        <div className="mobile-timeline-empty">
          <EmptyState
            title="时间轴上还没有条目"
            description="数据正在准备中。每条数据落位后，会按年份与影响力自动出现在这里。"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-timeline">
      {groups.map((group) => (
        <section key={group.year} className="mobile-timeline-year-group" aria-label={`${group.year} 年`}>
          <h3 className="mobile-timeline-year">
            <span className="mobile-timeline-year-number">{group.year}</span>
            <span className="mobile-timeline-year-count mono">
              {group.entries.length} 条 · 影响力 {group.totalImportance}
            </span>
          </h3>
          <ul className="mobile-timeline-list">
            {group.entries.map((entry) => {
              const isDimmed = entry.categories.some((category) => hiddenSet.has(category));
              const color = categoryColor(primaryCategory(entry.categories));
              return (
                <li key={entry.id}>
                  <button
                    type="button"
                    className={`mobile-timeline-card${isDimmed ? ' is-dimmed' : ''}`}
                    style={{ borderLeftColor: color }}
                    onClick={() => onSelect(entry)}
                    aria-label={`${entry.title}，${formatDate(entry.date)}，影响力 ${entry.importance}/10${
                      isDimmed ? '（已被图例筛选隐藏）' : ''
                    }`}
                  >
                    <span className="mobile-timeline-card-head">
                      <span className="mobile-timeline-title">{entry.title}</span>
                      <ImportanceBadge value={entry.importance} />
                    </span>
                    <span className="mobile-timeline-meta">
                      <span className="mobile-timeline-date">{formatDate(entry.date)}</span>
                      <CategoryChips categories={entry.categories} max={2} />
                      {entry.needs_review && <ReviewBadge compact />}
                      {isRecent(entry) && <NewBadge />}
                    </span>
                    <span className="mobile-timeline-summary">{entry.summary}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
