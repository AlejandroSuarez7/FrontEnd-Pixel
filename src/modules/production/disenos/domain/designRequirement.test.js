import { describe, expect, it } from 'vitest';
import {
  buildDesignTargetPayload,
  formatDesignRequirementLabel,
  normalizeDesignRequirementsResponse,
} from './designRequirement';

const base = {
  idRequerimientoDiseno: 'STAMP-34',
  tipo: 'ESTAMPADO',
  idPedido: 54,
  idDetallePedido: 20,
  idEstampadoPedido: 34,
  producto: { nombre: 'Camiseta' },
  origenDiseno: 'PIXEL',
  puedeCrearDiseno: true,
};

const form = {
  idDisenador: '3',
  descripcion: ' Frontal ',
  observaciones: '',
};

describe('design requirement contract', () => {
  it('normalizes response.data.data without losing backend action flags', () => {
    const result = normalizeDesignRequirementsResponse({
      data: {
        data: {
          requerimientos: [base],
          resumen: { totalDisenosRequeridos: 1 },
        },
      },
    });

    expect(result.requerimientos[0]).toMatchObject({
      idRequerimientoDiseno: 'STAMP-34',
      puedeCrearDiseno: true,
      idEstampadoPedido: 34,
    });
    expect(result.resumen.totalDisenosRequeridos).toBe(1);
  });

  it.each([
    ['ESTAMPADO', base, {
      idPedido: 54,
      tipoObjetivo: 'ESTAMPADO',
      idDetallePedido: 20,
      idEstampadoPedido: 34,
    }],
    ['GRUPO_COMPARTIDO', {
      ...base,
      tipo: 'GRUPO_COMPARTIDO',
      grupoDisenoCompartido: 'LOGO-1',
    }, {
      idPedido: 54,
      tipoObjetivo: 'GRUPO_COMPARTIDO',
      grupoDisenoCompartido: 'LOGO-1',
    }],
    ['PRODUCTO_GENERAL', {
      ...base,
      tipo: 'PRODUCTO_GENERAL',
    }, {
      idPedido: 54,
      tipoObjetivo: 'PRODUCTO_GENERAL',
      idDetallePedido: 20,
      esDisenoGeneral: true,
    }],
    ['PEDIDO_GENERAL', {
      ...base,
      tipo: 'PEDIDO_GENERAL',
    }, {
      idPedido: 54,
      tipoObjetivo: 'PEDIDO_GENERAL',
      esDisenoGeneral: true,
    }],
    ['LEGACY_PRODUCTO', {
      ...base,
      tipo: 'LEGACY_PRODUCTO',
    }, {
      idPedido: 54,
      tipoObjetivo: 'LEGACY_PRODUCTO',
      idDetallePedido: 20,
    }],
  ])('builds an unambiguous %s payload', (_type, requirement, target) => {
    const payload = buildDesignTargetPayload(requirement, form);

    expect(payload).toMatchObject({
      ...target,
      idDisenador: 3,
      descripcion: 'Frontal',
      observaciones: null,
    });
    expect(payload).not.toHaveProperty('idRequerimientoDiseno');
    expect(payload).not.toHaveProperty('idDetalleEstampadoPedido');
    expect(payload).not.toHaveProperty('archivoUrl');

    const targetKeys = [
      'idDetallePedido',
      'idEstampadoPedido',
      'grupoDisenoCompartido',
    ].filter(key => payload[key] !== undefined);
    if (requirement.tipo === 'ESTAMPADO') expect(targetKeys).toEqual(['idDetallePedido', 'idEstampadoPedido']);
    if (requirement.tipo === 'GRUPO_COMPARTIDO') expect(targetKeys).toEqual(['grupoDisenoCompartido']);
    if (requirement.tipo === 'PEDIDO_GENERAL') expect(targetKeys).toEqual([]);
  });

  it('renders a human stamp label without exposing the stable technical id', () => {
    const label = formatDesignRequirementLabel({
      ...base,
      ubicacion: 'Frente',
      tecnica: { nombre: 'DTF' },
      anchoCm: 10,
      altoCm: 12,
    });

    expect(label).toBe('Camiseta - Frente - DTF - 10 x 12 cm');
    expect(label).not.toContain('STAMP-34');
  });
});
