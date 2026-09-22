import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useVentas } from './useVentas';

const state = vi.hoisted(() => ({ config: null, refetch: vi.fn() }));
const repository = vi.hoisted(() => ({ list: vi.fn(), getResumen: vi.fn() }));
vi.mock('../../../../core/hooks/useLatestListRequest', () => ({
  useLatestListRequest: vi.fn((config) => {
    state.config = config;
    return { data: { ventas: [{ idVenta: 1 }], resumen: { totalVentas: 10 } }, loading: false, refreshing: true, error: null, refetch: state.refetch };
  }),
}));
vi.mock('../infrastructure/venta.repository', () => ({ ventaRepository: repository }));

describe('useVentas', () => {
  it('loads sales and summary concurrently', async () => {
    repository.list.mockResolvedValue([{ idVenta: 2 }]);
    repository.getResumen.mockResolvedValue({ totalVentas: 20 });
    const { result } = renderHook(() => useVentas({ fechaDesde: '2026-01-01' }));
    await expect(state.config.load('signal')).resolves.toEqual({ ventas: [{ idVenta: 2 }], resumen: { totalVentas: 20 } });
    expect(repository.list).toHaveBeenCalledWith({ fechaDesde: '2026-01-01' }, { signal: 'signal' });
    expect(result.current.ventas).toEqual([{ idVenta: 1 }]);
  });
});
