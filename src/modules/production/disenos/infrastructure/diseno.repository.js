import { apiClient } from '../../../../core/services/apiService.js';
import { createRequestError } from '../../../../core/utils/requestError.js';
import { disenoDTO } from './adapters/diseno.dto.js';

const ENDPOINT = 'api/disenos';

export class DisenoApiRepository {
  async list(filters = {}, options = {}) {
    if (filters.idPedido) {
      const items = await this.listByPedido(filters.idPedido, options);
      return items.filter(item => !filters.estado || item.estado === filters.estado);
    }

    const params = {};
    if (filters.estado) params.estado = filters.estado;
    if (filters.idDisenador) params.idDisenador = Number(filters.idDisenador);

    const { data } = await apiClient.get(ENDPOINT, { params, signal: options.signal });
    return disenoDTO.fromApiList(data.data || []);
  }

  async listByPedido(idPedido, options = {}) {
    try {
      const { data } = await apiClient.get(`api/pedidos/${idPedido}/disenos`, { signal: options.signal });
      return disenoDTO.fromApiList(data.data || []);
    } catch (error) {
      throw createRequestError(error, 'No se pudieron consultar los disenos del pedido');
    }
  }

  async listPendingProduction() {
    try {
      const { data } = await apiClient.get(`${ENDPOINT}/produccion/pendientes`);
      return disenoDTO.fromApiList(data.data || []);
    } catch (error) {
      throw createRequestError(error, 'No se pudo consultar la produccion pendiente');
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
      throw createRequestError(error, 'No se pudieron consultar los pedidos');
    }
  }

  async create(disenoData) {
    try {
      const payload = disenoDTO.toApi(disenoData);
      const { data } = await apiClient.post(ENDPOINT, payload);
      return disenoDTO.fromApi(data.data);
    } catch (error) {
      throw createRequestError(error, 'No se pudo crear el diseno');
    }
  }

  async update(idDiseno, disenoData) {
    try {
      const payload = disenoDTO.toApiUpdate(disenoData);
      const { data } = await apiClient.patch(`${ENDPOINT}/${idDiseno}`, payload);
      return disenoDTO.fromApi(data.data);
    } catch (error) {
      throw createRequestError(error, 'No se pudo actualizar el diseno');
    }
  }

  async approve(idDiseno, payload = {}) {
    try {
      const { data } = await apiClient.patch(`${ENDPOINT}/${idDiseno}/aprobar`, {
        observaciones: payload.observaciones?.trim() || undefined,
      });
      return data;
    } catch (error) {
      throw createRequestError(error, 'No se pudo aprobar el diseno');
    }
  }

  async approveByClientAdmin(idDiseno, payload = {}) {
    try {
      const { data } = await apiClient.patch(`${ENDPOINT}/${idDiseno}/aprobar-cliente`, {
        medioAprobacion: payload.medioAprobacion,
        observaciones: payload.observaciones?.trim() || undefined,
      });
      return data;
    } catch (error) {
      throw createRequestError(error, 'No se pudo registrar la aprobacion del cliente');
    }
  }

  async rejectByClientAdmin(idDiseno, payload = {}) {
    try {
      const { data } = await apiClient.patch(`${ENDPOINT}/${idDiseno}/rechazar-cliente`, {
        medioRespuesta: payload.medioRespuesta,
        observacionesCliente: payload.observacionesCliente?.trim(),
      });
      return data;
    } catch (error) {
      throw createRequestError(error, 'No se pudo registrar el rechazo del cliente');
    }
  }

  async listClientDesigns(options = {}) {
    try {
      const { data } = await apiClient.get('api/cliente/disenos', {
        signal: options.signal,
      });
      return disenoDTO.fromApiList(data.data || []);
    } catch (error) {
      throw createRequestError(error, 'No se pudieron consultar tus disenos');
    }
  }

  async getClientDesign(idDiseno, options = {}) {
    try {
      const { data } = await apiClient.get(`api/cliente/disenos/${idDiseno}`, {
        signal: options.signal,
      });
      return disenoDTO.fromApi(data.data);
    } catch (error) {
      throw createRequestError(error, 'No se pudo consultar el diseno');
    }
  }

  async approveClientDesign(idDiseno) {
    try {
      const { data } = await apiClient.patch(`api/cliente/disenos/${idDiseno}/aprobar`);
      return data;
    } catch (error) {
      throw createRequestError(error, 'No se pudo aprobar el diseno');
    }
  }

  async rejectClientDesign(idDiseno, payload = {}) {
    try {
      const { data } = await apiClient.patch(`api/cliente/disenos/${idDiseno}/rechazar`, {
        observacionesCliente: payload.observacionesCliente?.trim(),
      });
      return data;
    } catch (error) {
      throw createRequestError(error, 'No se pudo rechazar el diseno');
    }
  }

  async remove(idDiseno) {
    try {
      const { data } = await apiClient.delete(`${ENDPOINT}/${idDiseno}`);
      return data;
    } catch (error) {
      throw createRequestError(error, 'No se pudo eliminar el diseno');
    }
  }
}

export const disenoRepository = new DisenoApiRepository();
