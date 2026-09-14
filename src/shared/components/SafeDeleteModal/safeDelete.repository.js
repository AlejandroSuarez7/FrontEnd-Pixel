import { apiClient } from '../../../core/services/apiService.js';
import { createRequestError } from '../../../core/utils/requestError.js';

export const safeDeleteRepository = {
  async getImpact(endpoint, options = {}) {
    try {
      const { data } = await apiClient.get(endpoint, { signal: options.signal });
      return data?.data ?? data;
    } catch (error) {
      throw createRequestError(error, 'No se pudo consultar el impacto de la eliminación.');
    }
  },
};
