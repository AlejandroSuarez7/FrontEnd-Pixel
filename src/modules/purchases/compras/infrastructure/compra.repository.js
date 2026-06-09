import { apiClient } from '../../../../core/services/apiService.js';
import { compraDTO } from './adapters/compra.dto.js';

const ENDPOINT = 'api/compras';
const getItems = (data) => data.data || data.compras || data || [];

export class CompraApiRepository {
  async list(filters = {}) {
    try {
      const params = {};
      if (filters.idPedido) params.idPedido = filters.idPedido;
      if (filters.idProveedor) params.idProveedor = filters.idProveedor;
      if (filters.estado) params.estado = filters.estado;
      if (filters.compradoPorId) params.compradoPorId = filters.compradoPorId;
      if (filters.desde) params.desde = filters.desde;
      if (filters.hasta) params.hasta = filters.hasta;

      const { data } = await apiClient.get(ENDPOINT, { params });
      return compraDTO.fromApiList(getItems(data));
    } catch (error) {
      console.error('Error al listar compras:', error);
      return [];
    }
  }

  async listByPedido(idPedido) {
    try {
      const { data } = await apiClient.get(`api/pedidos/${idPedido}/compras`);
      return compraDTO.fromApiList(getItems(data));
    } catch (error) {
      throw new Error(error.message || 'No se pudieron consultar las compras del pedido');
    }
  }

  async listForDesigner() {
    try {
      const { data } = await apiClient.get('api/pedidos');
      const pedidos = getItems(data);
      const comprasPorPedido = await Promise.all(
        pedidos.map(pedido => this.listByPedido(pedido.idPedido).catch(() => []))
      );
      return comprasPorPedido.flat();
    } catch (error) {
      console.error('Error al listar compras para disenador:', error);
      return [];
    }
  }

  async getResumen(filters = {}) {
    try {
      const params = {};
      if (filters.idPedido) params.idPedido = filters.idPedido;
      if (filters.idProveedor) params.idProveedor = filters.idProveedor;
      if (filters.desde) params.desde = filters.desde;
      if (filters.hasta) params.hasta = filters.hasta;
      const { data } = await apiClient.get(`${ENDPOINT}/resumen`, { params });
      return data.data || { totalCompras: 0, cantidadCompras: 0, porEstado: {} };
    } catch (error) {
      console.error('Error al consultar resumen de compras:', error);
      return { totalCompras: 0, cantidadCompras: 0, porEstado: {} };
    }
  }

  async create(compraData) {
    try {
      const { data } = await apiClient.post(ENDPOINT, compraDTO.toApi(compraData));
      return compraDTO.fromApi(data.data);
    } catch (error) {
      throw new Error(error.message || 'No se pudo crear la compra');
    }
  }

  async update(idCompra, compraData) {
    try {
      const { data } = await apiClient.patch(`${ENDPOINT}/${idCompra}`, compraDTO.toApiUpdate(compraData));
      return compraDTO.fromApi(data.data);
    } catch (error) {
      throw new Error(error.message || 'No se pudo actualizar la compra');
    }
  }

  async confirm(idCompra) {
    try {
      const { data } = await apiClient.patch(`${ENDPOINT}/${idCompra}/confirmar`);
      return data;
    } catch (error) {
      throw new Error(error.message || 'No se pudo confirmar la compra');
    }
  }

  async cancel(idCompra, observaciones) {
    try {
      const { data } = await apiClient.patch(`${ENDPOINT}/${idCompra}/anular`, {
        observaciones: observaciones?.trim() || null,
      });
      return data;
    } catch (error) {
      throw new Error(error.message || 'No se pudo anular la compra');
    }
  }

  async remove(idCompra) {
    try {
      const { data } = await apiClient.delete(`${ENDPOINT}/${idCompra}`);
      return data;
    } catch (error) {
      throw new Error(error.message || 'No se pudo eliminar la compra');
    }
  }

  async listPedidos() {
    const { data } = await apiClient.get('api/pedidos');
    return getItems(data);
  }

  async listProveedoresActivos() {
    const { data } = await apiClient.get('api/proveedores', { params: { estado: true } });
    return getItems(data);
  }
}

export const compraRepository = new CompraApiRepository();
