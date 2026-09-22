import { describe, expect, it } from 'vitest';
import { createDetallePedido, createPedido } from './pedidoModel';

describe('pedidoModel', () => {
  it('normalizes numeric totals, optional values and collection fallbacks', () => {
    const pedido = createPedido({
      idPedido: 1,
      total: '12000',
      subtotal: '10,5',
      subtotalBruto: '',
      subtotalConDescuento: 'invalid',
      subtotalFinal: 9,
      descuentoTotal: undefined,
      costosAdicionales: '2',
      costoDiseno: null,
      totalPagado: '3',
      totalPagadoConfirmado: '4',
      saldoPendiente: '5',
      puedeSolicitarSaldoFinal: 1,
      puedeFinalizar: true,
      totalDisenosRequeridos: '2',
      totalDisenosAprobados: null,
      totalDisenosPendientes: '1',
      disenos: null,
      requerimientosDiseno: { id: 1 },
    });

    expect(pedido).toMatchObject({
      total: 12000,
      subtotal: 10.5,
      subtotalBruto: null,
      subtotalConDescuento: null,
      subtotalFinal: 9,
      descuentoTotal: null,
      costosAdicionales: 2,
      costoDiseno: null,
      totalPagado: 3,
      totalPagadoConfirmado: 4,
      saldoPendiente: 5,
      puedeSolicitarSaldoFinal: false,
      puedeFinalizar: true,
      totalDisenosRequeridos: 2,
      totalDisenosAprobados: 0,
      totalDisenosPendientes: 1,
      disenos: [],
      requerimientosDiseno: [],
    });
  });

  it('normalizes detail values and preserves explicit design decisions', () => {
    expect(createDetallePedido({
      cantidad: '2',
      precioBase: '4,5',
      descuentoPorcentaje: 'bad',
      descuentoValorUnitario: '',
      descuentoTotal: '1',
      costoDiseno: 3,
      precioUnitario: '8',
      subtotal: '16',
      subtotalBruto: '20',
      subtotalConDescuento: '17',
      subtotalFinal: '16',
      requiereDiseno: false,
      origenDiseno: '',
      archivoDisenoInicialUrl: null,
      esDisenoGeneral: 1,
      cubiertoPorDiseno: 1,
      disenos: { idDiseno: 7 },
    })).toMatchObject({
      cantidad: 2,
      precioBase: 4.5,
      descuentoPorcentaje: null,
      descuentoValorUnitario: null,
      descuentoTotal: 1,
      costoDiseno: 3,
      precioUnitario: 8,
      subtotal: 16,
      subtotalBruto: 20,
      subtotalConDescuento: 17,
      subtotalFinal: 16,
      requiereDiseno: false,
      origenDiseno: 'PIXEL',
      archivoDisenoInicialUrl: '',
      esDisenoGeneral: true,
      cubiertoPorDiseno: true,
      disenos: [{ idDiseno: 7 }],
    });

    expect(createDetallePedido({ disenos: null }).disenos).toEqual([]);
    expect(createDetallePedido({ disenos: [{ idDiseno: 8 }] }).disenos).toEqual([{ idDiseno: 8 }]);
  });
});
