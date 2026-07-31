import { describe, expect, it } from 'vitest';
import {
  hasServiceTariffErrors,
  toServiceTariffPayload,
  validateServiceTariffs,
} from './serviceTariffs';

describe('serviceTariffs', () => {
  it('validates dimensional prices and duplicate dimensions', () => {
    const errors = validateServiceTariffs([
      {
        localId: 'one',
        anchoHastaCm: 10,
        altoHastaCm: 10,
        precioUnitario: 5000,
      },
      {
        localId: 'two',
        anchoHastaCm: 10,
        altoHastaCm: 10,
        precioUnitario: 8000,
      },
    ], true);

    expect(hasServiceTariffErrors(errors)).toBe(true);
    expect(errors.one.general).toMatch(/ya existe/i);
    expect(errors.two.general).toMatch(/ya existe/i);
  });

  it('allows only one general tariff', () => {
    const errors = validateServiceTariffs([
      { localId: 'one', precioUnitario: 7000 },
      { localId: 'two', precioUnitario: 9000 },
    ], false);

    expect(errors.one.general).toMatch(/solo puede/i);
    expect(errors.two.general).toMatch(/solo puede/i);
  });

  it('builds a general price without 0x0 dimensions', () => {
    expect(toServiceTariffPayload({
      precioUnitario: '7.000'.replace('.', ''),
      estado: true,
    }, 2, false)).toEqual({
      idTecnica: 2,
      anchoHastaCm: null,
      altoHastaCm: null,
      esGeneral: true,
      precioUnitario: 7000,
      estado: true,
    });
  });
});
