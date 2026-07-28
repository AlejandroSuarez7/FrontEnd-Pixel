import { apiClient } from '../../../core/services/apiService';

const PUBLIC_ENDPOINT = '/api/public';

export const publicQuoteRepository = {
  async listProducts(options = {}) {
    const { data } = await apiClient.get(`${PUBLIC_ENDPOINT}/productos`, {
      signal: options.signal,
    });
    return data.data || [];
  },

  async listProductsByCategory(idCategoriaProducto, options = {}) {
    const params = idCategoriaProducto ? { idCategoriaProducto } : {};
    const { data } = await apiClient.get(`${PUBLIC_ENDPOINT}/productos`, {
      params,
      signal: options.signal,
    });
    return data.data || [];
  },

  async listCategories(options = {}) {
    const { data } = await apiClient.get(`${PUBLIC_ENDPOINT}/categorias-producto`, {
      signal: options.signal,
    });
    return data.data || [];
  },

  async listTechniques(options = {}) {
    const { data } = await apiClient.get(`${PUBLIC_ENDPOINT}/tecnicas`, {
      signal: options.signal,
    });
    return data.data || [];
  },

  async calculate(items, options = {}) {
    const { data } = await apiClient.post(`${PUBLIC_ENDPOINT}/cotizaciones/calcular`, { items }, {
      skipAuthRedirect: true,
      signal: options.signal,
    });
    return data.data;
  },

  async create(payload) {
    const { data } = await apiClient.post(`${PUBLIC_ENDPOINT}/cotizaciones`, payload, { skipAuthRedirect: true });
    return data;
  },
};
