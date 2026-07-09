import { useCallback, useEffect, useState } from 'react';
import { createPaginationMeta } from '../../../core/utils/serverPagination';
import { productRepository } from '../infrastructure/product.repository';

export const useProducts = (filters = {}) => {
  const [products, setProducts] = useState([]);
  const [paginationMeta, setPaginationMeta] = useState(createPaginationMeta());
  const [loading, setLoading] = useState(false);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await productRepository.list(filters);
      setProducts(response.items);
      setPaginationMeta(response.meta);
    } catch (error) {
      console.error('Error al listar productos:', error);
      setProducts([]);
      setPaginationMeta(createPaginationMeta());
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const createProduct = async (payload) => {
    await productRepository.create(payload);
    await fetchProducts();
  };

  const updateProduct = async (idProducto, payload) => {
    await productRepository.update(idProducto, payload);
    await fetchProducts();
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
