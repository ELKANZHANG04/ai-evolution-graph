import { useMemo, useState } from 'react';
import type { JSX } from 'react';
import { CategoryChips, ImportanceBadge, TypeBadge } from '../components/common/Badges';
import { StarButton } from '../components/common/StarButton';
import { EmptyState } from '../components/common/EmptyState';
import type { HashRoute } from '../hooks/useHashRoute';
import { buildStarConnections, layoutStarGraph } from '../lib/connections';
import { ENTRIES, getEntryById } from '../lib/data';
import { formatDate } from '../lib/format';
import { useStars } from '../lib/stars';
import type { Entry } from '../lib/types';
import { categoryColor, primaryCategory } from '../theme/categories';
import './starred.css';

const GRAPH_WIDTH = 820;
const GRAPH_HEIGHT = 420;
const MAX_LABEL = 14;

const TIER_LABEL = { strong: '强', medium: '中', weak: '弱' } as const;

function shortTitle(entry: Entry): string {
  const chars = [...entry.title];
  return chars.length > MAX_LABEL ? `${chars.slice(0, MAX_LABEL).join('')}…` : entry.title;
}

/** 我的灵感：星标的思想 + 自动发现联系（纯本地，不上传） */
export function StarredPage({ route }: { route: HashRoute }): JSX.Element {
  const { ids } = useStars();
  const [hovered, setHovered] = useState<string | null>(null);

  const starredEntries = useMemo(
    () => ids.map((id) => getEntryById(id)).filter((entry): entry is Entry => entry !== undefined),
    [ids],
  );

  const connections = useMemo(() => buildStarConnections(ENTRIES, ids), [ids]);
  const positions = useMemo(
    () => layoutStarGraph(ids, connections.edges, GRAPH_WIDTH, GRAPH_HEIGHT),
    [ids, connections.edges],
  );
  const byId = useMemo(() => new Map(starredEntries.map((entry) => [entry.id, entry])), [starredEntries]);

  const openEntry = (entry: Entry) => {
    route.setParams((params) => params.set('entry', entry.id));
  };

  const hasStars = starredEntries.length > 0;
  const highlighted = hovered ? new Set(connections.edges.filter((edge) => edge.a === hovered || edge.b === hovered).flatMap((edge) => [edge.a, edge.b])) : null;

  return (
    <div className="stars-page">
      <header className="stars-hero">
        <p className="stars-kicker mono">MY INSPIRATION · 只属于你</p>
        <h1>我的灵感</h1>
        <p className="stars-sub">
          在最新动态或任意详情里点 ☆，把「对我有启发」的思想收进来。星标只保存在你本机浏览器；条目越多，系统会自动发现它们之间的联系，长成一张属于你的灵感网络。
        </p>
        <dl className="stars-stats">
          <div>
            <dt>星标</dt>
            <dd className="mono">{starredEntries.length}</dd>
          </div>
          <div>
            <dt>自动联系</dt>
            <dd className="mono">{connections.edges.length}</dd>
          </div>
          <div>
            <dt>关联簇</dt>
            <dd className="mono">{connections.clusters.length}</dd>
          </div>
          <div>
            <dt>强联系</dt>
            <dd className="mono">{connections.edges.filter((edge) => edge.tier === 'strong').length}</dd>
          </div>
        </dl>
      </header>

      {hasStars ? (
        <>
          <section className="stars-graph-card" aria-labelledby="stars-graph-title">
            <div className="stars-section-head">
              <h2 id="stars-graph-title">灵感网络</h2>
              <span className="stars-section-note">
                连线 = 自动发现的联系；实线为规则（同主题 / 共同标签 / 引用关系 / 同期），金色虚线为 AI 语义
              </span>
            </div>
            <svg
              className="stars-graph"
              viewBox={`0 0 ${GRAPH_WIDTH} ${GRAPH_HEIGHT}`}
              role="img"
              aria-label={`灵感网络：${starredEntries.length} 个节点、${connections.edges.length} 条自动联系`}
            >
              <g className="stars-edges">
                {connections.edges.map((edge) => {
                  const from = positions.get(edge.a);
                  const to = positions.get(edge.b);
                  if (!from || !to) return null;
                  const dim = highlighted && !(highlighted.has(edge.a) && highlighted.has(edge.b));
                  return (
                    <line
                      key={`${edge.a}-${edge.b}`}
                      x1={from.x}
                      y1={from.y}
                      x2={to.x}
                      y2={to.y}
                      className={`stars-edge tier-${edge.tier}${edge.ai ? ' is-ai' : ''}${dim ? ' is-dim' : ''}`}
                      strokeWidth={edge.tier === 'strong' ? 2.6 : edge.tier === 'medium' ? 1.6 : 1}
                      opacity={dim ? 0.1 : edge.tier === 'weak' ? 0.35 : 0.6}
                    >
                      <title>{`${TIER_LABEL[edge.tier]}联系 · ${edge.score.toFixed(0)} 分\n${edge.reasons.join('；')}`}</title>
                    </line>
                  );
                })}
              </g>
              <g className="stars-nodes">
                {starredEntries.map((entry) => {
                  const point = positions.get(entry.id);
                  if (!point) return null;
                  const radius = 7 + entry.importance * 1.1;
                  const isHover = hovered === entry.id;
                  const dim = highlighted !== null && !highlighted.has(entry.id);
                  return (
                    <g
                      key={entry.id}
                      className={`stars-node${isHover ? ' is-hover' : ''}${dim ? ' is-dim' : ''}`}
                      transform={`translate(${point.x}, ${point.y})`}
                      onMouseEnter={() => setHovered(entry.id)}
                      onMouseLeave={() => setHovered(null)}
                      onClick={() => openEntry(entry)}
                      tabIndex={0}
                      role="button"
                      aria-label={`${entry.title}（${entry.date}）`}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          openEntry(entry);
                        }
                      }}
                    >
                      <circle r={radius} fill={categoryColor(primaryCategory(entry.categories))} />
                      <circle r={radius + 4} className="stars-node-ring" />
                      <text y={radius + 15} className="stars-node-label">
                        {shortTitle(entry)}
                      </text>
                      <title>{`${entry.title}\n${entry.summary}`}</title>
                    </g>
                  );
                })}
              </g>
            </svg>
            <p className={`stars-ai-note${connections.aiEnabled ? ' is-on' : ''}`}>
              {connections.aiEnabled
                ? 'AI 语义层已启用：构建期由免费模型（GLM-4.7-Flash）为条目提取主题与关键词，金色虚线 = AI 也认为相关。'
                : 'AI 语义层未启用：在 GitHub 仓库添加 ZHIPU_API_KEY secret 后重新部署，即可用免费 GLM-4.7-Flash 辅助判断「为什么相关」。当前显示规则联系。'}
            </p>
          </section>

          {connections.edges.length > 0 && (
            <section className="stars-section" aria-labelledby="stars-links-title">
              <div className="stars-section-head">
                <h2 id="stars-links-title">自动联系</h2>
                <span className="stars-section-note">
                  Top {Math.min(10, connections.edges.length)} · 强/中/弱 = 联系强度
                </span>
              </div>
              <ul className="stars-link-list">
                {connections.edges.slice(0, 10).map((edge) => {
                  const left = byId.get(edge.a);
                  const right = byId.get(edge.b);
                  if (!left || !right) return null;
                  return (
                    <li key={`${edge.a}-${edge.b}`} className="stars-link">
                      <span className={`stars-tier is-${edge.tier}`}>{TIER_LABEL[edge.tier]}</span>
                      {edge.ai && <span className="stars-ai-badge">AI</span>}
                      <button type="button" className="stars-link-title" onClick={() => openEntry(left)}>
                        {left.title}
                      </button>
                      <span className="stars-link-arrow" aria-hidden="true">
                        ↔
                      </span>
                      <button type="button" className="stars-link-title" onClick={() => openEntry(right)}>
                        {right.title}
                      </button>
                      <span className="stars-link-reason">{edge.reasons.join('；')}</span>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          <section className="stars-section" aria-labelledby="stars-list-title">
            <div className="stars-section-head">
              <h2 id="stars-list-title">星标条目</h2>
              <span className="stars-section-note">按加星时间倒序</span>
            </div>
            <div className="stars-list">
              {starredEntries.map((entry) => (
                <article
                  key={entry.id}
                  className="stars-card"
                  role="button"
                  tabIndex={0}
                  style={{ borderLeftColor: categoryColor(primaryCategory(entry.categories)) }}
                  onClick={() => openEntry(entry)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      openEntry(entry);
                    }
                  }}
                >
                  <div className="stars-card-top">
                    <span className="stars-card-date mono">{formatDate(entry.date)}</span>
                    <TypeBadge type={entry.type} />
                    <ImportanceBadge value={entry.importance} />
                    <span className="stars-card-links mono">
                      {(connections.degree[entry.id] ?? 0) > 0
                        ? `${connections.degree[entry.id]} 条联系`
                        : '暂无联系'}
                    </span>
                    <StarButton entryId={entry.id} />
                  </div>
                  <h3 className="stars-card-title">{entry.title}</h3>
                  <p className="stars-card-summary">{entry.summary}</p>
                  <CategoryChips categories={entry.categories} max={3} />
                </article>
              ))}
            </div>
          </section>
        </>
      ) : (
        <div className="stars-empty">
          <EmptyState
            title="还没有星标"
            description="去「最新动态」或任意条目详情页，点 ☆ 收藏对你有启发的内容；收藏会保存在本机，并自动长成一张灵感网络。"
          />
          <a className="stars-empty-cta" href="#/feed">
            去最新动态找灵感 →
          </a>
        </div>
      )}
    </div>
  );
}
