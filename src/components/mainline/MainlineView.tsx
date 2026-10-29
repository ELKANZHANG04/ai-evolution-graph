import { useCallback, useMemo, useState } from 'react';
import type { CSSProperties, JSX } from 'react';
import { CategoryChips, ImportanceBadge, TypeBadge } from '../common/Badges';
import { EmptyState } from '../common/EmptyState';
import type { MainlineChapterData } from '../../lib/mainline';
import type { Entry, RelationType } from '../../lib/types';
import { categoryColor, primaryCategory } from '../../theme/categories';
import './mainline.css';

export interface MainlineViewProps {
  chapters: MainlineChapterData[];
  selectedId: string | null;
  breakthroughOnly: boolean;
  onSelect: (entry: Entry) => void;
  /** 打开本章全部事件（页面级路由/视图） */
  onOpenChapter: (chapterId: string) => void;
}

/** 突破点：importance ≥ 9（10 分再加强一档） */
const BREAKTHROUGH_THRESHOLD = 9;
const LANDMARK_SCORE = 10;
/** 背景事件最多展示的刻度数，超出显示 +N */
const MAX_BACKGROUND_MARKS = 48;
const HINT_TITLE_MAX = 14;

const FORWARD_RELATIONS: RelationType[] = ['奠基', '人才流动'];

function shortTitle(title: string): string {
  const chars = [...title];
  return chars.length > HINT_TITLE_MAX ? `${chars.slice(0, HINT_TITLE_MAX).join('')}…` : title;
}

/** 主线内的关系提示：← 表示被目标条目影响，→ 表示影响目标条目，↔ 表示竞争 */
function buildRelationHint(entry: Entry, mainlineById: Map<string, Entry>): string | null {
  for (const relation of entry.relations) {
    const target = mainlineById.get(relation.to);
    if (!target) continue;
    const arrow = relation.type === '竞争' ? '↔' : FORWARD_RELATIONS.includes(relation.type) ? '→' : '←';
    return `${arrow} ${relation.type} ${shortTitle(target.title)}`;
  }
  return null;
}

function formatYearRange(start: string, end: string): string {
  const from = start.slice(0, 4);
  const to = end.slice(0, 4);
  return from === to ? from : `${from}–${to}`;
}

function formatMonth(date: string): string {
  return date.slice(0, 7).replace('-', '.');
}

function pickMarks(entries: Entry[]): { shown: Entry[]; hidden: number } {
  if (entries.length <= MAX_BACKGROUND_MARKS) return { shown: entries, hidden: 0 };
  const shown: Entry[] = [];
  const lastIndex = entries.length - 1;
  for (let index = 0; index < MAX_BACKGROUND_MARKS; index += 1) {
    const sourceIndex = Math.round((index * lastIndex) / (MAX_BACKGROUND_MARKS - 1));
    shown.push(entries[sourceIndex]);
  }
  return { shown, hidden: entries.length - shown.length };
}

function backgroundMarkHeight(importance: number): number {
  const clamped = Math.min(10, Math.max(1, importance));
  return 12 + ((clamped - 1) / 9) * 12;
}

interface MilestoneCardProps {
  entry: Entry;
  selected: boolean;
  hint: string | null;
  onSelect: (entry: Entry) => void;
}

function MilestoneCard({ entry, selected, hint, onSelect }: MilestoneCardProps): JSX.Element {
  const breakthrough = entry.importance >= BREAKTHROUGH_THRESHOLD;
  const landmark = entry.importance >= LANDMARK_SCORE;
  const year = entry.date.slice(0, 4);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar') {
      event.preventDefault();
      onSelect(entry);
    }
  };

  return (
    <article
      className={`ml-card${breakthrough ? ' is-breakthrough' : ''}${landmark ? ' is-landmark' : ''}${
        selected ? ' is-selected' : ''
      }`}
      role="button"
      tabIndex={0}
      aria-label={`${entry.title}，${entry.date}，影响力 ${entry.importance}/10${breakthrough ? '，突破点' : ''}`}
      onClick={() => onSelect(entry)}
      onKeyDown={handleKeyDown}
    >
      {breakthrough && <span className="ml-break-flag">突破</span>}
      <div className="ml-card-top">
        <span className="ml-card-year mono">{year}</span>
        <TypeBadge type={entry.type} />
        <ImportanceBadge value={entry.importance} />
      </div>
      <h3 className="ml-card-title">{entry.title}</h3>
      <p className="ml-card-significance">{entry.significance}</p>
      <div className="ml-card-foot">
        <CategoryChips categories={entry.categories} max={2} />
        {hint && <span className="ml-card-hint">{hint}</span>}
      </div>
    </article>
  );
}

