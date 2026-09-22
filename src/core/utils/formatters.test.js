import { describe, expect, it } from 'vitest';
import {
  formatCurrency,
  formatDateTime,
  formatMoneyCOP,
  formatPercentage,
  formatShortDate,
  getQuoteDiscountTotal,
  getQuoteSubtotalBruto,
  getQuoteSubtotalWithDiscount,
  getQuoteTotal,
  toNumberOrNull,
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

  it('formats valid currency, percentages and dates', () => {
    expect(formatCurrency('1250')).toMatch(/1[.,]250/);
    expect(formatPercentage('12,5')).toContain('12,5');
    expect(formatShortDate('2026-09-21')).not.toBe('Por definir');
    expect(formatDateTime('2026-09-21T12:30:00Z')).not.toBe('Por definir');
  });

  it('normalizes quote totals and protects against negative subtotals', () => {
    expect(toNumberOrNull('12,5')).toBe(12.5);
    expect(toNumberOrNull('invalid')).toBeNull();
    expect(getQuoteSubtotalBruto({ subtotal: '100' })).toBe(100);
    expect(getQuoteDiscountTotal({ descuentoAplicado: 20 })).toBe(20);
    expect(getQuoteSubtotalWithDiscount({ subtotalBruto: 100, descuentoTotal: 20 })).toBe(80);
    expect(getQuoteSubtotalWithDiscount({ subtotalBruto: 10, descuentoTotal: 20 })).toBe(0);
    expect(getQuoteSubtotalWithDiscount({ totalConDescuento: 70 })).toBe(70);
    expect(getQuoteTotal({ subtotal: 100, descuentoAplicado: 20, costosAdicionales: 5 })).toBe(85);
    expect(getQuoteTotal({ total: 90 })).toBe(90);
  });
});
