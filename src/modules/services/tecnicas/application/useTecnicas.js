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
    const created = await tecnicasRepository.create(tecnicaData);
    await fetchTecnicas();
    return created;
  };

  const handleUpdate = async (id, updatedData) => {
    const updated = await tecnicasRepository.update(id, updatedData);
    await fetchTecnicas();
    return updated;
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
