import type { Entry } from './types';

/**
 * 主线动态化规则（"积累到一定数量 → 归类重要事件进主线 → 末位淘汰"）。
 * 纯函数，供 CLI（scripts/curate.ts）与页面容量提示共用。
 */
export const MAINLINE_CAP = 32;
export const PROMOTE_MIN_IMPORTANCE = 8;
/** 晋升候选的时间门槛（≈10 年，实际不限制；主线优先级由重要度决定） */
export const PROMOTE_MAX_AGE_DAYS = 3650;
/** 10 分条目永不淘汰 */
export const DEMOTE_PROTECT_IMPORTANCE = 10;

export interface CurationOptions {
  today: string;
  cap?: number;
  minImportance?: number;
  maxAgeDays?: number;
}

export interface CurationPlan {
  mainlineBefore: number;
  mainlineAfter: number;
  cap: number;
  pool: Entry[];
  promote: Entry[];
  demote: Entry[];
  remainingSlots: number;
}

function ageDays(date: string, today: string): number {
  const a = Date.parse(`${date}T00:00:00Z`);
  const b = Date.parse(`${today}T00:00:00Z`);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return Number.POSITIVE_INFINITY;
  return Math.round((b - a) / (24 * 60 * 60 * 1000));
}

export function planCuration(
  entries: readonly Entry[],
  options: CurationOptions,
): CurationPlan {
  const cap = options.cap ?? MAINLINE_CAP;
  const minImportance = options.minImportance ?? PROMOTE_MIN_IMPORTANCE;
  const maxAgeDays = options.maxAgeDays ?? PROMOTE_MAX_AGE_DAYS;

  const mainline = entries.filter((entry) => entry.mainline && entry.date >= '2012-01-01');
  const mainlineIds = new Set(mainline.map((entry) => entry.id));

  // 晋升候选：非主线、事件/产品、够重要、够新、无待核对
  const pool = entries
    .filter(
      (entry) =>
        !mainlineIds.has(entry.id) &&
        entry.type !== 'insight' &&
        entry.date >= '2012-01-01' &&
        entry.date <= options.today &&
        entry.importance >= minImportance &&
        !entry.needs_review &&
        ageDays(entry.date, options.today) <= maxAgeDays,
    )
    .sort((a, b) => b.importance - a.importance || b.date.localeCompare(a.date));

  const slots = Math.max(0, cap - mainline.length);
  const promote = pool.slice(0, slots);

  const mainlineAfterPromote = mainline.length + promote.length;
  const overflow = Math.max(0, mainlineAfterPromote - cap);
  const demote = overflow === 0
    ? []
    : [...mainline]
        .filter((entry) => entry.importance < DEMOTE_PROTECT_IMPORTANCE)
        .sort((a, b) => a.importance - b.importance || a.date.localeCompare(b.date))
        .slice(0, overflow);

  return {
    mainlineBefore: mainline.length,
    mainlineAfter: mainlineAfterPromote - demote.length,
    cap,
    pool,
    promote,
    demote,
    remainingSlots: Math.max(0, cap - mainlineAfterPromote),
  };
}

/** 供 UI 显示：主线容量与候选池大小 */
export function curationHints(
  entries: readonly Entry[],
  today: string,
): { cap: number; mainline: number; pool: number; innovation: number } {
  const plan = planCuration(entries, { today });
  const innovation = entries.filter(
    (entry) => entry.type === 'insight' && entry.innovation,
  ).length;
  return {
    cap: plan.cap,
    mainline: plan.mainlineBefore,
    pool: plan.pool.length,
    innovation,
  };
}
