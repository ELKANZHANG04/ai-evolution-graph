import { Fragment } from 'react';
import type { JSX, KeyboardEvent as ReactKeyboardEvent } from 'react';
import { TypeBadge } from '../common/Badges';
import type { Entry } from '../../lib/types';
import type { ThoughtChainData, ThoughtStepData } from '../../lib/thoughtChains';
import { roleLabel } from '../../lib/thoughtChains';
import './thoughts.css';

export interface ThoughtBoardProps {
  chains: ThoughtChainData[];
  selectedId: string | null;
  onSelect: (entry: Entry) => void;
}

/** 链底部「相关实践」最多展示的 chips 数 */
const MAX_CONTEXT = 4;
/** 解读摘要取多少字 */
const DIGEST_LENGTH = 90;

/** 2022-03-29 → 2022 */
function yearOf(date: string): string {
  return date ? date.slice(0, 4) : '—';
}

/** 行内 Markdown 清理：链接/图片/HTML/强调/行内代码 */
function stripInlineMarkdown(text: string): string {
  return text
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[`*_~]+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** 从 Markdown 正文提取纯文本：去标题行、列表/引用符号与代码块 */
function plainTextOfMarkdown(body: string): string {
  return body
    .replace(/```[\s\S]*?```/g, ' ')
    .split('\n')
    .filter((line) => !/^\s{0,3}#{1,6}\s/.test(line))
    .map((line) =>
      line
        .replace(/^\s{0,3}>\s?/, '')
        .replace(/^\s{0,3}[-*+]\s+/, '')
        .replace(/^\s{0,3}\d+\.\s+/, ''),
    )
    .map(stripInlineMarkdown)
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** 截断到 max 字（尽量落在句末，避免半句） */
function truncateAtSentence(text: string, max: number): string {
  if (text.length <= max) return text;
  const slice = text.slice(0, max);
  const boundary = Math.max(
    slice.lastIndexOf('。'),
    slice.lastIndexOf('！'),
    slice.lastIndexOf('？'),
    slice.lastIndexOf('；'),
    slice.lastIndexOf('. '),
    slice.lastIndexOf('! '),
    slice.lastIndexOf('? '),
  );
  const cut = boundary >= Math.floor(max * 0.5) ? boundary + 1 : max;
  return `${text.slice(0, cut).trimEnd()}…`;
}

/** insight 的解读摘要：正文去 Markdown 后取前 ~90 字，无正文时退回 summary */
function digestOf(entry: Entry): string {
  const plain = entry.body ? plainTextOfMarkdown(entry.body) : '';
  return truncateAtSentence(plain || entry.summary, DIGEST_LENGTH);
}

interface StepCardProps {
  step: ThoughtStepData;
  selected: boolean;
  onSelect: (entry: Entry) => void;
}

function StepCard({ step, selected, onSelect }: StepCardProps): JSX.Element {
  const { entry, role } = step;
  const isInsight = entry.type === 'insight';
  const label = roleLabel(role);
  const year = yearOf(entry.date);
  const className = [
    'tb-step',
    isInsight ? 'tb-step-insight' : 'tb-step-compact',
    `tb-role-${role}`,
    selected ? 'is-selected' : '',
  ]
    .filter(Boolean)
    .join(' ');
  const kindLabel = isInsight ? '观点' : entry.type === 'product' ? '产品' : '事件';
  const digest = isInsight ? digestOf(entry) : '';
  const byline = [entry.speaker, entry.occasion].filter(Boolean).join(' · ');

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLElement>) => {
    if (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar') {
      event.preventDefault();
      onSelect(entry);
    }
  };

  return (
    <article
      className={className}
      role="button"
      tabIndex={0}
      aria-label={`${kindLabel} · ${entry.title}（${year}）· ${label}`}
      aria-current={selected ? 'true' : undefined}
      title={entry.title}
      data-entry-id={entry.id}
      data-role={role}
      onClick={() => onSelect(entry)}
      onKeyDown={handleKeyDown}
    >
      {isInsight ? (
        <>
          <div className="tb-insight-top">
            <span className="tb-year mono">{year}</span>
            <span className="tb-role-badge">{label}</span>
          </div>
          <p className="tb-quote">“{entry.quote?.trim() || entry.summary}”</p>
          {byline && (
            <p className="tb-insight-by" title={byline}>
              {entry.speaker && <span className="tb-speaker">{entry.speaker}</span>}
              {entry.occasion && (
                <span className="tb-occasion">
                  {entry.speaker ? ' · ' : ''}
                  {entry.occasion}
                </span>
              )}
            </p>
          )}
          {digest && <p className="tb-insight-digest">{digest}</p>}
          <span className="tb-step-more">看全文 →</span>
        </>
      ) : (
        <>
          <div className="tb-compact-top">
            <span className="tb-year mono">{year}</span>
            <TypeBadge type={entry.type} />
          </div>
          <h4 className="tb-step-title">{entry.title}</h4>
          <p className="tb-step-summary">{entry.summary}</p>
        </>
      )}
    </article>
  );
}

/** 思想看板：4 条链并排（平板 2 列 / 手机单列），步骤之间用角色色箭头连接 */
export function ThoughtBoard({ chains, selectedId, onSelect }: ThoughtBoardProps): JSX.Element {
  if (chains.length === 0) {
    return (
      <div className="tb-empty" role="status">
        <p className="tb-empty-title">暂无内容</p>
        <p className="tb-empty-desc">思想链尚未配置，或数据尚未生成。</p>
      </div>
    );
  }

  return (
    <div className="tb-board">
      {chains.map((chain, chainIndex) => {
        const context = chain.context.slice(0, MAX_CONTEXT);
        const titleId = `tb-chain-title-${chain.id}`;
        return (
          <section
            key={chain.id}
            className={`tb-chain tb-chain-${chainIndex % 4}`}
            aria-labelledby={titleId}
            data-chain-id={chain.id}
          >
            <header className="tb-chain-head">
              <div className="tb-chain-kicker">
                <span className="tb-chain-no mono">{String(chainIndex + 1).padStart(2, '0')}</span>
                <span>思想链</span>
                <span className="tb-chain-steps mono">{chain.steps.length} 步</span>
                {chain.extraCount > 0 && (
                  <span className="tb-chain-extra" title="按 thought_chain 自动追加的新条目">
                    +{chain.extraCount} 新
                  </span>
                )}
              </div>
              <h2 className="tb-chain-title" id={titleId}>
                {chain.title}
              </h2>
              <p className="tb-chain-q">{chain.question}</p>
              <p className="tb-chain-desc">{chain.description}</p>
            </header>

            <div className="tb-steps">
              {chain.steps.length === 0 && <p className="tb-chain-empty">暂无内容</p>}
              {chain.steps.map((step, stepIndex) => (
                <Fragment key={step.entry.id}>
                  {stepIndex > 0 && (
                    <div className={`tb-link tb-role-${step.role}`} aria-hidden="true">
                      <span className="tb-link-arrow">↓</span>
                      <span className="tb-link-label">{step.arrow}</span>
                    </div>
                  )}
                  <StepCard step={step} selected={selectedId === step.entry.id} onSelect={onSelect} />
                </Fragment>
              ))}
            </div>

            {context.length > 0 && (
              <footer className="tb-chain-context">
                <span className="tb-context-label">相关实践</span>
                <ul className="tb-context-list">
                  {context.map((entry) => (
                    <li key={entry.id}>
                      <button
                        type="button"
                        className="tb-context-chip"
                        title={`${entry.title} · ${entry.date}`}
                        onClick={() => onSelect(entry)}
                      >
                        {entry.title}
                      </button>
                    </li>
                  ))}
                </ul>
              </footer>
            )}
          </section>
        );
      })}
    </div>
  );
}
