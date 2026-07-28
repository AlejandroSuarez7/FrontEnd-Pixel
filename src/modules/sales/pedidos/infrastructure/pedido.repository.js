// infrastructure/pedido.repository.js
import { apiClient } from '../../../../core/services/apiService.js';
import { buildPaginationParams, normalizePaginatedResponse } from '../../../../core/utils/serverPagination.js';
import { createRequestError } from '../../../../core/utils/requestError.js';
import { pedidoDTO } from './adapters/pedidoDTO.js';

const ENDPOINT = 'api/pedidos';

export class PedidoApiRepository {

  async getExpediente(idPedido, options = {}) {
    try {
      const { data } = await apiClient.get(`${ENDPOINT}/${idPedido}/expediente`, {
        signal: options.signal,
      });
      return data.data;
    } catch (error) {
      throw createRequestError(error, 'No se pudo consultar el expediente del pedido');
    }
  }

  async list(filters = {}, options = {}) {
    const params = buildPaginationParams({
      sortBy: 'idPedido',
      order: 'desc',
      ...filters,
    });
    const { data } = await apiClient.get(ENDPOINT, { params, signal: options.signal });
    return normalizePaginatedResponse(data, pedidoDTO.fromApiList.bind(pedidoDTO));
  }

  // Crea pedido desde una cotización aprobada: POST /api/pedidos
  async create(pedidoData) {
    try {
      const payload = pedidoDTO.toApiCreate(pedidoData);
      const { data } = await apiClient.post(ENDPOINT, payload);
      return pedidoDTO.fromApi(data.data);
    } catch (error) {
      throw createRequestError(error, 'No se pudo crear el pedido');
    }
  }

  // Actualiza observaciones o fecha estimada: PATCH /api/pedidos/:id
  async update(id, pedidoData) {
    try {
      const payload = pedidoDTO.toApiUpdate(pedidoData);
      const { data } = await apiClient.patch(`${ENDPOINT}/${id}`, payload);
      return pedidoDTO.fromApi(data.data);
    } catch (error) {
      throw createRequestError(error, 'No se pudo actualizar el pedido');
    }
  }

  // Marca como EN_PROCESO: PATCH /api/pedidos/:id/en-proceso
  async marcarEnProceso(id) {
    try {
      const { data } = await apiClient.patch(`${ENDPOINT}/${id}/en-proceso`);
      return data;
    } catch (error) {
      throw createRequestError(error, 'No se pudo marcar el pedido en proceso');
    }
  }

  async updateEstimatedDelivery(id, fechaEntregaEstimada) {
    try {
      const { data } = await apiClient.patch(`${ENDPOINT}/${id}/fecha-entrega-estimada`, {
        fechaEntregaEstimada,
      });
      return pedidoDTO.fromApi(data.data);
    } catch (error) {
      throw createRequestError(error, 'No se pudo actualizar la fecha estimada de entrega');
    }
  }

  // Finaliza el pedido: PATCH /api/pedidos/:id/finalizar
  async finalizar(id) {
    try {
      const { data } = await apiClient.patch(`${ENDPOINT}/${id}/finalizar`);
      return data;
    } catch (error) {
      throw createRequestError(error, 'No se pudo finalizar el pedido');
    }
  }

  async marcarPendienteSaldo(id) {
    try {
      const { data } = await apiClient.patch(`${ENDPOINT}/${id}/pendiente-saldo`);
      return data;
    } catch (error) {
      throw createRequestError(error, 'No se pudo solicitar el saldo final');
    }
  }

  async confirmarEntrega(id) {
    try {
      const { data } = await apiClient.patch(`${ENDPOINT}/${id}/confirmar-entrega`);
      return data;
    } catch (error) {
      throw createRequestError(error, 'No se pudo confirmar la entrega');
    }
  }

  async actualizarRequiereDiseno(idPedido, idDetallePedido, requiereDiseno) {
    try {
      const { data } = await apiClient.patch(`${ENDPOINT}/${idPedido}/detalles/${idDetallePedido}/requiere-diseno`, {
        requiereDiseno,
      });
      return data;
    } catch (error) {
      throw createRequestError(error, 'No se pudo actualizar el requisito de diseno');
    }
  }

  async saveClientDesignUrl(idPedido, idDetallePedido, archivoDisenoInicialUrl) {
    try {
      const { data } = await apiClient.patch(
        `api/cliente/pedidos/${idPedido}/detalles/${idDetallePedido}/diseno-url`,
        { archivoDisenoInicialUrl },
      );
      return data.data || data;
    } catch (error) {
      throw createRequestError(error, 'No se pudo guardar el enlace del diseno');
    }
  }

  async registrarDisenoRecibidoCliente(idPedido, idDetallePedido, payload) {
    try {
      const { data } = await apiClient.patch(
        `${ENDPOINT}/${idPedido}/detalles/${idDetallePedido}/diseno-recibido-cliente`,
        {
          archivoDisenoInicialUrl: payload.archivoDisenoInicialUrl.trim(),
          medioRecepcion: payload.medioRecepcion,
          ...(payload.observaciones?.trim() && {
            observaciones: payload.observaciones.trim(),
          }),
        },
      );
      return data.data ?? data;
    } catch (error) {
      throw createRequestError(error, 'No se pudo registrar el diseno recibido del cliente');
    }
  }

  // Anula el pedido: PATCH /api/pedidos/:id/anular
  async anular(id, motivoAnulacion) {
    try {
      const { data } = await apiClient.patch(`${ENDPOINT}/${id}/anular`, {
        ...(motivoAnulacion?.trim() && { motivoAnulacion: motivoAnulacion.trim() }),
      });
      return data;
    } catch (error) {
      throw createRequestError(error, 'No se pudo anular el pedido');
    }
  }
}

export const pedidoRepository = new PedidoApiRepository();
