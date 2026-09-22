import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useDashboardData } from './useDashboardData';

const mocks = vi.hoisted(() => ({
  options: null,
  getDashboardData: vi.fn(),
}));

vi.mock('../../../core/hooks/useLatestListRequest', () => ({
  useLatestListRequest: (options) => {
    mocks.options = options;
    return { data: { ready: true }, loading: false, refreshing: true, error: null, refetch: vi.fn() };
  },
}));

vi.mock('../infrastructure/dashboard.repository', () => ({
  dashboardRepository: { getDashboardData: mocks.getDashboardData },
}));

describe('useDashboardData', () => {
  beforeEach(() => {
    localStorage.clear();
    mocks.options = null;
    mocks.getDashboardData.mockReset().mockResolvedValue({});
  });

  it('builds the query and delegates loading for the explicit user', async () => {
    const user = { idUsuario: 5 };
    const { result } = renderHook(() => useDashboardData(user, ['ventas.ver', 'pedidos.ver'], 2));
    const signal = new AbortController().signal;

    await mocks.options.load(signal);
    expect(mocks.options.queryKey).toBe('5|ventas.ver|pedidos.ver|2');
    expect(mocks.getDashboardData).toHaveBeenCalledWith(
      user,
      ['ventas.ver', 'pedidos.ver'],
      { signal },
    );
    expect(result.current).toMatchObject({ data: { ready: true }, loading: false, refreshing: true, error: '' });
  });

  it('uses a stored user and supports alternate identity fields', async () => {
    localStorage.setItem('pixel_user', JSON.stringify({ correo: 'cliente@pixel.co' }));
    renderHook(() => useDashboardData(null, []));
    await mocks.options.load(undefined);
    expect(mocks.options.queryKey).toBe('cliente@pixel.co||0');
    expect(mocks.getDashboardData).toHaveBeenCalledWith(
      { correo: 'cliente@pixel.co' },
      [],
      { signal: undefined },
    );
  });

  it('rejects missing sessions and tolerates invalid stored JSON', async () => {
    localStorage.setItem('pixel_user', '{invalid');
    renderHook(() => useDashboardData(null));
    expect(mocks.options.queryKey).toBe('no-session||0');
    expect(() => mocks.options.load()).toThrow('No hay una sesion activa para cargar el dashboard.');
  });
});
