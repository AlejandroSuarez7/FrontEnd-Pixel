import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useRoles } from './useRoles';

const mocks = vi.hoisted(() => ({
  hardDelete: vi.fn(),
  refetch: vi.fn(),
}));

vi.mock('../../../../core/hooks/useLatestListRequest', () => ({
  useLatestListRequest: () => ({
    data: {
      items: [],
      meta: {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      },
    },
    loading: false,
    refreshing: false,
    error: null,
    refetch: mocks.refetch,
  }),
}));

vi.mock('../infrastructure/roles.repository', () => ({
  rolesRepository: {
    hardDelete: mocks.hardDelete,
    getDeletionImpact: vi.fn(),
  },
}));

describe('useRoles permanent deletion', () => {
  beforeEach(() => {
    mocks.hardDelete.mockReset().mockResolvedValue(undefined);
    mocks.refetch.mockReset().mockResolvedValue(undefined);
  });

  it('refreshes the role listing after a successful permanent deletion', async () => {
    const { result } = renderHook(() => useRoles({ page: 1, limit: 10 }));

    await act(async () => result.current.handleHardDelete(8));

    expect(mocks.hardDelete).toHaveBeenCalledWith(8);
    expect(mocks.refetch).toHaveBeenCalledOnce();
  });
});
