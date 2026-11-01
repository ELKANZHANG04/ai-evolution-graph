import { useMemo } from 'react';
import type { JSX } from 'react';
import { ImportanceBadge, TypeBadge } from '../components/common/Badges';
import { StarButton } from '../components/common/StarButton';
import { EmptyState } from '../components/common/EmptyState';
import { StarMainlineNetwork } from '../components/stars/StarMainlineNetwork';
import type { HashRoute } from '../hooks/useHashRoute';
import { buildStarMainlineNetwork, type StarPlacement } from '../lib/mainline-network';
import { getAiLinkInfo } from '../lib/semantic';
import { ENTRIES } from '../lib/data';
import { formatDate } from '../lib/format';
import { useStars } from '../lib/stars';
import type { Entry } from '../lib/types';
import './starred.css';

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

interface StarGroup {
  key: string;
  label: string;
  color: string;
  entries: Entry[];
  basis: string;
}

function shortAnchor(title: string): string {
  const chars = [...title];
  return chars.length > 10 ? `${chars.slice(0, 10).join('')}…` : title;
}

/** 我的灵感：星标挂到主线网络上 + 位置解读 + 主题簇归纳 */
export function StarredPage({ route }: { route: HashRoute }): JSX.Element {
  const { ids } = useStars();

  const network = useMemo(() => buildStarMainlineNetwork(ENTRIES, ids), [ids]);
  const placementById = useMemo(() => {
    const map = new Map<string, StarPlacement>();
    for (const star of network.stars) map.set(star.entry.id, star);
    return map;
  }, [network.stars]);

  const starredEntries = useMemo(() => network.stars.map((star) => star.entry), [network.stars]);

  // 分类：以主题为基础形成簇（≥2 条才成簇），其余按次主题并入，仍无归属的进「其他线索」。
  // 分类随星标增减自动调整，不预设固定类别。
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
      basis: '主题归纳',
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

  const openEntry = (entry: Entry) => {
    route.setParams((params) => params.set('entry', entry.id));
  };

  const selectedId = route.params.get('entry');
  const hasStars = network.stars.length > 0;

  const anchorSummary = (star: StarPlacement): string => {
    if (star.isMainlineMilestone) return '本身是主线里程碑';
    if (star.novel) return '新方向 · 尚未接上主线';
    return `接上：${star.anchors.map((anchor) => shortAnchor(anchor.title)).join(' · ')}`;
  };

  const relationSummary = (star: StarPlacement): string => {
    const anchor = star.anchors[0];
    if (anchor && anchor.reasons.length > 0) return anchor.reasons[0];
    if (star.isMainlineMilestone) return '这条记录就是主线的一部分。';
    return star.position;
  };

  return (
    <div
      className="stars-page"
      data-stars={network.stats.stars}
      data-ai-positions={network.stars.filter((star) => star.positionSource === 'ai').length}
    >
      <header className="stars-hero">
        <p className="stars-kicker mono">MY INSPIRATION · 只属于你</p>
        <h1>我的灵感</h1>
        <p className="stars-sub">
          点 ☆ 把「对我有启发」的内容收进来，只存在你本机。每条星标会先挂到 AI 演进主线的 27
          个里程碑上：接得上的连出关系，接不上的作为「新方向」单列。星标节点可以拖动。
        </p>
        <dl className="stars-stats">
          <div>
            <dt>星标</dt>
            <dd className="mono">{network.stats.stars}</dd>
          </div>
          <div>
            <dt>自动分类</dt>
            <dd className="mono">{groups.length}</dd>
          </div>
          <div>
            <dt>接上主线</dt>
            <dd className="mono">{network.stats.connected}</dd>
          </div>
          <div>
            <dt>新方向</dt>
            <dd className="mono">{network.stats.novel}</dd>
          </div>
        </dl>
      </header>

      {hasStars ? (
        <>
          <section className="stars-network-card" aria-labelledby="stars-network-title">
            <div className="stars-section-head">
              <h2 id="stars-network-title">主线网络</h2>
              <span className="stars-section-note">
                主线 {network.stats.mainline} 个里程碑随阶段排列；金色星标挂到接得上的节点，虚线是尚未接上的新方向
              </span>
            </div>
            <StarMainlineNetwork
              network={network}
              selectedId={selectedId}
              onSelect={(entryId) => route.setParams((params) => params.set('entry', entryId))}
            />
          </section>

          <section className="stars-positions" aria-labelledby="stars-positions-title">
            <div className="stars-section-head">
              <h2 id="stars-positions-title">星标在主线中的位置</h2>
              <span className="stars-section-note">每一条接在哪、为什么值得关注</span>
            </div>
            <ul className="stars-position-list">
              {network.stars.map((star) => (
                <li className={`stars-position-card${star.novel ? ' is-novel' : ''}`} key={star.entry.id}>
                  <div className="stars-position-top">
                    <button type="button" className="stars-position-title" onClick={() => openEntry(star.entry)}>
                      {star.entry.title}
                    </button>
                    <span className="stars-position-chapter">
                      第 {star.chapterIndex + 1} 章 · {star.chapterTitle}
                    </span>
                  </div>
                  <p className="stars-position-text">{star.position}</p>
                  <div className="stars-position-foot">
                    <span className="stars-position-date mono">{formatDate(star.entry.date)}</span>
                    <span className={`stars-position-anchor${star.novel ? ' is-novel' : ''}`}>
                      {anchorSummary(star)}
                    </span>
                    <StarButton entryId={star.entry.id} />
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="stars-section" aria-labelledby="stars-groups-title">
            <div className="stars-section-head">
              <h2 id="stars-groups-title">主题簇 · 自动分类</h2>
              <span className="stars-section-note">按主题动态归纳，随星标变化自动调整；单条暂归「其他线索」</span>
            </div>
            <div className="stars-groups">
              {groups.map((group) => (
                <div className="stars-group" key={group.key}>
                  <header className="stars-group-head">
                    <span className="stars-group-dot" style={{ background: group.color }} aria-hidden="true" />
                    <h3 className="stars-group-title">{group.label}</h3>
                    <span className="stars-group-count mono">{group.entries.length} 条</span>
                    <span className="stars-group-basis">{group.basis}</span>
                  </header>
                  <ul className="stars-entries">
                    {group.entries.map((entry) => {
                      const star = placementById.get(entry.id);
                      return (
                        <li key={entry.id} className="stars-entry">
                          <button type="button" className="stars-entry-main" onClick={() => openEntry(entry)}>
                            <span className="stars-entry-date mono">{formatDate(entry.date)}</span>
                            <TypeBadge type={entry.type} />
                            <ImportanceBadge value={entry.importance} />
                            <span className="stars-entry-title">{entry.title}</span>
                          </button>
                          <StarButton entryId={entry.id} />
                          {star && (
                            <p className="stars-entry-relation">
                              <span className={`stars-entry-anchor${star.novel ? ' is-novel' : ''}`}>
                                {star.isMainlineMilestone
                                  ? '主线里程碑'
                                  : star.novel
                                    ? '新方向'
                                    : `主线 · ${star.anchors.map((anchor) => shortAnchor(anchor.title)).join(' / ')}`}
                              </span>
                              <span className="stars-entry-reason">关联之处：{relationSummary(star)}</span>
                            </p>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        </>
      ) : (
        <div className="stars-empty">
          <EmptyState
            title="还没有星标"
            description="去「最新动态」或任意条目详情页，点 ☆ 收藏对你有启发的内容；收藏会保存在本机，并自动挂到主线上、生成位置解读。"
          />
          <a className="stars-empty-cta" href="#/feed">
            去最新动态找灵感 →
          </a>
        </div>
      )}
    </div>
  );
}
