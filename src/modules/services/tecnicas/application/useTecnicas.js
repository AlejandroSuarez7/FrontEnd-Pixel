import { createPaginationMeta } from '../../../../core/utils/serverPagination';
import { useLatestListRequest } from '../../../../core/hooks/useLatestListRequest';
import { tecnicasRepository } from '../infrastructure/tecnicas.repository';

export const useTecnicas = (filters = {}) => {
  const queryKey = JSON.stringify(filters);
  const {
    data,
    loading,
    refreshing,
    error,
    refetch: fetchTecnicas,
  } = useLatestListRequest({
    queryKey,
    load: (signal) => tecnicasRepository.list(filters, { signal }),
    initialData: { items: [], meta: createPaginationMeta() },
  });

  const handleCreate = async (tecnicaData) => {
    await tecnicasRepository.create(tecnicaData);
    await fetchTecnicas();
  };

  const handleUpdate = async (id, updatedData) => {
    await tecnicasRepository.update(id, updatedData);
    await fetchTecnicas();
  };

  const handleDelete = async (id) => {
    await tecnicasRepository.delete(id);
    await fetchTecnicas();
  };

  const handleHardDelete = async (id) => {
    await tecnicasRepository.hardDelete(id);
    await fetchTecnicas();
  };

  return {
    tecnicas: data.items,
    paginationMeta: data.meta,
    loading,
    refreshing,
    error,
    handleCreate,
    handleUpdate,
    handleDelete,
    handleHardDelete,
    refreshTecnicas: fetchTecnicas,
  };
};
