import { describe, expect, it } from 'vitest';
import {
  ADMIN_TRENDS_PRESETS,
  buildAdminTrendPeriod,
  formatAdminTrendAxisDate,
  formatAdminTrendTooltipDate,
  isCompleteAdminTrendPeriod,
} from './adminTrends';

const NOW = new Date('2026-08-24T15:00:00.000Z');

describe('admin dashboard trend periods', () => {
  it('builds the default 30-day range including today', () => {
    expect(buildAdminTrendPeriod(undefined, NOW)).toEqual({
      fechaInicio: '2026-07-26',
      fechaFin: '2026-08-24',
      granularidad: 'DIA',
    });
  });

  it('builds the quick ranges with the backend granularities', () => {
    expect(buildAdminTrendPeriod(ADMIN_TRENDS_PRESETS.SEVEN_DAYS, NOW)).toEqual({
      fechaInicio: '2026-08-18',
      fechaFin: '2026-08-24',
      granularidad: 'DIA',
    });
    expect(buildAdminTrendPeriod(ADMIN_TRENDS_PRESETS.CURRENT_MONTH, NOW)).toEqual({
      fechaInicio: '2026-08-01',
      fechaFin: '2026-08-24',
      granularidad: 'DIA',
    });
    expect(buildAdminTrendPeriod(ADMIN_TRENDS_PRESETS.CURRENT_YEAR, NOW)).toEqual({
      fechaInicio: '2026-01-01',
      fechaFin: '2026-08-24',
      granularidad: 'MES',
    });
  });

  it('validates complete custom periods only', () => {
    expect(isCompleteAdminTrendPeriod({
      fechaInicio: '2026-08-01',
      fechaFin: '2026-08-24',
      granularidad: 'SEMANA',
    })).toBe(true);
    expect(isCompleteAdminTrendPeriod({
      fechaInicio: '2026-08-24',
      fechaFin: '',
      granularidad: 'DIA',
    })).toBe(false);
    expect(isCompleteAdminTrendPeriod({
      fechaInicio: '2026-08-24',
      fechaFin: '2026-08-01',
      granularidad: 'DIA',
    })).toBe(false);
  });

  it('formats calendar dates without moving them to the previous day', () => {
    expect(formatAdminTrendTooltipDate('2026-08-10')).toBe('10 de agosto de 2026');
    expect(formatAdminTrendAxisDate('2026-08-10', 'DIA')).toBe('10 ago.');
    expect(formatAdminTrendAxisDate('2026-08-10', 'SEMANA')).toBe('Semana del 10 ago.');
    expect(formatAdminTrendAxisDate('2026-08-01', 'MES')).toBe('Ago. 2026');
    expect(formatAdminTrendAxisDate('2026-01-01', 'ANIO')).toBe('2026');
  });
});
