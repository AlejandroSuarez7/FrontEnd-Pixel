import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPaginationMeta } from '../../../core/utils/serverPagination';
import { productRepository } from '../infrastructure/product.repository';

export const useProducts = (filters = {}) => {
  const { page, limit, search, sortBy, order, idCategoriaProducto } = filters;
  const listFilters = useMemo(() => ({
    page,
    limit,
    search,
    sortBy,
    order,
    idCategoriaProducto,
  }), [page, limit, search, sortBy, order, idCategoriaProducto]);
  const [products, setProducts] = useState([]);
  const [paginationMeta, setPaginationMeta] = useState(createPaginationMeta());
  const [loading, setLoading] = useState(false);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await productRepository.list(listFilters);
      setProducts(response.items);
      setPaginationMeta(response.meta);
    } catch (error) {
      console.error('Error al listar productos:', error);
      setProducts([]);
      setPaginationMeta(createPaginationMeta());
    } finally {
      setLoading(false);
    }
  }, [listFilters]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

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
    products,
    paginationMeta,
    loading,
    createProduct,
    updateProduct,
    deactivateProduct,
    deleteProduct,
    saveRanges,
    refreshProducts: fetchProducts,
  };
};
