import { describe, expect, it } from 'vitest';
import {
  calculateProposalBreakdown,
  createProposalForm,
  datetimeLocalToIso,
  formatMoneyInput,
  validateProposalForm,
} from './quoteProposal';

const future = new Date('2099-08-01T10:00:00');

const baseQuote = {
  idCotizacion: 44,
  precioSugeridoSistema: 4077200,
  detalles: [{
    idDetalleCotizacion: 20,
    cantidad: 100,
    suministradoPor: 'PIXEL',
    subtotalBruto: 3200000,
    descuentoPorcentaje: 10,
    descuentoTotal: 320000,
    subtotalServiciosOficial: 2880000,
    producto: { nombre: 'Camiseta estampada' },
    estampados: [{
      idDetalleEstampadoCotizacion: 71,
      ubicacion: 'FRENTE',
      origenDiseno: 'PIXEL',
      tecnica: { nombre: 'DTF' },
      anchoCm: 10,
      altoCm: 12,
      grupoDisenoCompartido: 'LOGO-1',
    }, {
      idDetalleEstampadoCotizacion: 72,
      ubicacion: 'ESPALDA',
      origenDiseno: 'PIXEL',
      tecnica: { nombre: 'DTF' },
      grupoDisenoCompartido: 'LOGO-1',
    }],
  }],
};

describe('quoteProposal domain model', () => {
  it('creates products with service language and deduplicates shared designs', () => {
    const form = createProposalForm(baseQuote, future);

    expect(form.items).toHaveLength(1);
    expect(form.items[0]).toMatchObject({
      idDetalleCotizacion: 20,
      subtotalServiciosOficial: '2880000',
      suministradoPor: 'PIXEL',
    });
    expect(form.disenos).toHaveLength(1);
    expect(form.disenos[0]).toMatchObject({
      grupoDisenoCompartido: 'LOGO-1',
      tipo: 'Diseño compartido',
    });
    expect(form.disenos[0].cubiertos).toHaveLength(2);
  });

  it('locks client supplied product cost at zero in the initial model', () => {
    const form = createProposalForm({
      ...baseQuote,
      detalles: [{
        ...baseQuote.detalles[0],
        suministradoPor: 'CLIENTE',
        costoProducto: 900000,
      }],
    }, future);

    expect(form.items[0].costoProducto).toBe('0');
  });

  it('calculates breakdown, manual discount and positive or negative adjustment', () => {
    const form = createProposalForm(baseQuote, future);
    form.items[0].subtotalOficial = '3280000';
    form.disenos[0].costoDiseno = '120000';
    form.conceptosAdicionales = [{
      localId: 'concept-1',
      concepto: 'Transporte',
      valor: '100000',
      visibleCliente: true,
    }];
    form.descuentoManual = '50000';
    form.precioFinal = '4077200';

    expect(calculateProposalBreakdown(form)).toMatchObject({
      itemsTotal: 3280000,
      designsTotal: 120000,
      conceptsTotal: 100000,
      discount: 50000,
      subtotalDesglose: 3450000,
      ajusteManual: 627200,
    });

    form.precioFinal = '3300000';
    expect(calculateProposalBreakdown(form).ajusteManual).toBe(-150000);
  });

  it('requires a reason only when the final price differs from the breakdown', () => {
    const form = createProposalForm(baseQuote, future);
    form.validaHasta = '2099-08-07T23:59';
    form.precioFinal = form.items[0].subtotalOficial;

    expect(validateProposalForm(form, future).errors).not.toHaveProperty('motivoAjusteManual');

    form.precioFinal = '4000000';
    expect(validateProposalForm(form, future).errors.motivoAjusteManual)
      .toBe('Explica por qué el precio final es diferente.');

    form.motivoAjusteManual = 'Incluye suministro y entrega urgente.';
    expect(validateProposalForm(form, future).errors).not.toHaveProperty('motivoAjusteManual');
  });

  it('preserves legacy additional costs as a detailed concept', () => {
    const form = createProposalForm({
      ...baseQuote,
      propuesta: {
        precioFinal: 3000000,
        costosAdicionales: 80000,
        observacionesVisibles: 'Entrega incluida',
      },
    }, future);

    expect(form.conceptosAdicionales).toEqual([{
      localId: 'concept-legacy',
      concepto: 'Costos adicionales',
      valor: '80000',
      visibleCliente: true,
    }]);
    expect(form.observacionesCliente).toBe('Entrega incluida');
  });

  it('converts a local calendar date-time without parsing a date-only UTC value', () => {
    const iso = datetimeLocalToIso('2026-08-07T23:59');
    const expected = new Date(2026, 7, 7, 23, 59, 0, 0).toISOString();
    expect(iso).toBe(expected);
  });

  it('formats money inputs without exposing NaN', () => {
    expect(formatMoneyInput('3357200')).toBe('$ 3.357.200');
    expect(formatMoneyInput('invalid')).toBe('$ 0');
  });
});

