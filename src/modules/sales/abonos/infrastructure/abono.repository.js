import { apiClient } from '../../../../core/services/apiService.js';
import { fetchProtectedBlob } from '../../../../core/services/protectedFileService.js';
import { createRequestError } from '../../../../core/utils/requestError.js';
import { buildPaginationParams, normalizePaginatedResponse } from '../../../../core/utils/serverPagination.js';
import { abonoDTO } from './adapters/abono.dto.js';

const ENDPOINT = 'api/abonos';
const requestError = createRequestError;

const appendText = (formData, key, value, maxLength = 100) => {
  const normalized = String(value || '').trim().slice(0, maxLength);
  if (normalized) formData.append(key, normalized);
};

const isValidIsoDate = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

export const buildClientReceiptFormData = (file, detectedData = {}, observations = '') => {
  if (typeof File === 'undefined' || !(file instanceof File)) {
    throw new Error('Selecciona un comprobante antes de continuar.');
  }

  const formData = new FormData();
  formData.append('archivo', file);

  const amount = Number(detectedData.montoDetectado);
  if (Number.isFinite(amount) && amount > 0) {
    formData.append('montoDetectado', String(amount));
  }

  appendText(formData, 'referenciaDetectada', detectedData.referenciaDetectada);
  if (isValidIsoDate(detectedData.fechaDetectada)) {
    formData.append('fechaDetectada', detectedData.fechaDetectada);
  }
  appendText(formData, 'bancoDetectado', detectedData.bancoDetectado);

  const quality = Number(detectedData.calidadLectura);
  if (Number.isFinite(quality) && quality >= 0 && quality <= 100) {
    formData.append('calidadLectura', String(quality));
  }

  if (typeof detectedData.requiereRevisionManual === 'boolean') {
    formData.append(
      'requiereRevisionManual',
      String(detectedData.requiereRevisionManual),
    );
  }

  formData.append('origenAnalisis', 'FRONTEND');
  appendText(formData, 'observaciones', observations, 500);
  return formData;
};

export class AbonoApiRepository {
  async list(filters = {}, options = {}) {
    try {
      const params = buildPaginationParams({
        sortBy: 'idAbono',
        order: 'desc',
        ...filters,
      });
      const config = { params };
      if (options.signal) config.signal = options.signal;
      const { data } = await apiClient.get(ENDPOINT, config);
      return normalizePaginatedResponse(data, abonoDTO.fromApiList.bind(abonoDTO));
    } catch (error) {
      if (error.code === 'ERR_CANCELED') throw error;
      throw requestError(error, 'No se pudieron consultar los abonos');
    }
  }

  async getById(idAbono) {
    try {
      const { data } = await apiClient.get(`${ENDPOINT}/${idAbono}`);
      return abonoDTO.fromApi(data?.data ?? data);
    } catch (error) {
      throw requestError(error, 'No se pudo consultar el abono');
    }
  }

  async listByPedido(idPedido) {
    try {
      const { data } = await apiClient.get(`api/pedidos/${idPedido}/abonos`);
      return abonoDTO.fromApiList(data.data || []);
    } catch (error) {
      throw requestError(error, 'No se pudieron consultar los abonos del pedido');
    }
  }

  async listClientByPedido(idPedido, options = {}) {
    try {
      const { data } = await apiClient.get(`api/cliente/pedidos/${idPedido}/abonos`, {
        signal: options.signal,
      });
      return abonoDTO.fromApiList(data.data || []);
    } catch (error) {
      throw requestError(error, 'No se pudieron consultar tus abonos');
    }
  }

  async uploadClientReceipt(idPedido, file, detectedData = {}, observations = '') {
    const formData = buildClientReceiptFormData(file, detectedData, observations);

    try {
      const { data } = await apiClient.post(
        `api/cliente/pedidos/${idPedido}/abonos/comprobante`,
        formData,
        { timeout: 120000 },
      );
      return data.data;
    } catch (error) {
      throw requestError(error, 'No se pudo procesar el comprobante');
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
      throw requestError(error, 'No se pudo consultar el pedido');
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
      throw requestError(error, 'No se pudieron consultar los pedidos');
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
      throw requestError(error, 'No se pudo registrar el abono');
    }
  }

  async update(idAbono, abonoData) {
    try {
      const payload = abonoDTO.toApiUpdate(abonoData);
      const { data } = await apiClient.patch(`${ENDPOINT}/${idAbono}`, payload);
      return abonoDTO.fromApi(data.data);
    } catch (error) {
      throw requestError(error, 'No se pudo actualizar el abono');
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
      throw requestError(error, 'No se pudo confirmar el abono');
    }
  }

  async reject(idAbono, motivoRechazo) {
    try {
      const { data } = await apiClient.patch(`${ENDPOINT}/${idAbono}/rechazar`, {
        motivoRechazo: motivoRechazo?.trim(),
      });
      return data;
    } catch (error) {
      throw requestError(error, 'No se pudo rechazar el abono');
    }
  }

  async remove(idAbono) {
    try {
      const { data } = await apiClient.delete(`${ENDPOINT}/${idAbono}`);
      return data;
    } catch (error) {
      throw requestError(error, 'No se pudo eliminar el abono');
    }
  }
}

export const abonoRepository = new AbonoApiRepository();
