import { createPaginationMeta } from '../../../core/utils/serverPagination';
import { useLatestListRequest } from '../../../core/hooks/useLatestListRequest';
import { productRepository } from '../infrastructure/product.repository';

export const useProducts = (filters = {}) => {
  const queryKey = JSON.stringify(filters);
  const {
    data,
    loading,
    refreshing,
    error,
    refetch: fetchProducts,
  } = useLatestListRequest({
    queryKey,
    load: (signal) => productRepository.list(filters, { signal }),
    initialData: { items: [], meta: createPaginationMeta() },
  });

  const createProduct = async (payload) => {
    const product = await productRepository.create(payload);
    await fetchProducts();
    return product;
  };

  const updateProduct = async (idProducto, payload) => {
    const product = await productRepository.update(idProducto, payload);
    await fetchProducts();
    return product;
  };

  const deactivateProduct = async (idProducto) => {
    await productRepository.deactivate(idProducto);
    await fetchProducts();
  };

  const deleteProduct = async (idProducto) => {
    await productRepository.hardDelete(idProducto);
    await fetchProducts();
  };

  const saveRanges = async (idProducto, rangos) => {
    await productRepository.replaceRanges(idProducto, rangos);
    await fetchProducts();
  };

  return {
    products: data.items,
    paginationMeta: data.meta,
    loading,
    refreshing,
    error,
    createProduct,
    updateProduct,
    deactivateProduct,
    deleteProduct,
    saveRanges,
    refreshProducts: fetchProducts,
  };
};
