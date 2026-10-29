import { CATEGORY_META, CATEGORY_ORDER } from '../../theme/categories';
import type { Category } from '../../lib/types';

export interface LegendProps {
  counts: Partial<Record<Category, number>>;
  hidden: Category[];
  onToggle: (category: Category) => void;
}

/** 类别图例：颜色全局固定；点击切换「隐藏/显示」，隐藏的类别在时间轴上变暗但不重排 */
export function Legend({ counts, hidden, onToggle }: LegendProps) {
  const hiddenSet = new Set(hidden);
  return (
    <ul className="legend" aria-label="类别图例">
      {CATEGORY_ORDER.map((category) => {
        const meta = CATEGORY_META[category];
        const count = counts[category] ?? 0;
        const isHidden = hiddenSet.has(category);
        return (
          <li key={category}>
            <button
              type="button"
              className={`legend-item${isHidden ? ' is-hidden' : ''}`}
              onClick={() => onToggle(category)}
              aria-pressed={!isHidden}
              title={`${meta.label} · ${count} 条（点击${isHidden ? '显示' : '隐藏'}）`}
            >
              <span className="legend-dot" style={{ background: meta.color }} aria-hidden="true" />
              <span>{meta.label}</span>
              <span className="legend-count mono">{count}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
