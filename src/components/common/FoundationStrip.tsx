import { useState } from 'react';
import type { Entry } from '../../lib/types';
import { categoryColor, primaryCategory } from '../../theme/categories';
import { importanceColor } from '../../theme/importance';

export interface FoundationStripProps {
  entries: Entry[];
  onSelect: (entry: Entry) => void;
}

/**
 * 奠基时代（< 2012）折叠区：
 * 时间轴主体从 2012 开始；图灵测试、达特茅斯会议、反向传播、深蓝等
 * 折叠为一个可展开的摘要区（需求：M1 后折叠，不展开成长时间轴）。
 */
export function FoundationStrip({ entries, onSelect }: FoundationStripProps) {
  const [open, setOpen] = useState(false);
  if (entries.length === 0) return null;

  const years = entries.map((entry) => Number(entry.date.slice(0, 4))).filter(Number.isFinite);
  const first = Math.min(...years);
  const last = Math.max(...years);

  return (
    <div className={`foundation${open ? ' is-open' : ''}`}>
      <button
        type="button"
        className="foundation-toggle"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        <span className="foundation-mark" aria-hidden="true" />
        <span className="foundation-label">
          奠基时代 <span className="mono">{first}–{last}</span>
        </span>
        <span className="foundation-count mono">{entries.length} 条</span>
        <span className="foundation-hint">{open ? '收起' : '展开'}</span>
        <span className={`foundation-chevron${open ? ' is-open' : ''}`} aria-hidden="true">
          ▾
        </span>
      </button>

      {open && (
        <ul className="foundation-list">
          {entries.map((entry) => (
            <li key={entry.id}>
              <button type="button" className="foundation-item" onClick={() => onSelect(entry)}>
                <span
                  className="foundation-dot"
                  style={{ background: categoryColor(primaryCategory(entry.categories)) }}
                  aria-hidden="true"
                />
                <span className="foundation-year mono">{entry.date.slice(0, 4)}</span>
                <span className="foundation-title">{entry.title}</span>
                <span className="foundation-score mono" style={{ color: importanceColor(entry.importance) }}>
                  {entry.importance}
                </span>
                {entry.needs_review && (
                  <span className="foundation-review" title="待核对">
                    ⚠
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
