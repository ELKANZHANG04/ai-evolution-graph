import { useHashRoute } from './hooks/useHashRoute';
import { VIEWS } from './lib/hashRoute';
import { META, getEntryById } from './lib/data';
import { formatBuiltAt } from './lib/format';
import { HeaderSearch } from './components/common/HeaderSearch';
import { EntryDrawer } from './components/detail/EntryDrawer';
import { MainlinePage } from './pages/MainlinePage';
import { ExplorePage } from './pages/ExplorePage';
import { ChapterPage } from './pages/ChapterPage';
import { ThoughtBoardPage } from './pages/ThoughtBoardPage';
import { AboutPage } from './pages/AboutPage';
import { FeedPage } from './pages/FeedPage';
import { SearchPage } from './pages/SearchPage';

export default function App() {
  const route = useHashRoute();

  // Feed/Search 两个页面只更新 ?entry=，详情抽屉在应用层统一渲染
  const pageDrawerEntry =
    route.view === 'feed' || route.view === 'search'
      ? getEntryById(route.params.get('entry')) ?? null
      : null;

  return (
    <div className="app-shell">
      <header className="app-header">
        <a className="brand" href="#/mainline" aria-label="AI 演进图谱首页">
          <span className="brand-mark" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span className="brand-text">
            <strong>AI 演进图谱</strong>
            <span className="brand-sub">AI EVOLUTION GRAPH</span>
          </span>
        </a>

        <nav className="app-nav" aria-label="主导航">
          {VIEWS.map((view) => (
            <a
              key={view.id}
              className={`nav-item${route.view === view.id ? ' is-active' : ''}`}
              href={`#/${view.id}`}
              aria-current={route.view === view.id ? 'page' : undefined}
              title={view.hint}
            >
              {view.label}
            </a>
          ))}
        </nav>

        <HeaderSearch />

        <div className="header-meta">
          <span className="mono">{META.count} 条</span>
          <span>更新于 {formatBuiltAt(META.builtAt)}</span>
        </div>
      </header>

      <main className="app-main">
        {route.view === 'mainline' && <MainlinePage route={route} />}
        {route.view === 'explore' && <ExplorePage route={route} />}
        {route.view === 'chapter' && <ChapterPage route={route} />}
        {route.view === 'thoughts' && <ThoughtBoardPage route={route} />}
        {route.view === 'feed' && <FeedPage route={route} />}
        {route.view === 'search' && <SearchPage route={route} />}
        {route.view === 'about' && <AboutPage />}
      </main>

      {(route.view === 'feed' || route.view === 'search') && (
        <EntryDrawer
          entry={pageDrawerEntry}
          onClose={() => route.setParams((params) => params.delete('entry'))}
          onNavigate={(entryId) => route.setParams((params) => params.set('entry', entryId))}
        />
      )}

      <footer className="app-footer">
        <span>数据源：data/entries/*.md · 构建期编译为静态 bundle · 每日增量更新</span>
        <span className="mono">v0.4.0 · M3 动态与搜索</span>
      </footer>
    </div>
  );
}
