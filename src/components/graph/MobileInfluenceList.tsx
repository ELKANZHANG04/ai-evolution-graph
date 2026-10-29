import { useMemo } from 'react';
import type { JSX } from 'react';
import { ImportanceBadge } from '../common/Badges';
import { EmptyState } from '../common/EmptyState';
import { getFocusChains, type FocusChainItem } from '../../lib/layout/graph-layout';
import { formatDate } from '../../lib/format';
import type { Category, GraphEdge, GraphNode, RelationType } from '../../lib/types';
import { categoryColor, primaryCategory } from '../../theme/categories';
import { RELATION_META } from '../../theme/relations';
import './graph.css';

export interface MobileInfluenceListProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  focusId: string | null;
  hiddenCategories: Category[];
  onSelect: (entryId: string) => void;
  onFocusChange: (entryId: string | null) => void;
}

interface RowProps {
  node: GraphNode;
  relationType?: RelationType | null;
  hop?: number;
  hidden: boolean;
  focused?: boolean;
  onSelect: (entryId: string) => void;
  onFocusChange: (entryId: string | null) => void;
}

function MobileChainRow({
  node,
  relationType,
  hop = 0,
  hidden,
  focused = false,
  onSelect,
  onFocusChange,
}: RowProps): JSX.Element {
  const relationMeta = relationType ? RELATION_META[relationType] : null;
  return (
    <li className={`im-mobile-row${hidden ? ' is-dimmed' : ''}${focused ? ' is-focus-row' : ''}`}>
      <button
        type="button"
        className="im-mobile-main"
        onClick={() => onSelect(node.id)}
        aria-label={`${node.title}，${formatDate(node.date)}，影响力 ${node.importance}/10`}
      >
        <span className="im-mobile-row-top">
          <span
            className="im-mobile-dot"
            style={{ background: categoryColor(primaryCategory(node.categories)) }}
            aria-hidden="true"
          />
          <span className="im-mobile-title">{node.title}</span>
          <ImportanceBadge value={node.importance} />
        </span>
        <span className="im-mobile-meta">
          <span className="mono">{formatDate(node.date)}</span>
          {relationMeta && (
            <span className="im-mobile-rel">
              <i style={{ background: relationMeta.color }} aria-hidden="true" />
              {relationMeta.label}
            </span>
          )}
          {hop > 1 && <span className="im-mobile-hop">{hop} 跳</span>}
        </span>
      </button>
      {!focused && (
        <button
          type="button"
          className="im-mobile-focus"
          onClick={() => onFocusChange(node.id)}
          aria-label={`以 ${node.title} 为中心查看影响链`}
          title="以它为中心"
        >
          聚焦
        </button>
      )}
    </li>
  );
}

function sortByImportance(nodes: readonly GraphNode[]): GraphNode[] {
  return [...nodes].sort(
    (a, b) => b.importance - a.importance || a.date.localeCompare(b.date) || a.id.localeCompare(b.id),
  );
}

function ChainGroup({
  title,
  items,
  hiddenSet,
  onSelect,
  onFocusChange,
}: {
  title: string;
  items: FocusChainItem[];
  hiddenSet: Set<Category>;
  onSelect: (entryId: string) => void;
  onFocusChange: (entryId: string | null) => void;
}): JSX.Element | null {
  if (items.length === 0) return null;
  return (
    <section className="im-mobile-group" aria-label={title}>
      <h3 className="im-mobile-group-title">
        {title}
        <span className="im-mobile-group-count mono">{items.length}</span>
      </h3>
      <ul className="im-mobile-list">
        {items.map((item) => (
          <MobileChainRow
            key={item.node.id}
            node={item.node}
            relationType={item.relationType}
            hop={item.hop}
            hidden={item.node.categories.some((category) => hiddenSet.has(category))}
            onSelect={onSelect}
            onFocusChange={onFocusChange}
          />
        ))}
      </ul>
    </section>
  );
}

/**
 * < 900px 的影响图谱降级：聚焦模式展示「上游 / 此条目 / 下游」三组列表，
 * 全局模式展示 importance 最高的 12 条 + 进入影响链的入口。
 */
export function MobileInfluenceList({
  nodes,
  edges,
  focusId,
  hiddenCategories,
  onSelect,
  onFocusChange,
}: MobileInfluenceListProps): JSX.Element {
  const hiddenSet = useMemo(() => new Set(hiddenCategories), [hiddenCategories]);
  const chains = useMemo(
    () => (focusId ? getFocusChains(nodes, edges, focusId) : null),
    [nodes, edges, focusId],
  );
  const topNodes = useMemo(() => sortByImportance(nodes).slice(0, 12), [nodes]);

  if (nodes.length === 0) {
    return (
      <div className="im-mobile">
        <div className="im-mobile-empty">
          <EmptyState title="暂无图谱数据" description="数据准备中；每条带关系的条目会自动出现在这里。" />
        </div>
      </div>
    );
  }

  if (focusId) {
    if (!chains?.focusNode) {
      return (
        <div className="im-mobile">
          <div className="im-mobile-empty">
            <EmptyState title="未找到聚焦节点" description="该条目可能已被移除，先回到全局视图继续浏览。" />
            <button type="button" className="im-tool-btn" onClick={() => onFocusChange(null)}>
              返回全局
            </button>
          </div>
        </div>
      );
    }

    const focusNode = chains.focusNode;
    return (
      <div className="im-mobile">
        <div className="im-mobile-focus-head">
          <div className="im-mobile-focus-info">
            <p className="im-mobile-kicker">聚焦模式</p>
            <p className="im-mobile-focus-title">{focusNode.title}</p>
            <p className="im-mobile-focus-meta">
              <span className="mono">{formatDate(focusNode.date)}</span>
              <span>·</span>
              <span>上游 {chains.upstreamCount}</span>
              <span>/</span>
              <span>下游 {chains.downstreamCount}</span>
            </p>
          </div>
          <button type="button" className="im-tool-btn" onClick={() => onFocusChange(null)}>
            返回全局
          </button>
        </div>

        <ChainGroup
          title="上游"
          items={chains.upstream}
          hiddenSet={hiddenSet}
          onSelect={onSelect}
          onFocusChange={onFocusChange}
        />

        <section className="im-mobile-group" aria-label="此条目">
          <h3 className="im-mobile-group-title">此条目</h3>
          <ul className="im-mobile-list">
            <MobileChainRow
              node={focusNode}
              hidden={focusNode.categories.some((category) => hiddenSet.has(category))}
              focused
              onSelect={onSelect}
              onFocusChange={onFocusChange}
            />
          </ul>
        </section>

        <ChainGroup
          title="下游"
          items={chains.downstream}
          hiddenSet={hiddenSet}
          onSelect={onSelect}
          onFocusChange={onFocusChange}
        />
      </div>
    );
  }

  return (
    <div className="im-mobile">
      <p className="im-mobile-hint">
        点击条目看详情；点「聚焦」进入以它为中心的影响链（上游 / 下游）。桌面端有可缩放的连边全景图。
      </p>
      <section className="im-mobile-group" aria-label="影响力最高的条目">
        <h3 className="im-mobile-group-title">
          影响力最高
          <span className="im-mobile-group-count mono">{topNodes.length} / {nodes.length}</span>
        </h3>
        <ul className="im-mobile-list">
          {topNodes.map((node) => (
            <MobileChainRow
              key={node.id}
              node={node}
              hidden={node.categories.some((category) => hiddenSet.has(category))}
              onSelect={onSelect}
              onFocusChange={onFocusChange}
            />
          ))}
        </ul>
      </section>
    </div>
  );
}
