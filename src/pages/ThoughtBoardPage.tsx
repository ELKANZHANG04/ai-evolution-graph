import { useMemo } from 'react';
import { EntryDrawer } from '../components/detail/EntryDrawer';
import { ThoughtBoard } from '../components/thoughts/ThoughtBoard';
import type { HashRoute } from '../hooks/useHashRoute';
import { ENTRIES, getEntryById } from '../lib/data';
import { buildThoughtChains } from '../lib/thoughtChains';
import type { Entry } from '../lib/types';

/** 思想看板：言论与思想不放进图谱，用「命题 → 推进 → 修正/反驳」的列看板呈现 */
export function ThoughtBoardPage({ route }: { route: HashRoute }) {
  const chains = useMemo(() => buildThoughtChains(ENTRIES), []);
  const selectedId = route.params.get('entry');
  const selected = getEntryById(selectedId);

  const insightCount = chains.reduce(
    (sum, chain) => sum + chain.steps.filter((step) => step.entry.type === 'insight').length,
    0,
  );
  const arrowCount = chains.reduce((sum, chain) => sum + Math.max(0, chain.steps.length - 1), 0);

  const selectEntry = (entry: Entry) => {
    route.setParams((params) => params.set('entry', entry.id));
  };

  const closeEntry = () => {
    route.setParams((params) => params.delete('entry'));
  };

  return (
    <div className="thoughts-page">
      <header className="thoughts-hero">
        <p className="mainline-kicker">IDEAS · 思想如何递进，又如何被推翻</p>
        <h1>思想看板</h1>
        <p className="mainline-sub">
          不放进图里的那些话：每条链从「命题」出发，经过推进、修正或反驳。卡片以一句话主张 + 思想概括为主，原文可展开；点开是完整论证、出处与关联条目。
        </p>
        <dl className="thoughts-stats">
          <div>
            <dt>思想链</dt>
            <dd className="mono">{chains.length}</dd>
          </div>
          <div>
            <dt>观点卡</dt>
            <dd className="mono">{insightCount}</dd>
          </div>
          <div>
            <dt>递进/反驳</dt>
            <dd className="mono">{arrowCount}</dd>
          </div>
        </dl>
      </header>

      <ThoughtBoard chains={chains} selectedId={selectedId} onSelect={selectEntry} />

      <EntryDrawer
        entry={selected ?? null}
        onClose={closeEntry}
        onNavigate={(entryId) => route.setParams((params) => params.set('entry', entryId))}
      />
    </div>
  );
}
