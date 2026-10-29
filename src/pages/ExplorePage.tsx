import { GraphPage } from './GraphPage';
import { TimelinePage } from './TimelinePage';
import type { HashRoute } from '../hooks/useHashRoute';

/** 全量数据：时间轴与影响图谱降级到这里，作为深入探索的二级视图 */
export function ExplorePage({ route }: { route: HashRoute }) {
  const mode = route.params.get('mode') === 'graph' ? 'graph' : 'timeline';

  const setMode = (next: 'timeline' | 'graph') => {
    route.setParams((params) => {
      params.set('mode', next);
      params.delete('entry');
    });
  };

  return (
    <div className="explore-page">
      <div className="explore-bar">
        <div className="explore-tabs" role="tablist" aria-label="全量数据视图">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'timeline'}
            className={`explore-tab${mode === 'timeline' ? ' is-active' : ''}`}
            onClick={() => setMode('timeline')}
          >
            时间轴
            <span className="explore-tab-sub">面积 = 影响力</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'graph'}
            className={`explore-tab${mode === 'graph' ? ' is-active' : ''}`}
            onClick={() => setMode('graph')}
          >
            影响图谱
            <span className="explore-tab-sub">双击节点进入思维导图</span>
          </button>
        </div>
        <p className="explore-hint">全量 107 条事件的深入视图；只看主线请回「主线」</p>
      </div>

      {mode === 'graph' ? <GraphPage route={route} /> : <TimelinePage route={route} />}
    </div>
  );
}
