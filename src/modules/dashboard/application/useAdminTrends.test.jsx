import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { dashboardRepository } from '../infrastructure/dashboard.repository';
import { useAdminTrends } from './useAdminTrends';

vi.mock('../infrastructure/dashboard.repository', () => ({
  dashboardRepository: {
    getAdminTrends: vi.fn(),
  },
}));

const deferred = () => {
  let resolve;
  const promise = new Promise((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
};

describe('useAdminTrends', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('ignores an older period response after the filters change', async () => {
    const first = deferred();
    const second = deferred();
    dashboardRepository.getAdminTrends
      .mockImplementationOnce(() => first.promise)
      .mockImplementationOnce(() => second.promise);

    const { result, rerender } = renderHook(
      ({ period }) => useAdminTrends(period),
      {
        initialProps: {
          period: { fechaInicio: '2026-08-01', fechaFin: '2026-08-24', granularidad: 'DIA' },
        },
      },
    );

    await waitFor(() => expect(dashboardRepository.getAdminTrends).toHaveBeenCalledTimes(1));
    rerender({
      period: { fechaInicio: '2026-01-01', fechaFin: '2026-08-24', granularidad: 'MES' },
    });
    await waitFor(() => expect(dashboardRepository.getAdminTrends).toHaveBeenCalledTimes(2));

    await act(async () => {
      second.resolve({ series: [{ fecha: '2026-08-01', ingresos: 2 }] });
      await second.promise;
    });
    await waitFor(() => expect(result.current.data?.series[0].ingresos).toBe(2));

    await act(async () => {
      first.resolve({ series: [{ fecha: '2026-08-01', ingresos: 1 }] });
      await first.promise;
    });
    expect(result.current.data?.series[0].ingresos).toBe(2);
  });
});
