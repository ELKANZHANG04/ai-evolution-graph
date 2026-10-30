import { useMemo } from 'react';
import { EntryDrawer } from '../components/detail/EntryDrawer';
import { ThoughtBoard } from '../components/thoughts/ThoughtBoard';
import type { HashRoute } from '../hooks/useHashRoute';
import { ENTRIES, getEntryById } from '../lib/data';
import { buildThoughtChains } from '../lib/thoughtChains';
import { formatDate } from '../lib/format';
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
  const stepDates = chains
    .flatMap((chain) => chain.steps.map((step) => step.entry.date))
    .filter((date) => /^\d{4}-\d{2}-\d{2}$/.test(date))
    .sort();
  const firstYear = stepDates.length > 0 ? stepDates[0].slice(0, 4) : null;
  const latestDate = stepDates.length > 0 ? stepDates[stepDates.length - 1] : null;
  const lastYear = latestDate ? latestDate.slice(0, 4) : null;
  const yearRange = firstYear && lastYear ? `${firstYear}–${lastYear}` : '—';

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
          不放进图里的那些话：每条链从「命题」出发，经过推进、修正或反驳。主题持续被讨论才有价值——卡片以一句话主张 + 思想概括为主，原文可展开；点开是完整论证、出处与关联条目。带「新方向」标记的，是既有路径上还没被主流吸收的新方向（创新雷达）。
        </p>
        <dl className="thoughts-stats">
          <div>
            <dt>主题</dt>
            <dd className="mono">{chains.length}</dd>
          </div>
          <div>
            <dt>观点卡</dt>
            <dd className="mono">{insightCount}</dd>
          </div>
          <div>
            <dt>年份覆盖</dt>
            <dd className="mono">{yearRange}</dd>
          </div>
          <div>
            <dt>最新讨论</dt>
            <dd className="mono">{latestDate ? formatDate(latestDate) : '—'}</dd>
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
