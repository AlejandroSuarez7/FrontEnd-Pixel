import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPaginationMeta } from '../../../core/utils/serverPagination';
import { categoryRepository } from '../infrastructure/category.repository';

export const useProductCategories = (filters = {}) => {
  const { page, limit, search, sortBy, order } = filters;
  const listFilters = useMemo(() => ({
    page,
    limit,
    search,
    sortBy,
    order,
  }), [page, limit, search, sortBy, order]);
  const [categories, setCategories] = useState([]);
  const [paginationMeta, setPaginationMeta] = useState(createPaginationMeta());
  const [loading, setLoading] = useState(false);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const response = await categoryRepository.list(listFilters);
      setCategories(response.items);
      setPaginationMeta(response.meta);
    } catch (error) {
      console.error('Error al listar categorias de producto:', error);
      setCategories([]);
      setPaginationMeta(createPaginationMeta());
    } finally {
      setLoading(false);
    }
  }, [listFilters]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const createCategory = async (payload) => {
    await categoryRepository.create(payload);
    await fetchCategories();
  };

  const updateCategory = async (idCategoriaProducto, payload) => {
    await categoryRepository.update(idCategoriaProducto, payload);
    await fetchCategories();
  };

  const deactivateCategory = async (idCategoriaProducto) => {
    await categoryRepository.deactivate(idCategoriaProducto);
    await fetchCategories();
  };

  const deleteCategory = async (idCategoriaProducto) => {
    await categoryRepository.hardDelete(idCategoriaProducto);
    await fetchCategories();
  };

  return {
    categories,
    paginationMeta,
    loading,
    createCategory,
    updateCategory,
    deactivateCategory,
    deleteCategory,
    refreshCategories: fetchCategories,
  };
};
