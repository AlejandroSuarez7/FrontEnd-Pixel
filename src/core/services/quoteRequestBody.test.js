import { describe, expect, it } from 'vitest';
import { buildQuoteRequestBody } from './quoteRequestBody';

const clientItem = (overrides = {}) => ({
  idProducto: 1,
  requiereDiseno: true,
  origenDiseno: 'CLIENTE',
  esDisenoGeneral: false,
  estampados: [{ origenDiseno: 'CLIENTE', grupoDisenoCompartido: 'LOGO-1' }],
  ...overrides,
});

describe('buildQuoteRequestBody', () => {
  it('keeps JSON when no design files exist', () => {
    const payload = { items: [clientItem()], observaciones: null };
    const body = buildQuoteRequestBody(payload);

    expect(body).not.toBeInstanceOf(FormData);
    expect(body).toEqual(payload);
    expect(body.items[0]).not.toHaveProperty('archivoDisenoIndice');
  });

  it('builds multipart with a JSON payload and archivoDiseno index zero', () => {
    const file = new File(['logo'], 'logo.png', { type: 'image/png' });
    const body = buildQuoteRequestBody({ items: [{ ...clientItem(), archivoDiseno: file }] });
    const payload = JSON.parse(body.get('payload'));

    expect(body).toBeInstanceOf(FormData);
    expect(payload.items[0]).toMatchObject({
      archivoDisenoIndice: 0,
      esDisenoGeneral: false,
    });
    expect(payload.items[0]).not.toHaveProperty('archivoDiseno');
    expect(body.getAll('archivoDiseno')).toEqual([file]);
  });

  it('assigns indexes zero and one to two different files', () => {
    const first = new File(['one'], 'one.jpg', { type: 'image/jpeg' });
    const second = new File(['two'], 'two.pdf', { type: 'application/pdf' });
    const body = buildQuoteRequestBody({
      items: [
        { ...clientItem({ idProducto: 1 }), archivoDiseno: first },
        { ...clientItem({ idProducto: 2 }), archivoDiseno: second },
      ],
    });
    const payload = JSON.parse(body.get('payload'));

    expect(payload.items.map((item) => item.archivoDisenoIndice)).toEqual([0, 1]);
    expect(body.getAll('archivoDiseno')).toEqual([first, second]);
  });

  it('reuses index zero and appends a shared File only once', () => {
    const shared = new File(['shared'], 'shared.webp', { type: 'image/webp' });
    const body = buildQuoteRequestBody({
      items: [
        { ...clientItem({ idProducto: 1 }), archivoDiseno: shared },
        { ...clientItem({ idProducto: 2 }), archivoDiseno: shared },
      ],
    });
    const payload = JSON.parse(body.get('payload'));

    expect(payload.items.map((item) => item.archivoDisenoIndice)).toEqual([0, 0]);
    expect(body.getAll('archivoDiseno')).toEqual([shared]);
    expect(payload.items[0].estampados[0].grupoDisenoCompartido).toBe('LOGO-1');
  });

  it.each([
    ['PIXEL', true],
    ['NO_REQUIERE', false],
  ])('does not append a file for %s design origin', (origin, requiresDesign) => {
    const file = new File(['unused'], 'unused.png', { type: 'image/png' });
    const item = clientItem({
      requiereDiseno: requiresDesign,
      origenDiseno: origin,
      estampados: [{ origenDiseno: origin }],
      archivoDiseno: file,
    });
    const body = buildQuoteRequestBody({ items: [item] });

    expect(body).not.toBeInstanceOf(FormData);
    expect(body.items[0]).not.toHaveProperty('archivoDiseno');
    expect(body.items[0]).not.toHaveProperty('archivoDisenoIndice');
  });
});
