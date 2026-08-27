import { describe, expect, it } from 'vitest';
import {
  buildPublicQuoteItemPayload,
  cloneQuoteItem,
  createQuoteItem,
  createStamp,
  validateQuoteItem,
} from './publicQuoteBuilder';

const techniques = [
  { idTecnica: 2, nombre: 'DTF', requiereMedidas: true },
  { idTecnica: 3, nombre: 'Bordado', requiereMedidas: false },
];

describe('publicQuoteBuilder', () => {
  it('builds the exact catalog contract without local identifiers or prices', () => {
    const item = createQuoteItem({
      idProducto: '8',
      cantidad: '12',
      suministradoPor: 'PIXEL',
      requiereDiseno: true,
      origenDiseno: 'PIXEL',
      esDisenoGeneral: false,
      estampados: [createStamp({
        idTecnica: '2',
        idTarifaTecnica: 1,
        ubicacion: 'FRENTE',
        anchoCm: '10',
        altoCm: '12',
        origenDiseno: 'PIXEL',
        grupoDisenoCompartido: 'GRUPO-1',
      })],
    });

    const payload = buildPublicQuoteItemPayload(item, techniques);

    expect(payload).toEqual({
      tipoProducto: 'CATALOGO',
      idProducto: 8,
      cantidad: 12,
      suministradoPor: 'PIXEL',
      requiereDiseno: true,
      origenDiseno: 'PIXEL',
      esDisenoGeneral: false,
      estampados: [{
        idTecnica: 2,
        idTarifaTecnica: 1,
        ubicacion: 'FRENTE',
        anchoCm: 10,
        altoCm: 12,
        origenDiseno: 'PIXEL',
        grupoDisenoCompartido: 'GRUPO-1',
      }],
    });
    expect(JSON.stringify(payload)).not.toMatch(/localId|precio|subtotal|descuento/);
  });

  it('allows an OTRO product without stamps and omits idProducto', () => {
    const item = createQuoteItem({
      tipoProducto: 'OTRO',
      idProducto: '99',
      nombrePersonalizado: 'Bolso artesanal',
      descripcionPersonalizada: 'Material por confirmar',
      materialReferencia: 'Lona gruesa',
      imagenReferencia: 'https://files.pixel.test/bolso.png',
      cantidad: 5,
      suministradoPor: 'CLIENTE',
      observaciones: 'Color negro',
      estampados: [],
    });

    expect(validateQuoteItem(item, [], techniques)).toBeNull();
    expect(buildPublicQuoteItemPayload(item, techniques)).toMatchObject({
      tipoProducto: 'OTRO',
      nombrePersonalizado: 'Bolso artesanal',
      descripcionPersonalizada: 'Material por confirmar',
      materialReferencia: 'Lona gruesa',
      imagenReferencia: 'https://files.pixel.test/bolso.png',
      cantidad: 5,
      suministradoPor: 'CLIENTE',
      observaciones: 'Color negro',
      estampados: [],
    });
    expect(buildPublicQuoteItemPayload(item, techniques)).not.toHaveProperty('idProducto');
  });

  it('only sends dimensions when the selected technique requires them', () => {
    const item = createQuoteItem({
      idProducto: 1,
      estampados: [
        createStamp({ idTecnica: 2, anchoCm: 10, altoCm: 12 }),
        createStamp({ idTecnica: 3, anchoCm: 30, altoCm: 40 }),
      ],
    });
    const payload = buildPublicQuoteItemPayload(item, techniques);

    expect(payload.estampados[0]).toMatchObject({ anchoCm: 10, altoCm: 12 });
    expect(payload.estampados[1]).toMatchObject({ anchoCm: null, altoCm: null });
  });

  it('allows pending dimensions and rejects values above 500 cm', () => {
    const missing = createQuoteItem({
      idProducto: 1,
      estampados: [createStamp({ idTecnica: 2 })],
    });
    const oversized = createQuoteItem({
      idProducto: 1,
      estampados: [createStamp({
        idTecnica: 2,
        anchoCm: 501,
        altoCm: 20,
      })],
    });

    expect(validateQuoteItem(missing, [], techniques)).toBeNull();
    expect(validateQuoteItem(oversized, [], techniques)).toMatch(/500 cm/i);
  });

  it('allows an unknown service and sends a nullable technique without dimensions', () => {
    const item = createQuoteItem({
      idProducto: 1,
      estampados: [createStamp({
        idTecnica: '',
        anchoCm: '',
        altoCm: '',
      })],
    });

    expect(validateQuoteItem(item, [], techniques)).toBeNull();
    expect(buildPublicQuoteItemPayload(item, techniques).estampados[0]).toMatchObject({
      idTecnica: null,
      ubicacion: 'FRENTE',
    });
    expect(buildPublicQuoteItemPayload(item, techniques).estampados[0])
      .toMatchObject({ idTarifaTecnica: null, anchoCm: null, altoCm: null });
  });

  it('duplicates local structure without sharing old design groups', () => {
    const item = createQuoteItem({
      idProducto: 1,
      estampados: [createStamp({
        idTecnica: 2,
        anchoCm: 10,
        altoCm: 12,
        grupoDisenoCompartido: 'GRUPO-ANTERIOR',
      })],
    });

    const duplicate = cloneQuoteItem(item);

    expect(duplicate.localId).not.toBe(item.localId);
    expect(duplicate.estampados[0].localId).not.toBe(item.estampados[0].localId);
    expect(duplicate.estampados[0].grupoDisenoCompartido).toBe('');
  });

  it('keeps a general client design and its public URL in the exact item fields', () => {
    const item = createQuoteItem({
      idProducto: 1,
      requiereDiseno: true,
      origenDiseno: 'CLIENTE',
      esDisenoGeneral: true,
      archivoDisenoInicialUrl: 'https://drive.google.com/design',
      estampados: [
        createStamp({
          idTecnica: 3,
          origenDiseno: 'PIXEL',
          grupoDisenoCompartido: 'GRUPO-IGNORADO',
        }),
      ],
    });

    expect(buildPublicQuoteItemPayload(item, techniques)).toMatchObject({
      origenDiseno: 'CLIENTE',
      archivoDisenoInicialUrl: 'https://drive.google.com/design',
      esDisenoGeneral: true,
      estampados: [{
        idTecnica: 3,
        origenDiseno: 'CLIENTE',
      }],
    });
    expect(buildPublicQuoteItemPayload(item, techniques).estampados[0])
      .not.toHaveProperty('grupoDisenoCompartido');
  });

  it('keeps a stable shared group across stamps and supports mixed design origins', () => {
    const item = createQuoteItem({
      idProducto: 1,
      origenDiseno: 'PENDIENTE_DEFINIR',
      archivoDisenoInicialUrl: 'https://files.pixel.test/client-design.png',
      estampados: [
        createStamp({
          idTecnica: 3,
          origenDiseno: 'CLIENTE',
          grupoDisenoCompartido: 'LOGO-PRINCIPAL',
        }),
        createStamp({
          idTecnica: 3,
          origenDiseno: 'PIXEL',
          grupoDisenoCompartido: 'LOGO-PRINCIPAL',
        }),
      ],
    });

    const payload = buildPublicQuoteItemPayload(item, techniques);
    expect(payload.origenDiseno).toBe('PENDIENTE_DEFINIR');
    expect(payload.archivoDisenoInicialUrl).toBe(
      'https://files.pixel.test/client-design.png',
    );
    expect(payload.estampados.map((stamp) => stamp.grupoDisenoCompartido))
      .toEqual(['LOGO-PRINCIPAL', 'LOGO-PRINCIPAL']);
  });

  it('rejects excessive stamp count and real backend text limits', () => {
    const tooManyStamps = createQuoteItem({
      idProducto: 1,
      estampados: Array.from(
        { length: 21 },
        () => createStamp({ idTecnica: 3 }),
      ),
    });
    const longCustomName = createQuoteItem({
      tipoProducto: 'OTRO',
      nombrePersonalizado: 'x'.repeat(151),
      estampados: [],
    });

    expect(validateQuoteItem(tooManyStamps, [], techniques)).toMatch(/máximo 20/i);
    expect(validateQuoteItem(longCustomName, [], techniques)).toMatch(/150 caracteres/i);
  });

  it('rejects incomplete measure pairs but omits irrelevant dimensions', () => {
    const missingHeight = createQuoteItem({
      idProducto: 1,
      estampados: [
        createStamp({ idTecnica: 2, anchoCm: 10, altoCm: '' }),
      ],
    });
    const noMeasuresRequired = createQuoteItem({
      idProducto: 1,
      estampados: [
        createStamp({ idTecnica: 3, anchoCm: 10, altoCm: '' }),
      ],
    });

    expect(validateQuoteItem(missingHeight, [], techniques)).toMatch(/ancho y alto/i);
    expect(validateQuoteItem(noMeasuresRequired, [], techniques)).toBeNull();
    expect(buildPublicQuoteItemPayload(noMeasuresRequired, techniques).estampados[0])
      .toMatchObject({ anchoCm: null, altoCm: null });
  });
});
