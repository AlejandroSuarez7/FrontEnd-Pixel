import { useLatestListRequest } from '../../../../core/hooks/useLatestListRequest';
import { createPaginationMeta } from '../../../../core/utils/serverPagination';
import { tariffRepository } from '../infrastructure/tariff.repository';

export const useTariffs = (filters = {}) => {
  const queryKey = JSON.stringify(filters);
  const {
    data,
    loading,
    refreshing,
    error,
    refetch,
  } = useLatestListRequest({
    queryKey,
    load: (signal) => tariffRepository.list(filters, { signal }),
    initialData: { items: [], meta: createPaginationMeta() },
  });

  const createTariff = async (payload) => {
    const result = await tariffRepository.create(payload);
    await refetch();
    return result;
  };

  const updateTariff = async (idTarifa, payload) => {
    const result = await tariffRepository.update(idTarifa, payload);
    await refetch();
    return result;
  };

  const deleteTariff = async (idTarifa) => {
    await tariffRepository.remove(idTarifa);
    await refetch();
  };

  return {
    tariffs: data.items,
    paginationMeta: data.meta,
    loading,
    refreshing,
    error,
    createTariff,
    updateTariff,
    deleteTariff,
    refreshTariffs: refetch,
  };
};
