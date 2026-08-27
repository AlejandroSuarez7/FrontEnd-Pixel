import { createPaginationMeta } from '../../../core/utils/serverPagination';
import { useLatestListRequest } from '../../../core/hooks/useLatestListRequest';
import { categoryRepository } from '../infrastructure/category.repository';

export const useProductCategories = (filters = {}) => {
  const queryKey = JSON.stringify(filters);
  const {
    data,
    loading,
    refreshing,
    error,
    refetch: fetchCategories,
  } = useLatestListRequest({
    queryKey,
    load: (signal) => categoryRepository.list(filters, { signal }),
    initialData: { items: [], meta: createPaginationMeta() },
  });

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
    categories: data.items,
    paginationMeta: data.meta,
    loading,
    refreshing,
    error,
    createCategory,
    updateCategory,
    deactivateCategory,
    deleteCategory,
    refreshCategories: fetchCategories,
  };
};
