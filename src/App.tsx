import { useHashRoute } from './hooks/useHashRoute';
import { VIEWS } from './lib/hashRoute';
import { META } from './lib/data';
import { formatBuiltAt } from './lib/format';
import { MainlinePage } from './pages/MainlinePage';
import { ExplorePage } from './pages/ExplorePage';
import { ThoughtBoardPage } from './pages/ThoughtBoardPage';
import { AboutPage } from './pages/AboutPage';
import { FeedPage } from './pages/PlaceholderPages';

const MILESTONES: Partial<Record<string, string>> = {
  feed: 'M3',
};

export default function App() {
  const route = useHashRoute();

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
              {MILESTONES[view.id] && <span className="nav-badge">{MILESTONES[view.id]}</span>}
            </a>
          ))}
        </nav>

        <div className="header-meta">
          <span className="mono">{META.count} 条</span>
          <span>更新于 {formatBuiltAt(META.builtAt)}</span>
        </div>
      </header>

      <main className="app-main">
        {route.view === 'mainline' && <MainlinePage route={route} />}
        {route.view === 'explore' && <ExplorePage route={route} />}
        {route.view === 'thoughts' && <ThoughtBoardPage route={route} />}
        {route.view === 'feed' && <FeedPage />}
        {route.view === 'about' && <AboutPage />}
      </main>

      <footer className="app-footer">
        <span>数据源：data/entries/*.md · 构建期编译为静态 bundle · 每日增量更新</span>
        <span className="mono">v0.3.0 · M2.5 主线改版</span>
      </footer>
    </div>
  );
}
