import { lazy, Suspense, useMemo, useState } from 'react';
import { Legend } from '../components/common/Legend';
import { EntryDrawer } from '../components/detail/EntryDrawer';
import { useMediaQuery } from '../hooks/useMediaQuery';
import type { HashRoute } from '../hooks/useHashRoute';
import { countByCategory, ENTRIES, getEntryById, GRAPH } from '../lib/data';
import type { Category, GraphEdge, GraphNode } from '../lib/types';
import { RELATION_META, RELATION_ORDER } from '../theme/relations';

// ECharts 图谱体积较大：按需懒加载，首屏（时间轴）不背这个包
const InfluenceMap = lazy(() =>
  import('../components/graph/InfluenceMap').then((module) => ({ default: module.InfluenceMap })),
);
const MobileInfluenceList = lazy(() =>
  import('../components/graph/MobileInfluenceList').then((module) => ({ default: module.MobileInfluenceList })),
);

function GraphFallback() {
  return (
    <div className="graph-fallback" role="status">
      <span className="graph-fallback-dot" />
      正在加载图谱引擎…
    </div>
  );
}

export function GraphPage({ route }: { route: HashRoute }) {
  const [hiddenCategories, setHiddenCategories] = useState<Category[]>([]);
  const isMobile = useMediaQuery('(max-width: 899px)');

  const counts = useMemo(() => countByCategory(ENTRIES), []);
  // 影响图谱只展示 2012 至今（奠基时代走时间轴折叠区，避免时间轴被 1950s 拉长）
  const graphNodes = useMemo<GraphNode[]>(
    () => GRAPH.nodes.filter((node) => node.date >= '2012-01-01'),
    [],
  );
  const nodeIds = useMemo(() => new Set(graphNodes.map((node) => node.id)), [graphNodes]);
  const graphEdges = useMemo<GraphEdge[]>(
    () => GRAPH.edges.filter((edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target)),
    [nodeIds],
  );
  const focusId = route.params.get('focus');
  const selectedId = route.params.get('entry');
  const selected = getEntryById(selectedId);
  const focusEntry = getEntryById(focusId);

  const toggleCategory = (category: Category) => {
    setHiddenCategories((previous) =>
      previous.includes(category) ? previous.filter((item) => item !== category) : [...previous, category],
    );
  };

  const selectEntry = (entryId: string) => {
    route.setParams((params) => params.set('entry', entryId));
  };

  const focusEntryById = (entryId: string | null) => {
    route.setParams((params) => {
      if (entryId) params.set('focus', entryId);
      else params.delete('focus');
    });
  };

  const closeEntry = () => {
    route.setParams((params) => params.delete('entry'));
  };

  const navigateToEntry = (entryId: string) => {
    route.setParams((params) => params.set('entry', entryId));
  };

  return (
    <div className="graph-page">
      <section className="graph-head">
        <div className="graph-title">
          <h1>影响图谱</h1>
          <p>
            节点 = 事件 / 模型 / 产品 / 思想，连线 = 影响关系。单击看详情，双击节点进入「以它为中心」的思维导图，继续双击可一路下钻。
          </p>
        </div>
        <dl className="graph-stats">
          <div>
            <dt>节点</dt>
            <dd className="mono">{graphNodes.length}</dd>
          </div>
          <div>
            <dt>关系</dt>
            <dd className="mono">{graphEdges.length}</dd>
          </div>
          <div>
            <dt>聚焦</dt>
            <dd className={focusEntry ? 'is-focus' : ''}>{focusEntry ? focusEntry.title : '全局'}</dd>
          </div>
        </dl>
      </section>

      <section className="graph-toolbar" aria-label="图谱筛选与图例">
        <Legend counts={counts} hidden={hiddenCategories} onToggle={toggleCategory} />
        <ul className="relation-legend" aria-label="关系类型图例">
          {RELATION_ORDER.map((type) => {
            const meta = RELATION_META[type];
            return (
              <li key={type} className="relation-legend-item" title={meta.description}>
                <span
                  className="relation-legend-line"
                  style={{
                    borderTopColor: meta.color,
                    borderTopStyle: meta.lineType === 'solid' ? 'solid' : meta.lineType,
                    borderTopWidth: 2,
                  }}
                  aria-hidden="true"
                />
                {meta.label}
              </li>
            );
          })}
        </ul>
      </section>

      <section className="graph-stage" aria-label="影响图谱画布">
        <Suspense fallback={<GraphFallback />}>
        {isMobile ? (
          <MobileInfluenceList
            nodes={graphNodes}
            edges={graphEdges}
            focusId={focusId}
            hiddenCategories={hiddenCategories}
            onSelect={selectEntry}
            onFocusChange={focusEntryById}
          />
        ) : (
          <InfluenceMap
            nodes={graphNodes}
            edges={graphEdges}
            hiddenCategories={hiddenCategories}
            selectedId={selectedId}
            focusId={focusId}
            onSelect={selectEntry}
            onFocusChange={focusEntryById}
          />
        )}
        </Suspense>
      </section>

      <EntryDrawer entry={selected ?? null} onClose={closeEntry} onNavigate={navigateToEntry} />
    </div>
  );
}