interface BackgroundBlockProps {
  chapterId: string;
  entries: Entry[];
  expanded: boolean;
  onToggle: () => void;
  onSelect: (entry: Entry) => void;
}

/** 背景事件区：极简刻度 + 可展开的标题列表（默认收起，保持低调）。 */
function BackgroundBlock({
  chapterId,
  entries,
  expanded,
  onToggle,
  onSelect,
}: BackgroundBlockProps): JSX.Element | null {
  if (entries.length === 0) return null;
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
  const { shown, hidden } = pickMarks(sorted);
  const listId = `ml-bg-list-${chapterId}`;

  return (
    <div className={`ml-background${expanded ? ' is-expanded' : ''}`}>
      <div className="ml-background-row">
        <button
          type="button"
          className="ml-background-toggle"
          aria-expanded={expanded}
          aria-controls={listId}
          onClick={onToggle}
        >
          另有 <span className="mono">{entries.length}</span> 条背景事件 · {expanded ? '收起标题' : '展开标题'}
          <span className="ml-background-caret" aria-hidden="true">
            {expanded ? '▴' : '▾'}
          </span>
        </button>
        <span className="ml-marks">
          {shown.map((entry) => {
            const style = {
              height: `${backgroundMarkHeight(entry.importance)}px`,
              '--ml-mark-color': categoryColor(primaryCategory(entry.categories)),
            } as CSSProperties;
            return (
              <button
                key={entry.id}
                type="button"
                className="ml-mark"
                style={style}
                title={`${formatMonth(entry.date)} · ${entry.title}`}
                aria-label={`背景事件：${entry.title}（${formatMonth(entry.date)}）`}
                onClick={() => onSelect(entry)}
              />
            );
          })}
          {hidden > 0 && <span className="ml-mark-more mono">+{hidden}</span>}
        </span>
      </div>

      {expanded && (
        <ul className="ml-background-list" id={listId}>
          {sorted.map((entry) => (
            <li key={entry.id}>
              <button
                type="button"
                className="ml-background-item"
                title={`${formatMonth(entry.date)} · ${entry.title}`}
                aria-label={`背景事件：${entry.title}（${formatMonth(entry.date)}）`}
                onClick={() => onSelect(entry)}
              >
                <span
                  className="ml-background-dot"
                  style={{ background: categoryColor(primaryCategory(entry.categories)) }}
                  aria-hidden="true"
                />
                <span className="ml-background-year mono">{entry.date.slice(0, 4)}</span>
                <span className="ml-background-sep" aria-hidden="true">
                  ·
                </span>
                <span className="ml-background-title">{entry.title}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

interface ChapterSectionProps {
  chapter: MainlineChapterData;
  index: number;
  isLast: boolean;
  selectedId: string | null;
  breakthroughOnly: boolean;
  backgroundExpanded: boolean;
  hints: Map<string, string>;
  onSelect: (entry: Entry) => void;
  onToggleBackground: () => void;
  onOpenChapter: (chapterId: string) => void;
}

function ChapterSection({
  chapter,
  index,
  isLast,
  selectedId,
  breakthroughOnly,
  backgroundExpanded,
  hints,
  onSelect,
  onToggleBackground,
  onOpenChapter,
}: ChapterSectionProps): JSX.Element {
  const chapterNumber = String(index + 1).padStart(2, '0');
  const totalEvents = chapter.entries.length + chapter.background.length;
  const cards = breakthroughOnly
    ? chapter.entries.filter((entry) => entry.importance >= BREAKTHROUGH_THRESHOLD)
    : chapter.entries;
  const backgroundCount = chapter.background.length;
  const hasCards = cards.length > 0;

  let emptyLine: string | null = null;
  if (!hasCards) {
    if (breakthroughOnly && chapter.entries.length > 0) {
      emptyLine = `本章无突破点 · ${backgroundCount} 条背景事件`;
    } else if (chapter.entries.length === 0) {
      emptyLine = backgroundCount > 0 ? `本章暂无里程碑 · ${backgroundCount} 条背景事件` : '本章暂无内容';
    }
  }

  return (
    <section className="ml-chapter" aria-labelledby={`ml-chapter-${chapter.id}`}>
      <header className="ml-chapter-head">
        <span className="ml-chapter-index mono" aria-hidden="true">
          {chapterNumber}
        </span>
        <div className="ml-chapter-heading">
          <h2 className="ml-chapter-title" id={`ml-chapter-${chapter.id}`}>
            {chapter.title}
          </h2>
          <p className="ml-chapter-en">{chapter.en}</p>
        </div>
        <div className="ml-chapter-side">
          <span className="ml-chapter-years mono" aria-label={`${chapter.dateStart} 至 ${chapter.dateEnd}`}>
            {formatYearRange(chapter.dateStart, chapter.dateEnd)}
          </span>
          <button
            type="button"
            className="ml-chapter-open"
            onClick={() => onOpenChapter(chapter.id)}
            title={`查看“${chapter.title}”本章全部事件`}
          >
            查看本章全部 <span className="mono">{totalEvents}</span> 条事件 →
          </button>
        </div>
      </header>
      <p className="ml-chapter-desc">{chapter.description}</p>

      {hasCards ? (
        <div className="ml-cards">
          {cards.map((entry) => (
            <MilestoneCard
              key={entry.id}
              entry={entry}
              selected={selectedId === entry.id}
              hint={hints.get(entry.id) ?? null}
              onSelect={onSelect}
            />
          ))}
        </div>
      ) : (
        emptyLine && <p className="ml-empty-line">{emptyLine}</p>
      )}

      <BackgroundBlock
        chapterId={chapter.id}
        entries={chapter.background}
        expanded={backgroundExpanded}
        onToggle={onToggleBackground}
        onSelect={onSelect}
      />

      {!isLast && (
        <div className="ml-next" aria-hidden="true">
          <span className="ml-next-line" />
          <span className="ml-next-arrow">↓</span>
          <span className="ml-next-label">下一阶段</span>
        </div>
      )}
    </section>
  );
}

/**
 * 主线视图：5 章纵向叙事，24 个里程碑大卡片；突破点金色高亮，其余事件压缩为章节底部背景刻度。
 * 数据由 buildMainlineChapters 分组（src/lib/mainline.ts），本组件只负责呈现与交互。
 */
export function MainlineView({
  chapters,
  selectedId,
  breakthroughOnly,
  onSelect,
  onOpenChapter,
}: MainlineViewProps): JSX.Element {
  const [expandedBackground, setExpandedBackground] = useState<Set<string>>(() => new Set<string>());

  const toggleBackground = useCallback((chapterId: string) => {
    setExpandedBackground((previous) => {
      const next = new Set(previous);
      if (next.has(chapterId)) next.delete(chapterId);
      else next.add(chapterId);
      return next;
    });
  }, []);

  const mainlineById = useMemo(() => {
    const map = new Map<string, Entry>();
    for (const chapter of chapters) {
      for (const entry of chapter.entries) map.set(entry.id, entry);
    }
    return map;
  }, [chapters]);

  const hints = useMemo(() => {
    const map = new Map<string, string>();
    for (const chapter of chapters) {
      for (const entry of chapter.entries) {
        const hint = buildRelationHint(entry, mainlineById);
        if (hint) map.set(entry.id, hint);
      }
    }
    return map;
  }, [chapters, mainlineById]);

  if (chapters.length === 0 || mainlineById.size === 0) {
    return (
      <div className="ml-root">
        <div className="ml-empty">
          <EmptyState title="主线内容准备中" description="里程碑数据整理完成后，会按 5 个章节出现在这里。" />
        </div>
      </div>
    );
  }

  return (
    <div className="ml-root">
      {chapters.map((chapter, index) => (
        <ChapterSection
          key={chapter.id}
          chapter={chapter}
          index={index}
          isLast={index === chapters.length - 1}
          selectedId={selectedId}
          breakthroughOnly={breakthroughOnly}
          backgroundExpanded={expandedBackground.has(chapter.id)}
          hints={hints}
          onSelect={onSelect}
          onToggleBackground={() => toggleBackground(chapter.id)}
          onOpenChapter={onOpenChapter}
        />
      ))}
    </div>
  );
}
