import { describe, expect, it } from 'vitest';
import { quotesDTO } from './cotizacionDTO.js';

describe('quotesDTO', () => {
  it('envia items y estampados sin precios administrativos', () => {
    const payload = quotesDTO.toApi({
      cliente: {
        nombre: 'Cliente Pixel',
        correo: 'cliente@pixel.com',
        telefono: '3000000000',
      },
      detalles: [{
        tipoProducto: 'CATALOGO',
        idProducto: 4,
        cantidad: 12,
        costoDiseno: 45000,
        suministradoPor: 'PIXEL',
        estampados: [{
          idTecnica: 2,
          idTarifaTecnica: 5,
          ubicacion: 'FRENTE',
          anchoCm: 10,
          altoCm: 12,
          origenDiseno: 'CLIENTE',
          grupoDisenoCompartido: 'GRUPO-DISENO-1',
        }],
      }],
    });

    expect(payload.items[0]).toMatchObject({
      tipoProducto: 'CATALOGO',
      idProducto: 4,
      cantidad: 12,
      suministradoPor: 'PIXEL',
    });
    expect(payload.items[0].estampados[0]).toEqual({
      idTecnica: 2,
      idTarifaTecnica: 5,
      ubicacion: 'FRENTE',
      anchoCm: 10,
      altoCm: 12,
      origenDiseno: 'CLIENTE',
      grupoDisenoCompartido: 'GRUPO-DISENO-1',
    });
    expect(payload.items[0]).not.toHaveProperty('costoDiseno');
    expect(payload).not.toHaveProperty('detalles');
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

  it('conserva una tecnica pendiente como null y omite medidas vacias', () => {
    const payload = quotesDTO.toApi({
      detalles: [{
        tipoProducto: 'CATALOGO',
        idProducto: 4,
        cantidad: 12,
        estampados: [{
          idTecnica: null,
          ubicacion: 'FRENTE',
          anchoCm: '',
          altoCm: '',
          origenDiseno: 'PIXEL',
        }],
      }],
    });

    expect(payload.items[0].estampados[0]).toMatchObject({
      idTecnica: null,
      ubicacion: 'FRENTE',
      origenDiseno: 'PIXEL',
    });
    expect(payload.items[0].estampados[0]).toMatchObject({
      idTarifaTecnica: null,
      anchoCm: null,
      altoCm: null,
    });
  });
});
