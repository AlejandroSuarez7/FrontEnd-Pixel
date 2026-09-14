import { apiClient } from '../../../../core/services/apiService.js';
import { createRequestError } from '../../../../core/utils/requestError.js';
import { compraDTO } from './adapters/compra.dto.js';

const ENDPOINT = 'api/compras';
const getItems = (data) => data.data || data.compras || data || [];

export class CompraApiRepository {
  async list(filters = {}, options = {}) {
    const params = {};
    if (filters.idPedido) params.idPedido = filters.idPedido;
    if (filters.idProveedor) params.idProveedor = filters.idProveedor;
    if (filters.estado) params.estado = filters.estado;
    if (filters.compradoPorId) params.compradoPorId = filters.compradoPorId;
    if (filters.desde) params.desde = filters.desde;
    if (filters.hasta) params.hasta = filters.hasta;

    const { data } = await apiClient.get(ENDPOINT, { params, signal: options.signal });
    return compraDTO.fromApiList(getItems(data));
  }

  async listByPedido(idPedido, options = {}) {
    try {
      const { data } = await apiClient.get(`api/pedidos/${idPedido}/compras`, { signal: options.signal });
      return compraDTO.fromApiList(getItems(data));
    } catch (error) {
      throw createRequestError(error, 'No se pudieron consultar las compras del pedido');
    }
  }

  async listForDesigner(options = {}) {
    const { data } = await apiClient.get('api/pedidos', { signal: options.signal });
    const pedidos = getItems(data);
    const comprasPorPedido = await Promise.all(
      pedidos.map(pedido => this.listByPedido(pedido.idPedido, options))
    );
    return comprasPorPedido.flat();
  }

  async getResumen(filters = {}, options = {}) {
    const params = {};
    if (filters.idPedido) params.idPedido = filters.idPedido;
    if (filters.idProveedor) params.idProveedor = filters.idProveedor;
    if (filters.desde) params.desde = filters.desde;
    if (filters.hasta) params.hasta = filters.hasta;
    const { data } = await apiClient.get(`${ENDPOINT}/resumen`, { params, signal: options.signal });
    return data.data || { totalCompras: 0, cantidadCompras: 0, porEstado: {} };
  }

  async create(compraData) {
    try {
      const { data } = await apiClient.post(ENDPOINT, compraDTO.toApi(compraData));
      return compraDTO.fromApi(data.data);
    } catch (error) {
      throw createRequestError(error, 'No se pudo crear la compra');
    }
  }

  async update(idCompra, compraData) {
    try {
      const { data } = await apiClient.patch(`${ENDPOINT}/${idCompra}`, compraDTO.toApiUpdate(compraData));
      return compraDTO.fromApi(data.data);
    } catch (error) {
      throw createRequestError(error, 'No se pudo actualizar la compra');
    }
  }

  async confirm(idCompra) {
    try {
      const { data } = await apiClient.patch(`${ENDPOINT}/${idCompra}/confirmar`);
      return data;
    } catch (error) {
      throw createRequestError(error, 'No se pudo confirmar la compra');
    }
  }

  async cancel(idCompra, observaciones) {
    try {
      const { data } = await apiClient.patch(`${ENDPOINT}/${idCompra}/anular`, {
        observaciones: observaciones?.trim() || null,
      });
      return data;
    } catch (error) {
      throw createRequestError(error, 'No se pudo anular la compra');
    }
  }

  async remove(idCompra) {
    try {
      const { data } = await apiClient.delete(`${ENDPOINT}/${idCompra}`);
      return data;
    } catch (error) {
      throw createRequestError(error, 'No se pudo eliminar la compra');
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
