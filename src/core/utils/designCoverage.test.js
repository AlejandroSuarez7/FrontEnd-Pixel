import { describe, expect, it } from 'vitest';
import { canCreateDesignForDetail, getDesignCoverageInfo } from './designCoverage';

describe('design coverage helpers', () => {
  it('prevents design creation for products that do not require it', () => {
    const info = getDesignCoverageInfo({
      requiereDiseno: false,
      estadoCoberturaDiseno: 'NO_REQUIERE_DISENO',
      cubiertoPorDiseno: true,
    });

    expect(info.label).toBe('No requiere diseno');
    expect(info.covered).toBe(true);
    expect(info.canCreate).toBe(false);
  });

  it('allows creation only when PIXEL has a pending design', () => {
    expect(canCreateDesignForDetail({
      estadoCoberturaDiseno: 'PENDIENTE_CREACION_PIXEL',
    })).toBe(true);
    expect(canCreateDesignForDetail({
      estadoCoberturaDiseno: 'DISENO_ENTREGADO_POR_CLIENTE',
      diseno: { estado: 'ENVIADO', origenDiseno: 'CLIENTE' },
    })).toBe(false);
  });

  it('recognizes approved general design coverage', () => {
    const info = getDesignCoverageInfo({
      estadoCoberturaDiseno: 'CUBIERTO_POR_DISENO_GENERAL',
      cubiertoPorDiseno: true,
      diseno: { esDisenoGeneral: true, estado: 'APROBADO' },
    });

    expect(info.covered).toBe(true);
    expect(info.isGeneral).toBe(true);
    expect(info.label).toBe('Cubierto por diseno general');
  });
});
