import { apiClient } from '../../../../core/services/apiService.js';
import { cotizacionDTO } from './adapters/cotizacionDTO.js';

const ENDPOINT = 'api/cotizaciones';

export class QuoteApiRepository {

  async list(filters = {}) {
    const params = {};
    if (filters.search) params.search = filters.search;
    if (filters.status) params.estado = filters.status; 

    const { data } = await apiClient.get(ENDPOINT, { params });

    const items = data.data || []; 
    
    return items.map((item) => cotizacionDTO.toEntity(item));
  }

  async getById(id) {
    const { data } = await apiClient.get(`${ENDPOINT}/${id}`);
    const item = data.data ? data.data : data;
    return cotizacionDTO.toEntity(item);
  }

  async create(quoteData) {
    const payload = cotizacionDTO.toDTO(quoteData);
    const { data } = await apiClient.post(ENDPOINT, payload);
    const item = data.data ? data.data : data;
    return cotizacionDTO.toEntity(item);
  }

  async update(id, updatedData) {
    try {
      const response = await apiClient.patch(`${ENDPOINT}/${id}`, updatedData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "No se pudo actualizar la cotización");
    }
  }

  async reject(id) {
  try {
    const token = localStorage.getItem('token'); 

    const response = await apiClient.patch(`${ENDPOINT}/${id}/rechazar`, {}, {
      headers: {
        'Authorization': `Bearer ${token}` 
      }
    });
    return response.data;
  } catch (error) {
    console.error("Error real del servidor:", error.response?.data);
    throw new Error(error.response?.data?.message || "No se pudo rechazar la cotización");
  }
}
}

export const quoteRepository = new QuoteApiRepository();