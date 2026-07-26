import { apiClient } from '../../../core/services/apiService.js';
import { buildPaginationParams, normalizePaginatedResponse } from '../../../core/utils/serverPagination.js';

const ENDPOINT = 'api/clientes';

const mapClient = (item) => ({
  idCliente: item.idCliente,
  nombre: item.nombre || '',
  documento: item.documento || '',
  correo: item.correo || '',
  telefono: item.telefono || '',
  direccion: item.direccion || '',
  estado: Boolean(item.estado),
  fechaCreacion: item.fechaCreacion,
  fechaActualizacion: item.fechaActualizacion,
  cotizaciones: item.cotizaciones || [],
  pedidos: item.pedidos || [],
  count: item._count || { cotizaciones: 0, pedidos: 0 },
});

export const clientRepository = {
  async list(filters = {}) {
    const params = buildPaginationParams({
      sortBy: 'nombre',
      order: 'asc',
      ...filters,
    });
    const { data } = await apiClient.get(ENDPOINT, { params });
    return normalizePaginatedResponse(data, items => items.map(mapClient));
  },

  async getById(idCliente) {
    const { data } = await apiClient.get(`${ENDPOINT}/${idCliente}`);
    return mapClient(data.data);
  },

  async listOrders(idCliente) {
    const { data } = await apiClient.get(`${ENDPOINT}/${idCliente}/pedidos`);
    return Array.isArray(data.data) ? data.data : [];
  },

  async deactivate(idCliente) {
    const { data } = await apiClient.patch(`${ENDPOINT}/${idCliente}/desactivar`);
    return mapClient(data.data);
  },

  async delete(idCliente) {
    const { data } = await apiClient.delete(`${ENDPOINT}/${idCliente}`);
    return data;
  },
};
