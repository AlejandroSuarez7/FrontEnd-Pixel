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

  async calculate(payload, options = {}) {
    const body = Array.isArray(payload) ? { items: payload } : payload;
    const { data } = await apiClient.post(`${PUBLIC_ENDPOINT}/cotizaciones/calcular`, body, {
      skipAuthRedirect: true,
      signal: options.signal,
    });
    return data.data;
  },

  async create(payload) {
    const { data } = await apiClient.post(`${PUBLIC_ENDPOINT}/cotizaciones`, payload, { skipAuthRedirect: true });
    return data;
  },

  async getClientQuote(idCotizacion, options = {}) {
    const { data } = await apiClient.get(`/api/cotizaciones/${idCotizacion}`, {
      signal: options.signal,
    });
    return data.data;
  },

  async updateClientQuote(idCotizacion, payload) {
    const { data } = await apiClient.patch(`/api/cotizaciones/${idCotizacion}/cliente`, {
      items: payload.items,
      observaciones: payload.observaciones ?? null,
    });
    return data.data;
  },
};
