import { useMemo, useState } from 'react';
import type { JSX } from 'react';
import { ImportanceBadge, TypeBadge } from '../components/common/Badges';
import { StarButton } from '../components/common/StarButton';
import { EmptyState } from '../components/common/EmptyState';
import type { HashRoute } from '../hooks/useHashRoute';
import { buildStarConnections, layoutStarGraph } from '../lib/connections';
import { getAiLinkInfo, getSemanticEntryCount } from '../lib/semantic';
import { ENTRIES, getEntryById } from '../lib/data';
import { formatDate } from '../lib/format';
import { useStars } from '../lib/stars';
import type { Entry } from '../lib/types';
import './starred.css';

const GRAPH_WIDTH = 820;
const GRAPH_HEIGHT = 420;
const MAX_LABEL = 14;

const TIER_LABEL = { strong: '强', medium: '中', weak: '弱' } as const;

const THEME_COLORS = [
  '#60a5fa',
  '#f472b6',
  '#34d399',
  '#f5c542',
  '#a78bfa',
  '#fb923c',
  '#2dd4bf',
  '#f87171',
  '#22d3ee',
  '#c084fc',
  '#facc15',
  '#4ade80',
];

function hashColor(label: string): string {
  let hash = 0;
  for (const char of label) hash = (hash * 31 + char.codePointAt(0)!) % 997;
  return THEME_COLORS[hash % THEME_COLORS.length];
}

function shortTitle(entry: Entry): string {
  const chars = [...entry.title];
  return chars.length > MAX_LABEL ? `${chars.slice(0, MAX_LABEL).join('')}…` : entry.title;
}

interface StarGroup {
  key: string;
  label: string;
  color: string;
  entries: Entry[];
  /** 自动分类依据 */
  basis: string;
}

