import { describe, expect, it } from 'vitest';
import { proposalDTO } from './proposalDTO';

describe('proposalDTO', () => {
  it('uses exactly one identifier for each design and omits UI-only calculations', () => {
    const payload = proposalDTO.toApi({
      precioFinal: '4077200',
      validaHasta: '2026-08-07T23:59:59.000Z',
      descuentoManual: '50000',
      motivoAjusteManual: 'Incluye suministro y entrega urgente.',
      items: [{
        idDetalleCotizacion: 20,
        subtotalServiciosOficial: '2880000',
        costoProducto: '400000',
        otrosCostosItem: '0',
        subtotalOficial: '3280000',
        localId: 'item-ui',
      }],
      disenos: [{
        uiKey: 'design-ui',
        grupoDisenoCompartido: 'LOGO-1',
        descripcionVisible: 'Creación del diseño',
        costoDiseno: '120000',
        visibleCliente: true,
      }, {
        uiKey: 'design-2',
        idDetalleEstampadoCotizacion: 88,
        descripcionVisible: 'Adaptación de diseño',
        costoDiseno: '0',
        visibleCliente: false,
      }],
      conceptosAdicionales: [{
        localId: 'concept-ui',
        concepto: 'Transporte',
        valor: '100000',
        visibleCliente: true,
      }],
      subtotalDesglose: 3450000,
      ajusteManual: 627200,
    });

    expect(payload).toEqual({
      precioFinal: 4077200,
      validaHasta: '2026-08-07T23:59:59.000Z',
      descuentoManual: 50000,
      motivoAjusteManual: 'Incluye suministro y entrega urgente.',
      items: [{
        idDetalleCotizacion: 20,
        subtotalServiciosOficial: 2880000,
        costoProducto: 400000,
        otrosCostosItem: 0,
        subtotalOficial: 3280000,
      }],
      disenos: [{
        grupoDisenoCompartido: 'LOGO-1',
        descripcionVisible: 'Creación del diseño',
        costoDiseno: 120000,
        visibleCliente: true,
      }, {
        idDetalleEstampadoCotizacion: 88,
        descripcionVisible: 'Adaptación de diseño',
        costoDiseno: 0,
        visibleCliente: false,
      }],
      conceptosAdicionales: [{
        concepto: 'Transporte',
        valor: 100000,
        visibleCliente: true,
      }],
    });

    expect(payload).not.toHaveProperty('subtotalDesglose');
    expect(payload).not.toHaveProperty('ajusteManual');
    expect(payload).not.toHaveProperty('costosAdicionales');
  });
});

