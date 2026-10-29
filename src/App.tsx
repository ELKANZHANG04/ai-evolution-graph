import { useHashRoute } from './hooks/useHashRoute';
import { VIEWS } from './lib/hashRoute';
import { META } from './lib/data';
import { formatBuiltAt } from './lib/format';
import { TimelinePage } from './pages/TimelinePage';
import { GraphPage } from './pages/GraphPage';
import { AboutPage } from './pages/AboutPage';
import { FeedPage, InsightsPage } from './pages/PlaceholderPages';

const MILESTONES: Partial<Record<string, string>> = {
  feed: 'M3',
  insights: 'M3',
};

export default function App() {
  const route = useHashRoute();

  return (
    <div className="app-shell">
      <header className="app-header">
        <a className="brand" href="#/timeline" aria-label="AI 演进图谱首页">
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
        {route.view === 'timeline' && <TimelinePage route={route} />}
        {route.view === 'graph' && <GraphPage route={route} />}
        {route.view === 'feed' && <FeedPage />}
        {route.view === 'insights' && <InsightsPage />}
        {route.view === 'about' && <AboutPage />}
      </main>

      <footer className="app-footer">
        <span>数据源：data/entries/*.md · 构建期编译为静态 bundle · 计划每日增量更新</span>
        <span className="mono">v0.1.0 · M1</span>
      </footer>
    </div>
  );
}
