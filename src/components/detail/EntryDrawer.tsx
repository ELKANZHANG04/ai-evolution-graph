import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { JSX } from 'react';
import { CategoryChips, ImportanceBadge, NewBadge, ReviewBadge, TypeBadge } from '../common/Badges';
import { StarButton } from '../common/StarButton';
import { incomingRelations, relatedEntries } from '../../lib/data';
import { buildCitation, formatDateLong, hostnameOf, isRecent } from '../../lib/format';
import type { Entry } from '../../lib/types';
import { MarkdownLite } from './MarkdownLite';
import './drawer.css';

export interface EntryDrawerProps {
  entry: Entry | null;
  onClose: () => void;
  onNavigate: (entryId: string) => void;
}

type CopyState = 'idle' | 'ok' | 'fail';

/** 复制文本：优先 Clipboard API，失败降级到 textarea + execCommand。 */
async function copyText(text: string): Promise<boolean> {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // 权限/非安全上下文失败，继续走降级路径
  }

  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.top = '-1000px';
    textarea.style.left = '-1000px';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand('copy');
    textarea.remove();
    return ok;
  } catch {
    return false;
  }
}

/**
 * 右侧滑出详情面板（M1 基础版）：
 * - 锁 body 滚动、聚焦关闭按钮、Esc / 遮罩关闭、Tab 焦点循环；
 * - 内容顺序：徽标行 → 类别 → 摘要 → 为什么重要 → quote（insight）→ 短评 → 深度解读 → 来源 → 关联条目 → 复制引用。
 */
