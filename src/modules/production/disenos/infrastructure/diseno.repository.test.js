import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '../../../../core/services/apiService';
import { DisenoApiRepository } from './diseno.repository';

vi.mock('../../../../core/services/apiService', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}));

describe('DisenoApiRepository requirements', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uses the exact requirements endpoint and nested response', async () => {
    apiClient.get.mockResolvedValue({
      data: {
        data: {
          requerimientos: [{
            idRequerimientoDiseno: 'STAMP-34',
            tipo: 'ESTAMPADO',
            idPedido: 54,
            puedeCrearDiseno: true,
          }],
          resumen: { totalDisenosRequeridos: 1 },
        },
      },
    });
    const signal = new AbortController().signal;
    const repository = new DisenoApiRepository();

    const result = await repository.getRequerimientosDiseno(54, { signal });

    expect(apiClient.get).toHaveBeenCalledWith(
      'api/pedidos/54/requerimientos-diseno',
      { signal },
    );
    expect(result.requerimientos).toHaveLength(1);
    expect(result.requerimientos[0].idRequerimientoDiseno).toBe('STAMP-34');
  });

  it.each(['CLIENTE', 'PIXEL'])(
    'defines the requirement origin as %s using the exact contract',
    async origenDiseno => {
      apiClient.patch.mockResolvedValue({ data: { data: { origenDiseno } } });
      const repository = new DisenoApiRepository();

      await repository.definirOrigenRequerimiento(54, 'STAMP-34', origenDiseno);

      expect(apiClient.patch).toHaveBeenCalledWith(
        'api/pedidos/54/requerimientos-diseno/STAMP-34/origen',
        { origenDiseno },
      );
    },
  );

  it('creates an admin design with multipart data and no manual content type', async () => {
    apiClient.post.mockResolvedValue({
      data: {
        data: {
          idDiseno: 15,
          archivoUrl: 'https://files.pixel.test/design.png',
          archivo: {
            url: 'https://files.pixel.test/design.png',
            nombre: 'design.png',
            tipo: 'image/png',
            formato: 'png',
            bytes: 1200,
            resourceType: 'image',
          },
        },
      },
    });
    const repository = new DisenoApiRepository();
    const file = new File(['design'], 'design.png', { type: 'image/png' });

    const result = await repository.create({
      requirement: {
        idRequerimientoDiseno: 'STAMP-34',
        tipo: 'ESTAMPADO',
        idPedido: 54,
        idDetallePedido: 20,
        idEstampadoPedido: 34,
      },
      archivo: file,
      origenDiseno: 'PIXEL',
      descripcion: 'Frontal',
    });

    expect(apiClient.post).toHaveBeenCalledWith('api/disenos', expect.any(FormData));
    expect(apiClient.post.mock.calls[0]).toHaveLength(2);
    const formData = apiClient.post.mock.calls[0][1];
    expect(formData.get('archivo')).toBe(file);
    expect(formData.get('idPedido')).toBe('54');
    expect(formData.get('tipoObjetivo')).toBe('ESTAMPADO');
    expect(formData.get('idEstampadoPedido')).toBe('34');
    expect(formData.get('origenDiseno')).toBe('PIXEL');
    expect(result.archivo.name).toBe('design.png');
  });

  it('attaches a file to an existing design using PATCH multipart', async () => {
    apiClient.patch.mockResolvedValue({ data: { data: { idDiseno: 15, archivoUrl: 'https://files.pixel.test/design.pdf' } } });
    const repository = new DisenoApiRepository();
    const file = new File(['pdf'], 'design.pdf', { type: 'application/pdf' });

    await repository.attachDesignFile(15, file, { observaciones: 'Archivo final.' });

    expect(apiClient.patch).toHaveBeenCalledWith('api/disenos/15', expect.any(FormData));
    const formData = apiClient.patch.mock.calls[0][1];
    expect(formData.get('archivo')).toBe(file);
    expect(formData.get('observaciones')).toBe('Archivo final.');
  });

  it.each(['STAMP-34', 'GROUP-LOGO', 'PRODUCT-20', 'LEGACY-20'])(
    'uploads a client design through requirement %s',
    async requirementId => {
      apiClient.patch.mockResolvedValue({ data: { data: { estado: 'ENVIADO' } } });
      const repository = new DisenoApiRepository();
      const file = new File(['design'], 'design.webp', { type: 'image/webp' });

      await repository.uploadClientDesign(54, requirementId, file);

      expect(apiClient.patch).toHaveBeenCalledWith(
        `api/cliente/pedidos/54/requerimientos-diseno/${requirementId}/diseno`,
        expect.any(FormData),
      );
      expect(apiClient.patch.mock.calls[0][1].get('archivo')).toBe(file);
    },
  );

  it.each([
    [403, 'No tienes permiso para cargar este diseno.'],
    [502, 'No pudimos almacenar el archivo. Intenta nuevamente.'],
  ])('maps upload status %s to a human message', async (status, message) => {
    apiClient.post.mockRejectedValue({ response: { status, data: {} } });
    const repository = new DisenoApiRepository();

    await expect(repository.create({ archivo: new File(['x'], 'x.png', { type: 'image/png' }), idPedido: 1 }))
      .rejects.toMatchObject({ message });
  });
});
