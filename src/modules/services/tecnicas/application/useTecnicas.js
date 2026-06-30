import { useEffect, useState } from 'react';
import { createPaginationMeta } from '../../../../core/utils/serverPagination';
import { tecnicasRepository } from '../infrastructure/tecnicas.repository';

export const useTecnicas = (filters = {}) => {
  const [tecnicas, setTecnicas] = useState([]);
  const [paginationMeta, setPaginationMeta] = useState(createPaginationMeta());
  const [loading, setLoading] = useState(false);

  const fetchTecnicas = async () => {
    setLoading(true);
    try {
      const response = await tecnicasRepository.list(filters);
      setTecnicas(response.items);
      setPaginationMeta(response.meta);
    } catch (error) {
      console.error('Error en el hook al cargar las tecnicas:', error);
      setTecnicas([]);
      setPaginationMeta(createPaginationMeta());
    } finally {
      setLoading(false);
    }
  };

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

  useEffect(() => {
    fetchTecnicas();
  }, [filters.search, filters.page, filters.limit, filters.sortBy, filters.order]);

  return {
    tecnicas,
    paginationMeta,
    loading,
    handleCreate,
    handleUpdate,
    handleDelete,
    handleHardDelete,
    refreshTecnicas: fetchTecnicas,
  };
};
