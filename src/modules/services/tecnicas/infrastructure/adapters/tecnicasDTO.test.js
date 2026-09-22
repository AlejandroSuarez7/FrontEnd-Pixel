import { describe, expect, it } from 'vitest';
import { createTecnicas } from '../../domain/tecnicasModel';
import { tecnicasDTO } from './tecnicasDTO';

describe('tecnicasDTO', () => {
  it('maps techniques with safe defaults', () => {
    expect(createTecnicas({ id: 1 }).requiereMedidas).toBe(true);
    expect(createTecnicas({ id: 2, requiereMedidas: false }).requiereMedidas).toBe(false);
    expect(tecnicasDTO.fromApi({ idTecnica: 1, nombre: 'DTF' })).toMatchObject({ id: 1, nombre: 'DTF', descripcion: '', estado: true, requiereMedidas: true, detalles: [] });
    expect(tecnicasDTO.fromApi({ idTecnica: 2, estado: false, requiereMedidas: false, detallesCotizacion: [1] })).toMatchObject({ estado: false, requiereMedidas: false, detalles: [1] });
  });
  it('maps lists and outbound payloads', () => {
    expect(tecnicasDTO.fromApi()).toBeNull();
    expect(tecnicasDTO.fromApiList()).toEqual([]);
    expect(tecnicasDTO.fromApiList([{ idTecnica: 1 }])).toHaveLength(1);
    expect(tecnicasDTO.toApi()).toBeNull();
    expect(tecnicasDTO.toApi({ nombre: ' DTF ', descripcion: ' X ', estado: true })).toEqual({ nombre: 'DTF', descripcion: 'X', estado: true, requiereMedidas: true });
  });
});
