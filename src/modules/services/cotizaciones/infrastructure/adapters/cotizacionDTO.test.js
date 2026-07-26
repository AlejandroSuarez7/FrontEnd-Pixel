import { describe, expect, it } from 'vitest';
import { quotesDTO } from './cotizacionDTO.js';

describe('quotesDTO', () => {
  it('preserva la configuracion de diseno sin enviar precios administrativos', () => {
    const payload = quotesDTO.toApi({
      cliente: {
        nombre: 'Cliente Pixel',
        correo: 'cliente@pixel.com',
        telefono: '3000000000',
      },
      detalles: [{
        idProducto: 4,
        idTecnica: 2,
        cantidad: 12,
        costoDiseno: 45000,
        requiereDiseno: true,
        origenDiseno: 'CLIENTE',
        esDisenoGeneral: true,
        archivoDisenoInicialUrl: 'https://example.com/diseno.png',
      }],
    });

    expect(payload.detalles[0]).toMatchObject({
      idProducto: 4,
      idTecnica: 2,
      cantidad: 12,
      requiereDiseno: true,
      origenDiseno: 'CLIENTE',
      esDisenoGeneral: true,
      archivoDisenoInicialUrl: 'https://example.com/diseno.png',
    });
    expect(payload.detalles[0]).not.toHaveProperty('costoDiseno');
  });

  it('mantiene los snapshots OCR y de diseno recibidos del backend', () => {
    const quote = quotesDTO.fromApi({
      idCotizacion: 18,
      detalles: [{
        idDetalleCotizacion: 7,
        descuentoPorcentaje: '7.14',
        costoDiseno: '25000',
        requiereDiseno: false,
        origenDiseno: 'PIXEL',
      }],
    });

    expect(quote.detalles[0]).toMatchObject({
      descuentoPorcentaje: 7.14,
      costoDiseno: 25000,
      requiereDiseno: false,
      origenDiseno: 'PIXEL',
    });
  });
});
