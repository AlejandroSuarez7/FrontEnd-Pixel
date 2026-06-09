import { apiClient } from '../../../../core/services/apiService.js';
import { abonoDTO } from './adapters/abono.dto.js';

const ENDPOINT = 'api/abonos';

export class AbonoApiRepository {
  async list(filters = {}) {
    try {
      if (filters.onlyOwnPedidos) {
        const pedidos = await this.listPedidos();
        const abonosPorPedido = await Promise.all(
          pedidos.map(pedido => this.listByPedido(pedido.idPedido).catch(() => []))
        );
        return abonosPorPedido
          .flat()
          .filter(item =>
            (!filters.estado || item.estado === filters.estado) &&
            (!filters.metodoPago || item.metodoPago === filters.metodoPago)
          );
      }

      if (filters.idPedido) {
        const items = await this.listByPedido(filters.idPedido);
        return items.filter(item =>
          (!filters.estado || item.estado === filters.estado) &&
          (!filters.metodoPago || item.metodoPago === filters.metodoPago)
        );
      }

      const params = {};
      if (filters.estado) params.estado = filters.estado;
      if (filters.metodoPago) params.metodoPago = filters.metodoPago;
      if (filters.desde) params.desde = filters.desde;
      if (filters.hasta) params.hasta = filters.hasta;

      const { data } = await apiClient.get(ENDPOINT, { params });
      return abonoDTO.fromApiList(data.data || []);
    } catch (error) {
      console.error('Error al listar abonos:', error);
      return [];
    }
  }

  async getById(idAbono) {
    try {
      const { data } = await apiClient.get(`${ENDPOINT}/${idAbono}`);
      return abonoDTO.fromApi(data.data);
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message || 'No se pudo consultar el abono', { cause: error });
    }
  }

  async listByPedido(idPedido) {
    try {
      const { data } = await apiClient.get(`api/pedidos/${idPedido}/abonos`);
      return abonoDTO.fromApiList(data.data || []);
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message || 'No se pudieron consultar los abonos del pedido', { cause: error });
    }
  }

  async getPedido(idPedido) {
    try {
      const { data } = await apiClient.get(`api/pedidos/${idPedido}`);
      return data.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message || 'No se pudo consultar el pedido', { cause: error });
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

  async create(abonoData) {
    try {
      const payload = abonoDTO.toApi(abonoData);
      const { data } = await apiClient.post(ENDPOINT, payload);
      return abonoDTO.fromApi(data.data);
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message || 'No se pudo registrar el abono', { cause: error });
    }
  }

  async update(idAbono, abonoData) {
    try {
      const payload = abonoDTO.toApiUpdate(abonoData);
      const { data } = await apiClient.patch(`${ENDPOINT}/${idAbono}`, payload);
      return abonoDTO.fromApi(data.data);
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message || 'No se pudo actualizar el abono', { cause: error });
    }
  }

  async confirm(idAbono, payload = {}) {
    try {
      const { data } = await apiClient.patch(`${ENDPOINT}/${idAbono}/confirmar`, {
        referencia: payload.referencia?.trim() || undefined,
        observaciones: payload.observaciones?.trim() || undefined,
      });
      return data;
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message || 'No se pudo confirmar el abono', { cause: error });
    }
  }

  async reject(idAbono, motivoRechazo) {
    try {
      const { data } = await apiClient.patch(`${ENDPOINT}/${idAbono}/rechazar`, {
        motivoRechazo: motivoRechazo?.trim(),
      });
      return data;
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message || 'No se pudo rechazar el abono', { cause: error });
    }
  }

  async remove(idAbono) {
    try {
      const { data } = await apiClient.delete(`${ENDPOINT}/${idAbono}`);
      return data;
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message || 'No se pudo eliminar el abono', { cause: error });
    }
  }
}

export const abonoRepository = new AbonoApiRepository();
