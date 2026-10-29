import { useMemo, useState } from 'react';
import { EntryDrawer } from '../components/detail/EntryDrawer';
import { MainlineView } from '../components/mainline/MainlineView';
import type { HashRoute } from '../hooks/useHashRoute';
import { ENTRIES, getEntryById } from '../lib/data';
import { buildMainlineChapters, mainlineStats } from '../lib/mainline';
import type { Entry } from '../lib/types';

/** 默认视图：只讲大脉络（5 章 × 24 个里程碑），全量细节退到二级页 */
export function MainlinePage({ route }: { route: HashRoute }) {
  const [breakthroughOnly, setBreakthroughOnly] = useState(false);
  const chapters = useMemo(() => buildMainlineChapters(ENTRIES), []);
  const stats = useMemo(() => mainlineStats(ENTRIES), []);

  const selectedId = route.params.get('entry');
  const selected = getEntryById(selectedId);

  const selectEntry = (entry: Entry) => {
    route.setParams((params) => params.set('entry', entry.id));
  };

  const closeEntry = () => {
    route.setParams((params) => params.delete('entry'));
  };

  return (
    <div className="mainline-page">
      <header className="mainline-hero">
        <div className="mainline-copy">
          <p className="mainline-kicker">MAINLINE · 2012 → 2026</p>
          <h1>AI 演进主线</h1>
          <p className="mainline-sub">
            只留 {stats.mainlineCount} 个里程碑，看清 5 个阶段与真正的突破点；其余 {stats.backgroundCount}{' '}
            条事件作为背景，不抢焦点。
          </p>
        </div>
        <div className="mainline-actions">
          <button
            type="button"
            className={`mainline-toggle${breakthroughOnly ? ' is-on' : ''}`}
            aria-pressed={breakthroughOnly}
            onClick={() => setBreakthroughOnly((value) => !value)}
          >
            <span className="mainline-toggle-dot" aria-hidden="true" />
            仅看突破点（≥9 分）
          </button>
          <a className="mainline-link" href="#/thoughts">
            思想看板 →
          </a>
        </div>
      </header>

      <MainlineView
        chapters={chapters}
        selectedId={selectedId}
        breakthroughOnly={breakthroughOnly}
        onSelect={selectEntry}
        onOpenChapter={(chapterId) => route.navigate('chapter', { ch: chapterId })}
      />

      <EntryDrawer
        entry={selected ?? null}
        onClose={closeEntry}
        onNavigate={(entryId) => route.setParams((params) => params.set('entry', entryId))}
      />
    </div>
  );
}
