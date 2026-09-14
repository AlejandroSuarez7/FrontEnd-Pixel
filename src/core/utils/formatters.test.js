import { describe, expect, it } from 'vitest';
import {
  formatCurrency,
  formatDateTime,
  formatMoneyCOP,
  formatPercentage,
  formatShortDate,
} from './formatters';

describe('formatters', () => {
  it('never exposes invalid dates', () => {
    expect(formatShortDate('not-a-date')).toBe('Por definir');
    expect(formatDateTime('not-a-date')).toBe('Por definir');
    expect(formatShortDate(null)).toBe('Por definir');
  });

  it('uses explicit fallbacks for absent or invalid amounts', () => {
    expect(formatCurrency(undefined)).toBe('Pendiente de revision');
    expect(formatMoneyCOP('invalid', 'No especificado')).toBe('No especificado');
    expect(formatPercentage('invalid')).toBe('No especificado');
  });

  it('keeps real zero values as valid amounts', () => {
    expect(formatMoneyCOP(0)).toMatch(/0/);
    expect(formatPercentage(0)).toBe('0%');
  });
});
