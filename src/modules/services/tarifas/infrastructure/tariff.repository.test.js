import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '../../../../core/services/apiService';
import { tariffRepository } from './tariff.repository';

vi.mock('../../../../core/services/apiService', () => ({
  apiClient: {
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('tariffRepository contracts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiClient.post.mockResolvedValue({
      data: {
        data: {
          idTarifa: 8,
          idTecnica: 2,
          anchoHastaCm: 10.5,
          altoHastaCm: 12.75,
          precioUnitario: 8500.25,
          esGeneral: false,
          estado: true,
        },
      },
    });
    apiClient.patch.mockResolvedValue({ data: { data: {} } });
    apiClient.delete.mockResolvedValue({ data: { data: {} } });
  });

  it('creates a dimensional tariff using the current backend contract', async () => {
    await tariffRepository.create({
      idTecnica: '2',
      nombre: 'Punto corazón',
      anchoHastaCm: '10,5',
      altoHastaCm: '12,75',
      precioUnitario: '8500,25',
      esGeneral: false,
      estado: true,
    });

    expect(apiClient.post).toHaveBeenCalledWith('/api/tarifas-tecnicas', {
      idTecnica: 2,
      nombre: 'Punto corazón',
      anchoHastaCm: 10.5,
      altoHastaCm: 12.75,
      esGeneral: false,
      precioUnitario: 8500.25,
      estado: true,
    });
  });

  it('creates a general tariff without fake zero dimensions', async () => {
    await tariffRepository.create({
      idTecnica: 2,
      nombre: 'Tarifa general',
      anchoHastaCm: null,
      altoHastaCm: null,
      precioUnitario: 7000,
      esGeneral: true,
      estado: true,
    });

    expect(apiClient.post).toHaveBeenCalledWith('/api/tarifas-tecnicas', {
      idTecnica: 2,
      nombre: 'Tarifa general',
      anchoHastaCm: null,
      altoHastaCm: null,
      esGeneral: true,
      precioUnitario: 7000,
      estado: true,
    });
  });

  it('updates and deletes tariffs through the existing endpoints', async () => {
    await tariffRepository.update(8, {
      idTecnica: 2,
      nombre: 'Carta',
      anchoHastaCm: 20,
      altoHastaCm: 20,
      precioUnitario: 9000,
      esGeneral: false,
      estado: true,
    });
    await tariffRepository.remove(8);

    expect(apiClient.patch).toHaveBeenCalledWith('/api/tarifas-tecnicas/8', {
      nombre: 'Carta',
      anchoHastaCm: 20,
      altoHastaCm: 20,
      esGeneral: false,
      precioUnitario: 9000,
      estado: true,
    });
    expect(apiClient.delete).toHaveBeenCalledWith('/api/tarifas-tecnicas/8');
  });
});