/** 我的灵感：星标 + 自动分类（AI 主题簇）+ 簇内/跨簇关联 */
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

  // 先分类：以 AI 主主题为基础形成簇（≥2 条才成簇），其余条目按次主题并入已有簇，
  // 仍无法归入的进「其他线索」。分类随星标增减动态调整，不预设固定类别。
  const groups = useMemo<StarGroup[]>(() => {
    const primaryCount = new Map<string, number>();
    for (const entry of starredEntries) {
      const theme = getAiLinkInfo(entry.id)?.themes?.[0]?.trim() || '未分类';
      primaryCount.set(theme, (primaryCount.get(theme) ?? 0) + 1);
    }
    const baseThemes = [...primaryCount.entries()]
      .filter(([, count]) => count >= 2)
      .map(([theme]) => theme);
    const assignments = new Map<string, Entry[]>();
    const singles: Entry[] = [];
    for (const entry of starredEntries) {
      const themes = getAiLinkInfo(entry.id)?.themes ?? [];
      const primary = themes[0]?.trim();
      let target: string | null = null;
      if (primary && baseThemes.includes(primary)) target = primary;
      if (!target) target = themes.map((theme) => theme.trim()).find((theme) => baseThemes.includes(theme)) ?? null;
      if (!target) {
        singles.push(entry);
        continue;
      }
      const list = assignments.get(target) ?? [];
      list.push(entry);
      assignments.set(target, list);
    }

    const result: StarGroup[] = [...assignments.entries()].map(([theme, list]) => ({
      key: theme,
      label: theme,
      color: hashColor(theme),
      entries: list.sort((a, b) => b.date.localeCompare(a.date)),
      basis: 'AI 主题',
    }));
    if (singles.length > 0) {
      result.push({
        key: 'misc',
        label: '其他线索',
        color: '#94a3b8',
        entries: singles.sort((a, b) => b.date.localeCompare(a.date)),
        basis: '暂未成簇',
      });
    }
    result.sort(
      (left, right) =>
        Number(left.key === 'misc') - Number(right.key === 'misc') ||
        right.entries.length - left.entries.length ||
        left.label.localeCompare(right.label),
    );
    return result;
  }, [starredEntries]);

  const entryGroup = useMemo(() => {
    const map = new Map<string, StarGroup>();
    for (const group of groups) for (const entry of group.entries) map.set(entry.id, group);
    return map;
  }, [groups]);

  const groupCenters = useMemo(() => {
    const centers = new Map<string, { x: number; y: number; count: number }>();
    for (const group of groups) {
      let sumX = 0;
      let minY = Number.POSITIVE_INFINITY;
      let count = 0;
      for (const entry of group.entries) {
        const point = positions.get(entry.id);
        if (!point) continue;
        sumX += point.x;
        minY = Math.min(minY, point.y);
        count += 1;
      }
      if (count > 0) centers.set(group.label, { x: sumX / count, y: Math.max(18, minY - 10), count });
    }
    return centers;
  }, [groups, positions]);

  const intraEdges = useMemo(
    () => connections.edges.filter((edge) => entryGroup.get(edge.a) === entryGroup.get(edge.b)),
    [connections.edges, entryGroup],
  );
  const crossEdges = useMemo(
    () => connections.edges.filter((edge) => entryGroup.get(edge.a) !== entryGroup.get(edge.b)).slice(0, 6),
    [connections.edges, entryGroup],
  );

  const openEntry = (entry: Entry) => {
    route.setParams((params) => params.set('entry', entry.id));
  };

  const hasStars = starredEntries.length > 0;
  const highlighted = hovered
    ? new Set(connections.edges.filter((edge) => edge.a === hovered || edge.b === hovered).flatMap((edge) => [edge.a, edge.b]))
    : null;

  const groupOf = (id: string): StarGroup | undefined => entryGroup.get(id);

  return (
    <div className="stars-page">
      <header className="stars-hero">
        <p className="stars-kicker mono">MY INSPIRATION · 只属于你</p>
        <h1>我的灵感</h1>
        <p className="stars-sub">
          点 ☆ 把「对我有启发」的内容收进来，只存在你本机。系统会先按 AI 主题自动归成几个簇（随新星标动态变化），再在相关的条目之间连线，并写出「关联之处」。
        </p>
        <dl className="stars-stats">
          <div>
            <dt>星标</dt>
            <dd className="mono">{starredEntries.length}</dd>
          </div>
          <div>
            <dt>自动分类</dt>
            <dd className="mono">{groups.length}</dd>
          </div>
          <div>
            <dt>自动联系</dt>
            <dd className="mono">{connections.edges.length}</dd>
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
                颜色 = 自动分类；实线 = 规则关联，金色虚线 = AI 语义也认为相关；粗/细 = 强/弱
              </span>
            </div>
            <svg
              className="stars-graph"
              viewBox={`0 0 ${GRAPH_WIDTH} ${GRAPH_HEIGHT}`}
              role="img"
              aria-label={`灵感网络：${starredEntries.length} 个节点、${groups.length} 个自动分类、${connections.edges.length} 条联系`}
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
                  const group = groupOf(entry.id);
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
                      <circle r={radius} fill={group?.color ?? '#94a3b8'} />
                      <circle r={radius + 4} className="stars-node-ring" />
                      <text y={radius + 15} className="stars-node-label">
                        {shortTitle(entry)}
                      </text>
                      <title>{`${entry.title}\n${entry.summary}`}</title>
                    </g>
                  );
                })}
              </g>
              <g className="stars-clusters">
                {[...groupCenters.entries()].map(([label, center]) => (
                  <g key={label} transform={`translate(${center.x}, ${center.y})`} className="stars-cluster-label">
                    <rect x={-((label.length * 6.5) + 10)} y={-12} width={label.length * 13 + 20} height={20} rx={10} />
                    <text y={2.5}>{label}</text>
                  </g>
                ))}
              </g>
            </svg>
            <p className={`stars-ai-note${connections.aiEnabled ? ' is-on' : ''}`}>
              {connections.aiEnabled
                ? `AI 语义层已启用（已为 ${getSemanticEntryCount()} 条生成主题/关键词）：分类与金色虚线都来自语义层，悬停/列表可看到理由。`
                : 'AI 语义层未启用：在 GitHub 仓库添加 ZHIPU_API_KEY secret 后重新部署，即可用免费 GLM-4.7-Flash 辅助分类与关联；当前显示规则联系。'}
            </p>
          </section>

          <section className="stars-section" aria-labelledby="stars-groups-title">
            <div className="stars-section-head">
              <h2 id="stars-groups-title">主题簇 · 自动分类</h2>
              <span className="stars-section-note">按 AI 主题归纳，随星标变化自动调整；单条暂归「其他线索」</span>
            </div>
            <div className="stars-groups">
              {groups.map((group) => {
                const edges = intraEdges.filter((edge) => entryGroup.get(edge.a) === group);
                return (
                  <div className="stars-group" key={group.key}>
                    <header className="stars-group-head">
                      <span className="stars-group-dot" style={{ background: group.color }} aria-hidden="true" />
                      <h3 className="stars-group-title">{group.label}</h3>
                      <span className="stars-group-count mono">{group.entries.length} 条</span>
                      <span className="stars-group-basis">{group.basis}</span>
                    </header>
                    <ul className="stars-entries">
                      {group.entries.map((entry) => {
                        const info = getAiLinkInfo(entry.id);
                        return (
                          <li key={entry.id} className="stars-entry">
                            <button type="button" className="stars-entry-main" onClick={() => openEntry(entry)}>
                              <span className="stars-entry-date mono">{formatDate(entry.date)}</span>
                              <TypeBadge type={entry.type} />
                              <ImportanceBadge value={entry.importance} />
                              <span className="stars-entry-title">{entry.title}</span>
                              {info && (
                                <span className="stars-entry-ai" title={(info.keywords ?? []).join('、')}>
                                  AI · {(info.themes ?? []).join(' / ')}
                                  {(info.keywords ?? []).length > 0 ? ` · ${(info.keywords ?? []).slice(0, 3).join('、')}` : ''}
                                </span>
                              )}
                            </button>
                            <StarButton entryId={entry.id} />
                          </li>
                        );
                      })}
                    </ul>
                    {edges.length > 0 && (
                      <ul className="stars-relations">
                        {edges.map((edge) => (
                          <li key={`${edge.a}-${edge.b}`} className="stars-relation">
                            <span className={`stars-tier is-${edge.tier}`}>{TIER_LABEL[edge.tier]}</span>
                            {edge.ai && <span className="stars-ai-badge">AI</span>}
                            <span className="stars-relation-pair">
                              {byId.get(edge.a)?.title ?? edge.a} ↔ {byId.get(edge.b)?.title ?? edge.b}
                            </span>
                            <span className="stars-relation-reason">
                              关联之处：{edge.reasons.length > 0 ? edge.reasons.join('；') : '综合相关'}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {crossEdges.length > 0 && (
            <section className="stars-section" aria-labelledby="stars-cross-title">
              <div className="stars-section-head">
                <h2 id="stars-cross-title">跨簇联系</h2>
                <span className="stars-section-note">不同分类之间的隐藏关联</span>
              </div>
              <ul className="stars-relations">
                {crossEdges.map((edge) => (
                  <li key={`${edge.a}-${edge.b}`} className="stars-relation">
                    <span className={`stars-tier is-${edge.tier}`}>{TIER_LABEL[edge.tier]}</span>
                    {edge.ai && <span className="stars-ai-badge">AI</span>}
                    <span className="stars-relation-pair">
                      {byId.get(edge.a)?.title ?? edge.a} ↔ {byId.get(edge.b)?.title ?? edge.b}
                    </span>
                    <span className="stars-relation-reason">关联之处：{edge.reasons.join('；')}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      ) : (
        <div className="stars-empty">
          <EmptyState
            title="还没有星标"
            description="去「最新动态」或任意条目详情页，点 ☆ 收藏对你有启发的内容；收藏会保存在本机，并自动分类、生成灵感网络。"
          />
          <a className="stars-empty-cta" href="#/feed">
            去最新动态找灵感 →
          </a>
        </div>
      )}
    </div>
  );
}
