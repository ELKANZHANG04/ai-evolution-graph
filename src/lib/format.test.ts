import { describe, expect, it } from 'vitest';
import { daysBetweenISO, isLateReport, lateReportDays } from './format';

describe('daysBetweenISO', () => {
  it('按 UTC 日期计算间隔', () => {
    expect(daysBetweenISO('2026-11-04', '2026-11-08')).toBe(4);
    expect(daysBetweenISO('2026-11-08', '2026-11-08')).toBe(0);
    expect(daysBetweenISO('2026-11-10', '2026-11-08')).toBe(-2);
  });

  it('非法日期返回 null', () => {
    expect(daysBetweenISO('', '2026-11-08')).toBeNull();
    expect(daysBetweenISO('2026-11-08', 'not-a-date')).toBeNull();
  });
});

describe('lateReport', () => {
  it('没有 added_at 时不判定为延迟报道', () => {
    expect(lateReportDays({ date: '2026-11-01' })).toBeNull();
    expect(isLateReport({ date: '2026-11-01' })).toBe(false);
  });

  it('事件发生 2 天及以上才入库 → NEW', () => {
    expect(lateReportDays({ date: '2026-11-06', added_at: '2026-11-08' })).toBe(2);
    expect(isLateReport({ date: '2026-11-06', added_at: '2026-11-08' })).toBe(true);
    expect(isLateReport({ date: '2026-11-04', added_at: '2026-11-08' })).toBe(true);
  });

  it('当天/隔天入库不算延迟报道', () => {
    expect(isLateReport({ date: '2026-11-07', added_at: '2026-11-08' })).toBe(false);
    expect(isLateReport({ date: '2026-11-08', added_at: '2026-11-08' })).toBe(false);
  });
});
