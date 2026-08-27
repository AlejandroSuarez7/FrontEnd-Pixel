import { describe, expect, it } from 'vitest';
import { formatCalendarDate, toCalendarDateInput } from './fechaFormato';

describe('formatCalendarDate', () => {
  it('preserves the calendar day from an ISO date', () => {
    expect(formatCalendarDate('2026-07-27')).toBe('27 de julio de 2026');
    expect(formatCalendarDate('2026-07-27T00:00:00.000Z')).toBe('27 de julio de 2026');
    expect(formatCalendarDate('2026-07-28')).toBe('28 de julio de 2026');
  });

  it('uses a safe fallback for missing or invalid values', () => {
    expect(formatCalendarDate(null)).toBe('Por definir');
    expect(formatCalendarDate('not-a-date', 'No identificada')).toBe('No identificada');
  });

  it('keeps the exact YYYY-MM-DD value for date inputs', () => {
    expect(toCalendarDateInput('2026-07-28')).toBe('2026-07-28');
    expect(toCalendarDateInput('2026-07-28T00:00:00.000Z')).toBe('2026-07-28');
    expect(toCalendarDateInput(null)).toBe('');
  });
});
