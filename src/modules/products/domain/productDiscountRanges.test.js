import { describe, expect, it } from 'vitest';
import {
  hasDiscountRangeErrors,
  normalizeDiscountRanges,
  toDiscountRangePayload,
  validateDiscountRanges,
} from './productDiscountRanges';

describe('productDiscountRanges', () => {
  it('normalizes legacy fields and orders by minimum quantity', () => {
    const ranges = normalizeDiscountRanges([
      { cantidadMin: 10, descuentoPorcentaje: '8', estado: true },
      { cantidadMinima: 1, porcentaje: 0, estado: true },
    ]);

    expect(ranges.map((range) => [range.cantidadMinima, range.porcentaje])).toEqual([
      [1, 0],
      [10, '8'],
    ]);
  });

  it('blocks duplicate quantities and invalid percentages', () => {
    const errors = validateDiscountRanges([
      { cantidadMinima: 10, porcentaje: 8 },
      { cantidadMinima: 10, porcentaje: 101 },
    ]);

    expect(hasDiscountRangeErrors(errors)).toBe(true);
    expect(errors[0].cantidadMinima).toMatch(/repetida/i);
    expect(errors[1].cantidadMinima).toMatch(/repetida/i);
    expect(errors[1].porcentaje).toMatch(/entre 0 y 100/i);
  });

  it('builds the new backend contract without legacy names', () => {
    expect(toDiscountRangePayload([
      { cantidadMinima: '12', porcentaje: '7,14', estado: true },
    ])).toEqual([
      { cantidadMinima: 12, porcentaje: 7.14, estado: true },
    ]);
  });
});
