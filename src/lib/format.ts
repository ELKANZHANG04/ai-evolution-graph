import type { Entry } from './types';

/** 2022-11-30 → 2022.11.30（时间轴/卡片用） */
export function formatDate(date: string): string {
  return date ? date.replaceAll('-', '.') : '—';
}

/** 2022-11-30 → 2022 年 11 月 30 日（详情抽屉用） */
export function formatDateLong(date: string): string {
  if (!date) return '—';
  const [y, m, d] = date.split('-');
  return `${y} 年 ${Number(m)} 月 ${Number(d)} 日`;
}

export function formatDateISO(date: string): string {
  return date || '—';
}

/** 站点域名（来源列表展示用） */
export function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

/** 一键复制为引用文本：标题（English Title, YYYY-MM-DD）. 摘要. 来源 */
export function buildCitation(entry: Entry): string {
  const parts = [`${entry.title}（${entry.title_en}, ${entry.date}）. ${entry.summary}`];
  if (entry.sources.length > 0) parts.push(`来源：${entry.sources.join(' ; ')}`);
  return parts.join(' ');
}

/** 最近 N 天内新增（added_at 优先，其次 date） */
export function isRecent(entry: Entry, days = 7, now: Date = new Date()): boolean {
  const stamp = entry.added_at ?? entry.date;
  if (!stamp) return false;
  const t = Date.parse(`${stamp}T00:00:00Z`);
  if (Number.isNaN(t)) return false;
  const diff = now.getTime() - t;
  return diff >= 0 && diff <= days * 24 * 60 * 60 * 1000;
}


/** 两个 YYYY-MM-DD 之间相差的天数（later - earlier，UTC 对齐）；无效日期返回 null */
export function daysBetweenISO(earlier: string, later: string): number | null {
  if (!earlier || !later) return null;
  const a = Date.parse(`${earlier}T00:00:00Z`);
  const b = Date.parse(`${later}T00:00:00Z`);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  return Math.round((b - a) / (24 * 60 * 60 * 1000));
}

/** 事件发生到入库间隔的天数；没有 added_at 或日期非法返回 null */
export function lateReportDays(entry: Pick<Entry, 'date' | 'added_at'>): number | null {
  if (!entry.added_at) return null;
  return daysBetweenISO(entry.date, entry.added_at);
}

/** 是否属于「延迟报道」：事件发生 2 天及以上才入库（用于 NEW 标签） */
export function isLateReport(entry: Pick<Entry, 'date' | 'added_at'>, threshold = 2): boolean {
  const days = lateReportDays(entry);
  return days !== null && days >= threshold;
}

export function todayISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatBuiltAt(iso: string): string {
  if (!iso) return '未知';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
