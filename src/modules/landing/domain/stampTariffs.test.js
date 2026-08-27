import { describe, expect, it } from 'vitest';
import { getStampSizeSummary, reconcileStampTariff } from './stampTariffs';

const tariffs = [
  { idTarifaTecnica: 1, nombre: 'Punto corazón', anchoHastaCm: 10, altoHastaCm: 10, esGeneral: false },
  { idTarifaTecnica: 2, nombre: 'Carta', anchoHastaCm: 22, altoHastaCm: 28, esGeneral: false },
];

describe('stampTariffs', () => {
  it('restores a tariff by id and assigns its dimensions', () => {
    expect(reconcileStampTariff({ idTarifaTecnica: 1 }, tariffs)).toMatchObject({
      idTarifaTecnica: 1,
      nombreTarifa: 'Punto corazón',
      anchoCm: 10,
      altoCm: 10,
    });
  });

  it('matches historical dimensions without deleting custom measures', () => {
    expect(reconcileStampTariff({ anchoCm: 22, altoCm: 28 }, tariffs).idTarifaTecnica).toBe(2);
    expect(reconcileStampTariff({ anchoCm: 10, altoCm: 12 }, tariffs)).toMatchObject({
      idTarifaTecnica: null,
      nombreTarifa: 'Medida personalizada: 10 × 12 cm',
      anchoCm: 10,
      altoCm: 12,
    });
  });

  it('auto-selects the only general tariff without dimensions', () => {
    expect(reconcileStampTariff({}, [{
      idTarifaTecnica: 4, nombre: 'Tarifa general', esGeneral: true,
    }])).toMatchObject({
      idTarifaTecnica: 4,
      anchoCm: null,
      altoCm: null,
      tarifaEsGeneral: true,
    });
  });

  it('formats named, general, pending and historical summaries safely', () => {
    expect(getStampSizeSummary({ idTarifaTecnica: 1, nombreTarifa: 'Punto corazón', anchoCm: 10, altoCm: 10 }))
      .toBe('Punto corazón · 10 × 10 cm');
    expect(getStampSizeSummary({ tarifaEsGeneral: true })).toBe('Tarifa general');
    expect(getStampSizeSummary({})).toBe('Tamaño por definir');
    expect(getStampSizeSummary({ anchoCm: 10, altoCm: 12 })).toBe('Medida personalizada: 10 × 12 cm');
  });
});
