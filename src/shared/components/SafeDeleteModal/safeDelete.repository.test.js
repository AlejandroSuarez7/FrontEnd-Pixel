import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '../../../core/services/apiService';
import { safeDeleteRepository } from './safeDelete.repository';

vi.mock('../../../core/services/apiService', () => ({ apiClient: { get: vi.fn() } }));

describe('safeDeleteRepository', () => {
  beforeEach(() => vi.clearAllMocks());

  it('loads nested and direct deletion impacts with cancellation support', async () => {
    const signal = new AbortController().signal;
    apiClient.get
      .mockResolvedValueOnce({ data: { data: { puedeEliminar: true } } })
      .mockResolvedValueOnce({ data: { puedeEliminar: false } });
    await expect(safeDeleteRepository.getImpact('/impact/1', { signal })).resolves.toEqual({ puedeEliminar: true });
    await expect(safeDeleteRepository.getImpact('/impact/2')).resolves.toEqual({ puedeEliminar: false });
    expect(apiClient.get).toHaveBeenCalledWith('/impact/1', { signal });
  });

  it('wraps request errors with the impact fallback message', async () => {
    apiClient.get.mockRejectedValueOnce({ response: { data: {} } });
    await expect(safeDeleteRepository.getImpact('/impact/error'))
      .rejects
      .toThrow('No se pudo consultar el impacto de la eliminación.');
  });
});
