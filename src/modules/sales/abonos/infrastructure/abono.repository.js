import { apiClient } from '../../../../core/services/apiService.js';
import { fetchProtectedBlob } from '../../../../core/services/protectedFileService.js';
import { buildPaginationParams, normalizePaginatedResponse } from '../../../../core/utils/serverPagination.js';
import { abonoDTO } from './adapters/abono.dto.js';

const ENDPOINT = 'api/abonos';

export class AbonoApiRepository {
  async list(filters = {}) {
    try {
      const params = buildPaginationParams({
        sortBy: 'idAbono',
        order: 'desc',
        ...filters,
      });
      const { data } = await apiClient.get(ENDPOINT, { params });
      return normalizePaginatedResponse(data, abonoDTO.fromApiList.bind(abonoDTO));
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message || 'No se pudieron consultar los abonos', { cause: error });
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

  async listClientByPedido(idPedido) {
    try {
      const { data } = await apiClient.get(`api/cliente/pedidos/${idPedido}/abonos`);
      return abonoDTO.fromApiList(data.data || []);
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message || 'No se pudieron consultar tus abonos', { cause: error });
    }
  }

  async uploadClientReceipt(idPedido, file) {
    if (typeof File === 'undefined' || !(file instanceof File)) {
      throw new Error('Selecciona un comprobante antes de continuar.');
    }

    const formData = new FormData();
    formData.append('archivo', file);

    try {
      const { data } = await apiClient.post(
        `api/cliente/pedidos/${idPedido}/abonos/comprobante`,
        formData,
        { timeout: 120000 },
      );
      return data.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message || 'No se pudo procesar el comprobante', { cause: error });
    }
  }

  getClientReceipt(idAbono) {
    return fetchProtectedBlob(`api/cliente/abonos/${idAbono}/comprobante`);
  }

  getAdminReceipt(idAbono) {
    return fetchProtectedBlob(`${ENDPOINT}/${idAbono}/comprobante`);
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
      let requestBody = payload;
      if (typeof File !== 'undefined' && abonoData.archivo instanceof File) {
        requestBody = new FormData();
        Object.entries(payload).forEach(([key, value]) => {
          if (value !== null && value !== undefined) requestBody.append(key, String(value));
        });
        requestBody.append('archivo', abonoData.archivo);
      }
      const { data } = await apiClient.post(ENDPOINT, requestBody);
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
