import { apiClient } from '../../../core/services/apiService';

const PUBLIC_ENDPOINT = '/api/public';

export const publicQuoteRepository = {
  async listProducts() {
    const { data } = await apiClient.get(`${PUBLIC_ENDPOINT}/productos`);
    return data.data || [];
  },

  async listProductsByCategory(idCategoriaProducto) {
    const params = idCategoriaProducto ? { idCategoriaProducto } : {};
    const { data } = await apiClient.get(`${PUBLIC_ENDPOINT}/productos`, { params });
    return data.data || [];
  },

  async listCategories() {
    const { data } = await apiClient.get(`${PUBLIC_ENDPOINT}/categorias-producto`);
    return data.data || [];
  },

  async listTechniques() {
    const { data } = await apiClient.get(`${PUBLIC_ENDPOINT}/tecnicas`);
    return data.data || [];
  },

  async calculate(items) {
    const { data } = await apiClient.post(`${PUBLIC_ENDPOINT}/cotizaciones/calcular`, { items });
    return data.data;
  },

  async create(payload) {
    const { data } = await apiClient.post(`${PUBLIC_ENDPOINT}/cotizaciones`, payload);
    return data;
  },
};
