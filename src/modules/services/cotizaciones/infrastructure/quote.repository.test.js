import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '../../../../core/services/apiService.js';
import { QuoteApiRepository } from './quote.repository.js';

vi.mock('../../../../core/services/apiService.js', () => ({
  apiClient: {
    post: vi.fn(),
    patch: vi.fn(),
  },
}));

describe('QuoteApiRepository workflow contracts', () => {
  const repository = new QuoteApiRepository();

  beforeEach(() => {
    vi.clearAllMocks();
    apiClient.post.mockResolvedValue({ data: { data: {} } });
    apiClient.patch.mockResolvedValue({ data: { data: {} } });
  });

  it('sends the exact new proposal contract without legacy or UI fields', async () => {
    await repository.sendProposal(44, {
      precioFinal: '52000',
      descuentoManual: '1000',
      validaHasta: '2099-08-06T23:59:59.000Z',
      motivoAjusteManual: 'Acuerdo comercial',
      mensajeCliente: 'Propuesta revisada',
      observacionesCliente: 'Incluye entrega',
      observacionesInternas: 'Nota privada',
      ajusteManual: 2000,
      subtotalDesglose: 50000,
      items: [{
        idDetalleCotizacion: '20',
        subtotalServiciosOficial: '46000',
        costoProducto: '3000',
        otrosCostosItem: '1000',
        subtotalOficial: '50000',
        localId: 'ui-item',
      }],
      disenos: [{
        uiKey: 'ui-design',
        grupoDisenoCompartido: 'LOGO-1',
        descripcionVisible: 'Creación del diseño',
        costoDiseno: '2000',
        visibleCliente: true,
      }],
      conceptosAdicionales: [{
        localId: 'concept-1',
        concepto: 'Transporte',
        valor: '1000',
        visibleCliente: true,
      }],
    });

    expect(apiClient.post).toHaveBeenCalledWith('api/cotizaciones/44/propuestas', {
      precioFinal: 52000,
      descuentoManual: 1000,
      validaHasta: '2099-08-06T23:59:59.000Z',
      motivoAjusteManual: 'Acuerdo comercial',
      mensajeCliente: 'Propuesta revisada',
      observacionesCliente: 'Incluye entrega',
      observacionesInternas: 'Nota privada',
      items: [{
        idDetalleCotizacion: 20,
        subtotalServiciosOficial: 46000,
        costoProducto: 3000,
        otrosCostosItem: 1000,
        subtotalOficial: 50000,
      }],
      disenos: [{
        grupoDisenoCompartido: 'LOGO-1',
        descripcionVisible: 'Creación del diseño',
        costoDiseno: 2000,
        visibleCliente: true,
      }],
      conceptosAdicionales: [{
        concepto: 'Transporte',
        valor: 1000,
        visibleCliente: true,
      }],
    });

    const payload = apiClient.post.mock.calls[0][1];
    expect(payload).not.toHaveProperty('costosAdicionales');
    expect(payload).not.toHaveProperty('ajusteManual');
    expect(payload).not.toHaveProperty('subtotalDesglose');
    expect(payload.items[0]).not.toHaveProperty('localId');
  });

  it('uses the exact client and staff response contracts', async () => {
    await repository.respondAsClient(44, {
      idVersion: '8',
      decision: 'ACEPTAR',
      observaciones: 'Acepto',
    });
    await repository.respondAsStaff(44, {
      idVersion: '8',
      decision: 'SOLICITAR_AJUSTE',
      medio: 'WHATSAPP',
      observaciones: 'Cambiar cantidad',
    });

    expect(apiClient.post).toHaveBeenNthCalledWith(
      1,
      'api/cotizaciones/44/responder',
      {
        idVersion: 8,
        decision: 'ACEPTAR',
        observaciones: 'Acepto',
      },
    );
    expect(apiClient.post).toHaveBeenNthCalledWith(
      2,
      'api/cotizaciones/44/respuesta-cliente',
      {
        idVersion: 8,
        decision: 'SOLICITAR_AJUSTE',
        medio: 'WHATSAPP',
        observaciones: 'Cambiar cantidad',
      },
    );
  });

  it('updates only request items and observations', async () => {
    await repository.updateRequest(44, {
      idCliente: 99,
      cliente: {
        nombre: 'No debe enviarse',
      },
      observaciones: 'Actualizar medidas',
      items: [{
        tipoProducto: 'OTRO',
        nombrePersonalizado: 'Bolso',
        cantidad: 2,
        suministradoPor: 'CLIENTE',
        estampados: [{
          idTecnica: 3,
          ubicacion: 'FRENTE',
          origenDiseno: 'PENDIENTE_DEFINIR',
        }],
      }],
    });

    const [, payload] = apiClient.patch.mock.calls[0];
    expect(payload).toEqual({
      observaciones: 'Actualizar medidas',
      items: [{
        tipoProducto: 'OTRO',
        nombrePersonalizado: 'Bolso',
        descripcionPersonalizada: null,
        materialReferencia: null,
        cantidad: 2,
        suministradoPor: 'CLIENTE',
        estampados: [{
          idTecnica: 3,
          ubicacion: 'FRENTE',
          origenDiseno: 'PENDIENTE_DEFINIR',
        }],
        observaciones: null,
      }],
    });
    expect(payload).not.toHaveProperty('cliente');
    expect(payload).not.toHaveProperty('idCliente');
  });
});
