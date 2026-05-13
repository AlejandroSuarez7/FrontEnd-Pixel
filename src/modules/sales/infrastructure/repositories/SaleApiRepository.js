import { apiClient } from '../../../../core/services/apiService.js';
import { saleDTOAdapter } from '../adapters/saleDTOAdapter.js';

// Endpoint base de este módulo — ajústalo según tu API
const ENDPOINT = 'api/sales';

export class SaleApiRepository {

  async list(filters = {}) {
    const params = {};
    if (filters.search)            params.search = filters.search;
    if (filters.status)            params.estado = filters.status;   // backend usa "estado"
    if (filters.dateRange?.length) {
      params.fechaDesde = filters.dateRange[0];
      params.fechaHasta = filters.dateRange[1];
    }

    const { data } = await apiClient.get(ENDPOINT, { params });

    // La API devuelve: { message, data: [], meta: { page, limit, totalRegistros, ... } }
    const items = data.data;           // siempre data.data
    // data.meta está disponible si necesitas paginación en el futuro
    return items.map((item) => saleDTOAdapter.toEntity(item));
  }

  async getById(id) {
    const { data } = await apiClient.get(`${ENDPOINT}/${id}`);
    return saleDTOAdapter.toEntity(data);
  }

  async create(saleData) {
    const payload = saleDTOAdapter.toDTO(saleData);
    const { data } = await apiClient.post(ENDPOINT, payload);
    return saleDTOAdapter.toEntity(data);
  }

  async update(id, saleData) {
    const payload = saleDTOAdapter.toDTO(saleData);
    const { data } = await apiClient.put(`${ENDPOINT}/${id}`, payload);
    return saleDTOAdapter.toEntity(data);
  }

  async cancel(id, reason) {
    const { data } = await apiClient.patch(`${ENDPOINT}/${id}/cancel`, {
      cancellationReason: reason,
    });
    return saleDTOAdapter.toEntity(data);
  }
}