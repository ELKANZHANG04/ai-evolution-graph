import { useMemo, useState } from 'react';
import { FoundationStrip } from '../components/common/FoundationStrip';
import { Legend } from '../components/common/Legend';
import { EntryDrawer } from '../components/detail/EntryDrawer';
import { MobileTimeline } from '../components/timeline/MobileTimeline';
import { TimelineCanvas } from '../components/timeline/TimelineCanvas';
import { useMediaQuery } from '../hooks/useMediaQuery';
import type { HashRoute } from '../hooks/useHashRoute';
import { countByCategory, ENTRIES, getEntryById, yearSpan } from '../lib/data';
import { formatDate } from '../lib/format';
import type { Category, Entry } from '../lib/types';

export interface TimelinePageProps {
  route: HashRoute;
  /** 限定数据范围（主题页/章节页用）；默认全库 */
  entries?: Entry[];
  /** 紧凑模式：隐藏页头（主题页已有自己的标题） */
  compact?: boolean;
}

export function TimelinePage({ route, entries = ENTRIES, compact = false }: TimelinePageProps) {
  const [hiddenCategories, setHiddenCategories] = useState<Category[]>([]);
  const isMobile = useMediaQuery('(max-width: 767px)');

  const counts = useMemo(() => countByCategory(entries), [entries]);
  const latestDate = useMemo(
    () => entries.reduce((max, entry) => (entry.date > max ? entry.date : max), ''),
    [entries],
  );
  const needsReview = useMemo(() => entries.filter((entry) => entry.needs_review).length, [entries]);

  // 奠基时代（< 2012）折叠，不铺进时间轴主体（需求硬性要求）
  const timelineEntries = useMemo(() => entries.filter((entry) => entry.date >= '2012-01-01'), [entries]);
  const foundationEntries = useMemo(() => entries.filter((entry) => entry.date < '2012-01-01'), [entries]);
  const span = yearSpan(timelineEntries);
  const selectedId = route.params.get('entry');
  const selected = getEntryById(selectedId);

  const toggleCategory = (category: Category) => {
    setHiddenCategories((previous) =>
      previous.includes(category) ? previous.filter((item) => item !== category) : [...previous, category],
    );
  };

  const selectEntry = (entry: Entry) => {
    route.setParams((params) => params.set('entry', entry.id));
  };

  const closeEntry = () => {
    route.setParams((params) => params.delete('entry'));
  };

  const navigateToEntry = (entryId: string) => {
    route.setParams((params) => params.set('entry', entryId));
  };

  return (
    <div className={`timeline-page${compact ? ' is-compact' : ''}`}>
      {!compact && (
        <section className="hero">
          <div className="hero-copy">
            <h1>
              AI 演进图谱
              <span className="hero-mark">2012 → {span ? span[1] : '—'}</span>
            </h1>
            <p className="hero-sub">
              每个块是一个事件，<strong>面积 = 影响力</strong>。一眼看懂 AI 的节奏、重心与密度。
            </p>
          </div>
          <dl className="hero-stats">
            <div>
              <dt>条目</dt>
              <dd className="mono">{entries.length}</dd>
            </div>
            <div>
              <dt>覆盖年份</dt>
              <dd className="mono">{span ? `${span[0]}–${span[1]}` : '—'}</dd>
            </div>
            <div>
              <dt>最新事件</dt>
              <dd className="mono">{latestDate ? formatDate(latestDate) : '—'}</dd>
            </div>
            <div>
              <dt>待核对</dt>
              <dd className={`mono${needsReview > 0 ? ' is-warn' : ''}`}>{needsReview}</dd>
            </div>
          </dl>
        </section>
      )}

      <section className="legend-bar" aria-label="图例与筛选">
        <Legend counts={counts} hidden={hiddenCategories} onToggle={toggleCategory} />
        <p className="legend-hint">点击图例筛选 · 滚轮缩放 · 拖拽平移 · 点击块看详情</p>
      </section>

      <FoundationStrip entries={foundationEntries} onSelect={selectEntry} />

      <section className={`timeline-stage${isMobile ? ' is-mobile' : ''}`} aria-label="演进时间轴">
        {isMobile ? (
          <MobileTimeline entries={timelineEntries} hiddenCategories={hiddenCategories} onSelect={selectEntry} />
        ) : (
          <TimelineCanvas
            entries={timelineEntries}
            hiddenCategories={hiddenCategories}
            selectedId={selectedId}
            onSelect={selectEntry}
          />
        )}
      </section>

      <EntryDrawer entry={selected ?? null} onClose={closeEntry} onNavigate={navigateToEntry} />
    </div>
  );
}
