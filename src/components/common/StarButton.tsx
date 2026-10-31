import type { JSX, MouseEvent } from 'react';
import { useStars } from '../../lib/stars';
import './StarButton.css';

export interface StarButtonProps {
  entryId: string;
  /** sm 用于列表卡片，md 用于详情抽屉 */
  size?: 'sm' | 'md';
  className?: string;
}

/** 星标按钮：加星 = 这个思想对我有启发 */
export function StarButton({ entryId, size = 'sm', className = '' }: StarButtonProps): JSX.Element {
  const { isStarred, toggle } = useStars();
  const active = isStarred(entryId);

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    toggle(entryId);
  };

  return (
    <button
      type="button"
      className={`star-btn star-btn-${size}${active ? ' is-starred' : ''} ${className}`.trim()}
      aria-pressed={active}
      aria-label={active ? '取消星标' : '加星标（这个思想对我有启发）'}
      title={active ? '已加星 · 点击取消' : '加星标 · 这个思想对我有启发'}
      data-entry-id={entryId}
      data-starred={active ? 'true' : 'false'}
      onClick={handleClick}
    >
      <span aria-hidden="true">{active ? '★' : '☆'}</span>
      {size === 'md' && <span className="star-btn-label">{active ? '已星标' : '加星标'}</span>}
    </button>
  );
}
