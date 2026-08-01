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
        nombre: 'Punto corazón',
        anchoHastaCm: 10,
        altoHastaCm: 10,
        precioUnitario: 5000,
      },
      {
        localId: 'two',
        nombre: 'Carta',
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
      { localId: 'one', nombre: 'Tarifa general', precioUnitario: 7000 },
      { localId: 'two', nombre: 'Tarifa general', precioUnitario: 9000 },
    ], false);

    expect(errors.one.general).toMatch(/solo puede/i);
    expect(errors.two.general).toMatch(/solo puede/i);
  });

  it('builds a general price without 0x0 dimensions', () => {
    expect(toServiceTariffPayload({
      nombre: 'Tarifa general',
      precioUnitario: '7.000'.replace('.', ''),
      estado: true,
    }, 2, false)).toEqual({
      idTecnica: 2,
      nombre: 'Tarifa general',
      anchoHastaCm: null,
      altoHastaCm: null,
      esGeneral: true,
      precioUnitario: 7000,
      estado: true,
    });
  });

  it('requires a non-blank name with at most 100 characters', () => {
    const blank = validateServiceTariffs([{
      localId: 'blank', nombre: '   ', anchoHastaCm: 10, altoHastaCm: 10, precioUnitario: 5000,
    }], true);
    const long = validateServiceTariffs([{
      localId: 'long', nombre: 'x'.repeat(101), anchoHastaCm: 20, altoHastaCm: 20, precioUnitario: 6000,
    }], true);

    expect(blank.blank.nombre).toMatch(/obligatorio/i);
    expect(long.long.nombre).toMatch(/100 caracteres/i);
  });
});
