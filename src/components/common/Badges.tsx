import type { Category, EntryType } from '../../lib/types';
import { CATEGORY_META, categoryColor } from '../../theme/categories';
import { importanceAnchor } from '../../theme/importance';

const TYPE_LABEL: Record<EntryType, string> = {
  event: '突破事件',
  insight: '观点/思想',
  product: '产品发布',
};

export function TypeBadge({ type }: { type: EntryType }) {
  return <span className={`badge badge-type type-${type}`}>{TYPE_LABEL[type]}</span>;
}

export function ImportanceBadge({ value, withAnchor = false }: { value: number; withAnchor?: boolean }) {
  const anchor = importanceAnchor(value);
  return (
    <span
      className="badge badge-importance"
      style={{ color: anchor.color, background: `${anchor.color}1f`, borderColor: `${anchor.color}55` }}
      title={`影响力 ${value}/10 · ${anchor.label}`}
    >
      <span aria-hidden="true">◆</span>
      <span className="mono">{value}</span>
      {withAnchor && <span className="badge-sub">{anchor.label}</span>}
    </span>
  );
}

export function ReviewBadge({ compact = false }: { compact?: boolean }) {
  return (
    <span className="badge badge-review" title="事实/日期/来源待核对">
      <span aria-hidden="true">⚠</span>
      {compact ? '待核对' : '待核对'}
    </span>
  );
}

export function NewBadge() {
  return <span className="badge badge-new">NEW</span>;
}

export function CategoryChips({ categories, max = 4 }: { categories: Category[]; max?: number }) {
  const shown = categories.slice(0, max);
  const rest = categories.length - shown.length;
  return (
    <span className="chips">
      {shown.map((category) => (
        <span key={category} className="chip chip-cat">
          <span className="chip-dot" style={{ background: categoryColor(category) }} aria-hidden="true" />
          {CATEGORY_META[category].label}
        </span>
      ))}
      {rest > 0 && <span className="chip">+{rest}</span>}
    </span>
  );
}
