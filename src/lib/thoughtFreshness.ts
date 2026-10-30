import type { ThoughtChainData } from './thoughtChains';

/**
 * 思想主题的「持续讨论」活跃度计算（纯函数，供看板与测试共用）。
 *
 * 规则（docs/PROPOSAL-M4.md §2.1 / DECISIONS §13.1）：
 * - 近 18 个月内有步骤 = 持续活跃（active），否则为待补充（stale）；
 * - 年份活动条从 2012（时间轴起点）到今年，每年一个刻度；
 * - 「新方向」来自 thought_pin === 'top' 的条目，取 thought_claim（缺省 title）并截断。
 */

/** 近 18 个月内有新步骤即视为「持续活跃」 */
export const FRESH_WINDOW_MONTHS = 18;
/** 年份活动条起点（与时间轴一致：2012 年） */
export const ACTIVITY_START_YEAR = 2012;
/** 「新方向」标题最大展示字数 */
export const NEW_DIRECTION_MAX = 24;

export type ThemeActivityStatus = 'active' | 'stale';

export interface ThemeYearBucket {
  year: number;
  /** 该年步骤数 */
  count: number;
  /** 是否属于最近两年（前端高亮） */
  recent: boolean;
}

export interface ThemeFreshness {
  /** 最新步骤日期 YYYY-MM-DD；空主题为 null */
  latestDate: string | null;
  /** 最新步骤月份 YYYY-MM；空主题为 null */
  latestMonth: string | null;
  /** 近 18 个月内的步骤数 */
  recentCount: number;
  /** 近 18 个月有更新 → active，否则 stale */
  status: ThemeActivityStatus;
  /** 2012 → 今年的年份活动条（含无讨论的年份，count = 0） */
  yearBuckets: ThemeYearBucket[];
  /** 由 thought_pin === 'top' 聚合出的新方向（简短，去重） */
  newDirections: string[];
}

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

/** Date → 本地时区 YYYY-MM-DD */
export function toLocalISODate(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

/**
 * 从 date 往前推 months 个自然月。
 * 目标月份没有相同日（如 3-31 往前 1 个月）时取该月最后一天，避免日期溢出。
 */
export function monthsBefore(date: Date, months: number): Date {
  const day = date.getDate();
  const targetFirst = new Date(date.getFullYear(), date.getMonth() - months, 1);
  const year = targetFirst.getFullYear();
  const month = targetFirst.getMonth();
  const daysInTarget = new Date(year, month + 1, 0).getDate();
  return new Date(year, month, Math.min(day, daysInTarget));
}

/** 取条目的一句话主张（缺省 title）并压成单行、截断 */
function shortDirection(chain: ThoughtChainData, index: number): string {
  const entry = chain.steps[index]?.entry;
  if (!entry) return '';
  const raw = (entry.thought_claim?.trim() || entry.title?.trim() || '').replace(/\s+/g, ' ');
  if (!raw) return '';
  return raw.length > NEW_DIRECTION_MAX ? `${raw.slice(0, NEW_DIRECTION_MAX)}…` : raw;
}

/**
 * 计算一条思想主题的活跃度信息。
 * @param chain 主题（ThoughtChainData，步骤需已按 builder 的「置顶优先 + 日期」排序）
 * @param today 参照日（测试可传固定日期；默认当前时间）
 */
export function themeFreshness(chain: ThoughtChainData, today: Date = new Date()): ThemeFreshness {
  const dates = chain.steps
    .map((step) => step.entry.date)
    .filter((date): date is string => typeof date === 'string' && ISO_DATE_RE.test(date))
    .sort();

  const latestDate = dates.length > 0 ? dates[dates.length - 1] : null;
  const cutoff = toLocalISODate(monthsBefore(today, FRESH_WINDOW_MONTHS));
  const recentCount = dates.filter((date) => date >= cutoff).length;

  const endYear = today.getFullYear();
  const countsByYear = new Map<number, number>();
  for (const date of dates) {
    const year = Number(date.slice(0, 4));
    if (year < ACTIVITY_START_YEAR || year > endYear) continue;
    countsByYear.set(year, (countsByYear.get(year) ?? 0) + 1);
  }

  const yearBuckets: ThemeYearBucket[] = [];
  for (let year = ACTIVITY_START_YEAR; year <= endYear; year += 1) {
    yearBuckets.push({
      year,
      count: countsByYear.get(year) ?? 0,
      recent: year >= endYear - 1,
    });
  }

  const newDirections: string[] = [];
  chain.steps.forEach((step, index) => {
    if (step.entry.thought_pin !== 'top') return;
    const direction = shortDirection(chain, index);
    if (direction && !newDirections.includes(direction)) newDirections.push(direction);
  });

  return {
    latestDate,
    latestMonth: latestDate ? latestDate.slice(0, 7) : null,
    recentCount,
    status: recentCount > 0 ? 'active' : 'stale',
    yearBuckets,
    newDirections,
  };
}