export function EntryDrawer({ entry, onClose, onNavigate }: EntryDrawerProps): JSX.Element | null {
  const [copyState, setCopyState] = useState<CopyState>('idle');
  const panelRef = useRef<HTMLElement | null>(null);
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const copyTimerRef = useRef<number | null>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);

  const isOpen = entry !== null;
  const entryId = entry?.id ?? null;

  const outgoing = useMemo(() => (entry ? relatedEntries(entry) : []), [entry]);
  const incoming = useMemo(() => (entry ? incomingRelations(entry) : []), [entry]);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // 打开期间：锁滚动、聚焦关闭按钮、Esc 关闭、Tab 焦点圈在面板内。
  useEffect(() => {
    if (!isOpen) return;

    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    restoreFocusRef.current = previouslyFocused;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab') return;

      const panel = panelRef.current;
      if (!panel) return;
      const focusable = Array.from(
        panel.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'),
      ).filter((element) => element.getClientRects().length > 0);
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      } else if (event.shiftKey && (active === first || !panel.contains(active))) {
        event.preventDefault();
        last.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      const restoreTarget = restoreFocusRef.current;
      restoreFocusRef.current = null;
      if (restoreTarget?.isConnected) restoreTarget.focus();
    };
  }, [isOpen]);

  // 切换条目（关联条目跳转）时滚回顶部、重置复制状态。
  useEffect(() => {
    if (!entryId) return;
    if (bodyRef.current) bodyRef.current.scrollTop = 0;
    setCopyState('idle');
    // 关联条目跳转后把焦点收回标题区关闭按钮，避免焦点落在被移除的按钮上。
    closeButtonRef.current?.focus({ preventScroll: true });
  }, [entryId]);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current !== null) window.clearTimeout(copyTimerRef.current);
    };
  }, []);

  const handleOverlayClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (event.target === event.currentTarget) onClose();
    },
    [onClose],
  );

  const handleCopy = useCallback(async () => {
    if (!entry) return;
    const ok = await copyText(buildCitation(entry));
    setCopyState(ok ? 'ok' : 'fail');
    if (copyTimerRef.current !== null) window.clearTimeout(copyTimerRef.current);
    copyTimerRef.current = window.setTimeout(() => {
      copyTimerRef.current = null;
      setCopyState('idle');
    }, 1600);
  }, [entry]);

  if (!entry) return null;

  const copyLabel = copyState === 'ok' ? '已复制' : copyState === 'fail' ? '复制失败' : '复制引用';

  return (
    <div className="drawer-overlay" onClick={handleOverlayClick}>
      <aside
        className="drawer-panel"
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
      >
        <header className="drawer-head">
          <div className="drawer-heading">
            <h2 className="drawer-title" id="drawer-title">
              {entry.title}
            </h2>
            {entry.title_en && <p className="drawer-title-en">{entry.title_en}</p>}
          </div>
          <StarButton entryId={entry.id} size="md" />
          <button
            type="button"
            className="drawer-close"
            ref={closeButtonRef}
            onClick={onClose}
            aria-label="关闭详情"
            title="关闭（Esc）"
          >
            <span aria-hidden="true">✕</span>
          </button>
        </header>

        <div className="drawer-body" ref={bodyRef}>
          <div className="drawer-badges">
            <TypeBadge type={entry.type} />
            <span className="drawer-date mono">{formatDateLong(entry.date)}</span>
            <ImportanceBadge value={entry.importance} withAnchor />
            {entry.needs_review && <ReviewBadge />}
            {isRecent(entry) && <NewBadge />}
          </div>

          {entry.categories.length > 0 && <CategoryChips categories={entry.categories} max={10} />}

          <p className="drawer-summary">{entry.summary}</p>

          <section className="drawer-section">
            <h3 className="drawer-section-title">为什么重要</h3>
            <p className="drawer-significance">{entry.significance}</p>
          </section>

          {entry.quote && (
            <section className="drawer-section">
              <h3 className="drawer-section-title">原话</h3>
              <blockquote className="drawer-quote">
                <p className="drawer-quote-text">“{entry.quote}”</p>
                {(entry.speaker || entry.occasion) && (
                  <footer className="drawer-quote-meta">
                    {entry.speaker && <span className="drawer-quote-speaker">{entry.speaker}</span>}
                    {entry.occasion && <span className="drawer-quote-occasion">· {entry.occasion}</span>}
                  </footer>
                )}
              </blockquote>
            </section>
          )}

          {entry.my_comment && (
            <section className="drawer-section">
              <h3 className="drawer-section-title">我的短评</h3>
              <p className="drawer-comment">{entry.my_comment}</p>
            </section>
          )}

          {entry.body && entry.body.trim().length > 0 && (
            <section className="drawer-section">
              <h3 className="drawer-section-title">深度解读</h3>
              <MarkdownLite text={entry.body} />
            </section>
          )}

          <section className="drawer-section">
            <h3 className="drawer-section-title">来源</h3>
            {entry.sources.length > 0 ? (
              <ol className="drawer-sources">
                {entry.sources.map((source, index) => (
                  <li key={`${source}-${index}`}>
                    <span className="drawer-source-index mono" aria-hidden="true">
                      {index + 1}
                    </span>
                    <a href={source} target="_blank" rel="noreferrer" title={source}>
                      {hostnameOf(source)}
                      <span className="drawer-source-arrow" aria-hidden="true">
                        ↗
                      </span>
                    </a>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="drawer-muted">暂无来源链接</p>
            )}
          </section>

          <section className="drawer-section">
            <h3 className="drawer-section-title">关联条目</h3>
            {outgoing.length === 0 && incoming.length === 0 ? (
              <p className="drawer-muted">暂无关联条目</p>
            ) : (
              <div className="drawer-relations">
                {outgoing.length > 0 && (
                  <div className="drawer-rel-group">
                    <p className="drawer-rel-label">此条目 → 目标</p>
                    <ul className="drawer-rel-list">
                      {outgoing.map((relation) => (
                        <li key={`out-${relation.entry.id}`}>
                          <button
                            type="button"
                            className="drawer-rel"
                            onClick={() => onNavigate(relation.entry.id)}
                            aria-label={`跳转：此条目 → ${relation.entry.title}（${relation.type}）`}
                          >
                            <span className="drawer-rel-flow">
                              <span className="drawer-rel-arrow" aria-hidden="true">
                                →
                              </span>
                              <span className="drawer-rel-title">{relation.entry.title}</span>
                            </span>
                            <span className="drawer-rel-type">{relation.type}</span>
                          </button>
                          {relation.note && <p className="drawer-rel-note">{relation.note}</p>}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {incoming.length > 0 && (
                  <div className="drawer-rel-group">
                    <p className="drawer-rel-label">来源 → 此条目</p>
                    <ul className="drawer-rel-list">
                      {incoming.map((relation) => (
                        <li key={`in-${relation.entry.id}`}>
                          <button
                            type="button"
                            className="drawer-rel"
                            onClick={() => onNavigate(relation.entry.id)}
                            aria-label={`跳转：${relation.entry.title} → 此条目（${relation.type}）`}
                          >
                            <span className="drawer-rel-flow">
                              <span className="drawer-rel-arrow" aria-hidden="true">
                                ←
                              </span>
                              <span className="drawer-rel-title">{relation.entry.title}</span>
                            </span>
                            <span className="drawer-rel-type">{relation.type}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>

        <footer className="drawer-foot">
          <button
            type="button"
            className={`drawer-copy${copyState === 'ok' ? ' is-ok' : copyState === 'fail' ? ' is-fail' : ''}`}
            onClick={() => void handleCopy()}
          >
            {copyLabel}
          </button>
          <span className="drawer-foot-hint">Esc 关闭 · 点击关联条目继续浏览</span>
        </footer>
      </aside>
    </div>
  );
}
