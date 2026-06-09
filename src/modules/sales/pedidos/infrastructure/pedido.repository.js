// infrastructure/pedido.repository.js
import { apiClient } from '../../../../core/services/apiService.js';
import { pedidoDTO } from './adapters/pedidoDTO.js';

const ENDPOINT = 'api/pedidos';

export class PedidoApiRepository {

  async list(filters = {}) {
    try {
      let url = ENDPOINT;
      const params = {};

      if (filters.search) {
        url = `${ENDPOINT}/buscar`;
        params.termino = filters.search;
      }

      const { data } = await apiClient.get(url, { params });
      return pedidoDTO.fromApiList(data.data || []);
    } catch (error) {
      console.error('Error al listar pedidos:', error);
      return [];
    }
  }

  // Crea pedido desde una cotización aprobada: POST /api/pedidos
  async create(pedidoData) {
    try {
      const payload = pedidoDTO.toApiCreate(pedidoData);
      const { data } = await apiClient.post(ENDPOINT, payload);
      return pedidoDTO.fromApi(data.data);
    } catch (error) {
      throw new Error(error.response?.data?.message || 'No se pudo crear el pedido');
    }
  }

  // Actualiza observaciones o fecha estimada: PATCH /api/pedidos/:id
  async update(id, pedidoData) {
    try {
      const payload = pedidoDTO.toApiUpdate(pedidoData);
      const { data } = await apiClient.patch(`${ENDPOINT}/${id}`, payload);
      return pedidoDTO.fromApi(data.data);
    } catch (error) {
      throw new Error(error.response?.data?.message || 'No se pudo actualizar el pedido');
    }
  }

  // Marca como EN_PROCESO: PATCH /api/pedidos/:id/en-proceso
  async marcarEnProceso(id) {
    try {
      const { data } = await apiClient.patch(`${ENDPOINT}/${id}/en-proceso`);
      return data;
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message || 'No se pudo marcar el pedido en proceso');
    }
  }

  // Finaliza el pedido: PATCH /api/pedidos/:id/finalizar
  async finalizar(id) {
    try {
      const { data } = await apiClient.patch(`${ENDPOINT}/${id}/finalizar`);
      return data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'No se pudo finalizar el pedido');
    }
  }

  // Anula el pedido: PATCH /api/pedidos/:id/anular
  async anular(id) {
    try {
      const { data } = await apiClient.patch(`${ENDPOINT}/${id}/anular`);
      return data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'No se pudo anular el pedido');
    }
  }
}

export const pedidoRepository = new PedidoApiRepository();
