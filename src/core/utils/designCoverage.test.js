import { describe, expect, it } from 'vitest';
import {
  canCreateDesignForDetail,
  canRegisterDesignClientResponse,
  getDesignCoverageInfo,
} from './designCoverage';

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

  it('allows initial creation and a corrected version after rejection', () => {
    expect(canCreateDesignForDetail({
      estadoCoberturaDiseno: 'PENDIENTE_CREACION_PIXEL',
    })).toBe(true);
    expect(canCreateDesignForDetail({
      estadoCoberturaDiseno: 'DISENO_ENTREGADO_POR_CLIENTE',
      diseno: { estado: 'ENVIADO', origenDiseno: 'CLIENTE' },
    })).toBe(false);
    expect(canCreateDesignForDetail({
      estadoCoberturaDiseno: 'DISENO_RECHAZADO',
      diseno: { estado: 'RECHAZADO' },
    })).toBe(true);
    expect(canCreateDesignForDetail({
      estadoCoberturaDiseno: 'CORRECCIONES_SOLICITADAS',
      diseno: { estado: 'RECHAZADO' },
    })).toBe(true);
    expect(canCreateDesignForDetail({
      estadoCoberturaDiseno: 'DISENO_APROBADO',
      diseno: { estado: 'APROBADO' },
    })).toBe(false);
  });

  it('marks only pending client files as registerable', () => {
    expect(getDesignCoverageInfo({
      estadoCoberturaDiseno: 'PENDIENTE_ARCHIVO_CLIENTE',
      origenDiseno: 'CLIENTE',
    }).canRegisterClientFile).toBe(true);
    expect(getDesignCoverageInfo({
      estadoCoberturaDiseno: 'DISENO_CLIENTE_PENDIENTE_VINCULACION',
      origenDiseno: 'CLIENTE',
      archivoDisenoInicialUrl: 'https://example.com/diseno-cliente.png',
    })).toMatchObject({
      canRegisterClientFile: true,
      label: 'Diseno del cliente pendiente de registro',
      message: 'El cliente entrego un archivo. Registralo para revisarlo en Gestion de Disenos.',
    });
    expect(getDesignCoverageInfo({
      estadoCoberturaDiseno: 'DISENO_ENTREGADO_POR_CLIENTE',
      origenDiseno: 'CLIENTE',
      diseno: { idDiseno: 20, estado: 'ENVIADO' },
    }).canRegisterClientFile).toBe(false);
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

  it('allows a client response only while the design is pending review', () => {
    expect(canRegisterDesignClientResponse({
      idDiseno: 30,
      estado: 'ENVIADO',
    })).toBe(true);
    expect(canRegisterDesignClientResponse({
      idDiseno: 31,
      estado: 'PENDIENTE_DE_APROBACION',
    })).toBe(true);
    expect(canRegisterDesignClientResponse({
      idDiseno: 32,
      estado: 'APROBADO',
    })).toBe(false);
    expect(canRegisterDesignClientResponse({
      idDiseno: 33,
      estado: 'RECHAZADO',
    })).toBe(false);
  });
});
