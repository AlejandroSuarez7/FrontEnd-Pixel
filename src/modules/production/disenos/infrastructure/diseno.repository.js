import { apiClient } from '../../../../core/services/apiService.js';
import { disenoDTO } from './adapters/diseno.dto.js';

const ENDPOINT = 'api/disenos';

export class DisenoApiRepository {
  async list(filters = {}) {
    try {
      if (filters.idPedido) {
        const items = await this.listByPedido(filters.idPedido);
        return items.filter(item => !filters.estado || item.estado === filters.estado);
      }

      const params = {};
      if (filters.estado) params.estado = filters.estado;
      if (filters.idDisenador) params.idDisenador = Number(filters.idDisenador);

      const { data } = await apiClient.get(ENDPOINT, { params });
      return disenoDTO.fromApiList(data.data || []);
    } catch (error) {
      console.error('Error al listar disenos:', error);
      return [];
    }
  }

  async listByPedido(idPedido) {
    try {
      const { data } = await apiClient.get(`api/pedidos/${idPedido}/disenos`);
      return disenoDTO.fromApiList(data.data || []);
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message || 'No se pudieron consultar los disenos del pedido', { cause: error });
    }
  }

  async listPendingProduction() {
    try {
      const { data } = await apiClient.get(`${ENDPOINT}/produccion/pendientes`);
      return disenoDTO.fromApiList(data.data || []);
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message || 'No se pudo consultar la produccion pendiente', { cause: error });
    }
  }

  async listPedidos(filters = {}) {
    try {
      const params = {};
      if (filters.search) params.termino = filters.search;
      const url = filters.search ? 'api/pedidos/buscar' : 'api/pedidos';
      const { data } = await apiClient.get(url, { params });
      return data.data || [];
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message || 'No se pudieron consultar los pedidos', { cause: error });
    }
  }

  async create(disenoData) {
    try {
      const payload = disenoDTO.toApi(disenoData);
      const { data } = await apiClient.post(ENDPOINT, payload);
      return disenoDTO.fromApi(data.data);
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message || 'No se pudo crear el diseno', { cause: error });
    }
  }

  async update(idDiseno, disenoData) {
    try {
      const payload = disenoDTO.toApiUpdate(disenoData);
      const { data } = await apiClient.patch(`${ENDPOINT}/${idDiseno}`, payload);
      return disenoDTO.fromApi(data.data);
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message || 'No se pudo actualizar el diseno', { cause: error });
    }
  }

  async approve(idDiseno, payload = {}) {
    try {
      const { data } = await apiClient.patch(`${ENDPOINT}/${idDiseno}/aprobar`, {
        observaciones: payload.observaciones?.trim() || undefined,
      });
      return data;
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message || 'No se pudo aprobar el diseno', { cause: error });
    }
  }

  async remove(idDiseno) {
    try {
      const { data } = await apiClient.delete(`${ENDPOINT}/${idDiseno}`);
      return data;
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message || 'No se pudo eliminar el diseno', { cause: error });
    }
  }
}

export const disenoRepository = new DisenoApiRepository();
