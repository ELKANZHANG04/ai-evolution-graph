import { useMemo } from 'react';
import { CategoryChips, ImportanceBadge, TypeBadge } from '../components/common/Badges';
import { EntryDrawer } from '../components/detail/EntryDrawer';
import { GraphPage } from './GraphPage';
import { TimelinePage } from './TimelinePage';
import type { HashRoute } from '../hooks/useHashRoute';
import { ENTRIES, getEntryById } from '../lib/data';
import { formatDate } from '../lib/format';
import { MAINLINE_CHAPTERS } from '../lib/mainline';
import type { Entry } from '../lib/types';

type ChapterTab = 'list' | 'timeline' | 'graph';

/**
 * 主题/章节页：点进主线某一阶段 → 看该主题「全部事件」（含背景事件，标题全部可见），
 * 并可切换本章的时间轴 / 影响图谱。全量数据由此合并进主题页。
 */
export function ChapterPage({ route }: { route: HashRoute }) {
  const chapterId = route.params.get('ch') ?? MAINLINE_CHAPTERS[0].id;
  const chapterIndex = Math.max(
    0,
    MAINLINE_CHAPTERS.findIndex((item) => item.id === chapterId),
  );
  const chapter = MAINLINE_CHAPTERS[chapterIndex] ?? MAINLINE_CHAPTERS[0];

  const entries = useMemo(
    () => ENTRIES.filter((entry) => entry.date >= chapter.dateStart && entry.date <= chapter.dateEnd),
    [chapter],
  );
  const sorted = useMemo(
    () => [...entries].sort((a, b) => a.date.localeCompare(b.date) || b.importance - a.importance),
    [entries],
  );

  const mainlineCount = sorted.filter((entry) => entry.mainline).length;
  const breakthroughCount = sorted.filter((entry) => entry.importance >= 9).length;
  const insightCount = sorted.filter((entry) => entry.type === 'insight').length;

  const tab = (route.params.get('tab') as ChapterTab | null) ?? 'list';
  const selectedId = route.params.get('entry');
  const selected = getEntryById(selectedId);

  const setTab = (next: ChapterTab) => {
    route.setParams((params) => {
      params.set('tab', next);
      params.delete('entry');
    });
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
    <div className="chapter-page">
      <nav className="chapter-crumb" aria-label="面包屑">
        <a href="#/mainline">← 主线</a>
        <span className="chapter-crumb-sep">/</span>
        <span>{chapter.title}</span>
      </nav>

      <header className="chapter-hero">
        <p className="mainline-kicker">
          CHAPTER {String(chapterIndex + 1).padStart(2, '0')} · {chapter.dateStart.slice(0, 4)}–
          {chapter.dateEnd.slice(0, 4)}
        </p>
        <h1>{chapter.title}</h1>
        <p className="chapter-en">{chapter.en}</p>
        <p className="mainline-sub">{chapter.description}</p>
        <dl className="chapter-stats">
          <div>
            <dt>全部事件</dt>
            <dd className="mono">{entries.length}</dd>
          </div>
          <div>
            <dt>主线里程碑</dt>
            <dd className="mono">{mainlineCount}</dd>
          </div>
          <div>
            <dt>突破点</dt>
            <dd className="mono">{breakthroughCount}</dd>
          </div>
          <div>
            <dt>思想</dt>
            <dd className="mono">{insightCount}</dd>
          </div>
        </dl>
      </header>

      <div className="chapter-tabs" role="tablist" aria-label="章节视图">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'list'}
          className={`chapter-tab${tab === 'list' ? ' is-active' : ''}`}
          onClick={() => setTab('list')}
        >
          事件列表
          <span className="chapter-tab-count mono">{entries.length}</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'timeline'}
          className={`chapter-tab${tab === 'timeline' ? ' is-active' : ''}`}
          onClick={() => setTab('timeline')}
        >
          本章时间轴
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'graph'}
          className={`chapter-tab${tab === 'graph' ? ' is-active' : ''}`}
          onClick={() => setTab('graph')}
        >
          本章影响图谱
        </button>
        <span className="chapter-tabs-hint">只看主线？<a href="#/mainline">回主线视图</a></span>
      </div>

      {tab === 'list' && (
        <div className="chapter-list-wrap">
          {sorted.length === 0 && <p className="chapter-empty">本章暂无事件。</p>}
          {sorted.map((entry) => (
            <button
              key={entry.id}
              type="button"
              className={`chapter-row${entry.mainline ? ' is-mainline' : ''}${
                entry.importance >= 9 ? ' is-breakthrough' : ''
              }${entry.id === selectedId ? ' is-selected' : ''}`}
              onClick={() => selectEntry(entry)}
            >
              <span className="chapter-row-date mono">{formatDate(entry.date)}</span>
              <span className="chapter-row-main">
                <span className="chapter-row-title">
                  {entry.title}
                  {entry.mainline && <span className="chapter-row-flag">主线</span>}
                  {entry.importance >= 9 && <span className="chapter-row-flag is-break">突破</span>}
                </span>
                <span className="chapter-row-summary">{entry.summary}</span>
                <span className="chapter-row-meta">
                  <TypeBadge type={entry.type} />
                  <CategoryChips categories={entry.categories} max={3} />
                  {entry.needs_review && <span className="chapter-row-review">待核对</span>}
                </span>
              </span>
              <span className="chapter-row-score">
                <ImportanceBadge value={entry.importance} />
              </span>
            </button>
          ))}
        </div>
      )}

      {tab === 'timeline' && (
        <div className="chapter-embed">
          <TimelinePage route={route} entries={entries} compact />
        </div>
      )}

      {tab === 'graph' && (
        <div className="chapter-embed">
          <GraphPage route={route} entries={entries} />
        </div>
      )}

      <EntryDrawer entry={selected ?? null} onClose={closeEntry} onNavigate={navigateToEntry} />
    </div>
  );
}
