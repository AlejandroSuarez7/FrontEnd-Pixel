// infrastructure/quote.repository.js
import { apiClient } from '../../../../core/services/apiService.js';
import { buildPaginationParams, normalizePaginatedResponse } from '../../../../core/utils/serverPagination.js';
import { createRequestError } from '../../../../core/utils/requestError.js';
import { quotesDTO } from './adapters/cotizacionDTO.js';

const ENDPOINT = 'api/cotizaciones';

export class QuoteApiRepository {
  async list(filters = {}, options = {}) {
    const params = buildPaginationParams({
      sortBy: 'idCotizacion',
      order: 'desc',
      ...filters,
    });
    const { data } = await apiClient.get(ENDPOINT, { params, signal: options.signal });
    return normalizePaginatedResponse(data, quotesDTO.fromApiList.bind(quotesDTO));
  }

  async createAsClient(quoteData) {
    const payload = quotesDTO.toApi(quoteData);
    const { data } = await apiClient.post(`${ENDPOINT}/cliente`, payload);
    return quotesDTO.fromApi(data.data);
  }

  async createAsStaff(quoteData) {
    const payload = quotesDTO.toApi(quoteData);
    payload.detalles = payload.detalles.map((detail, index) => ({
      ...detail,
      costoDiseno: Number(quoteData.detalles?.[index]?.costoDiseno || 0),
    }));
    const { data } = await apiClient.post(`${ENDPOINT}`, payload);
    return quotesDTO.fromApi(data.data);
  }

  async updateAsClient(idCotizacion, quoteData) {
    const payload = quotesDTO.toApi(quoteData);
    const { data } = await apiClient.patch(`${ENDPOINT}/${idCotizacion}/cliente`, payload);
    return quotesDTO.fromApi(data.data);
  }

  // Ahora procesa el arreglo completo enviado desde el formulario para Staff
  async assignPrices(idCotizacion, pricingData) {
    const payload = {
      costosAdicionales: Number(pricingData.costosAdicionales || 0),
      observaciones: pricingData.observaciones?.trim() || null,
      ...(pricingData.motivoCambio?.trim() && {
        motivoCambio: pricingData.motivoCambio.trim(),
      }),
      detalles: pricingData.detalles.map(det => ({
        ...(det.idDetalleCotizacion && { idDetalleCotizacion: Number(det.idDetalleCotizacion) }),
        ...(det.idProducto && { idProducto: Number(det.idProducto) }),
        ...(det.idTecnica && { idTecnica: Number(det.idTecnica) }),
        descripcion: det.descripcion?.trim() || det.producto?.nombre || '',
        cantidad: Number(det.cantidad || 1),
        precioUnitario: Number(det.precioUnitario || det.precioBase || 0),
        costoDiseno: Number(det.costoDiseno || 0),
        observaciones: det.observaciones?.trim() || null,
        requiereDiseno: det.requiereDiseno !== false,
        origenDiseno: det.origenDiseno === 'CLIENTE' ? 'CLIENTE' : 'PIXEL',
        esDisenoGeneral: Boolean(det.esDisenoGeneral),
        archivoDisenoInicialUrl: det.archivoDisenoInicialUrl?.trim() || null,
      }))
    };

    const { data } = await apiClient.patch(`${ENDPOINT}/${idCotizacion}/cotizar`, payload);
    return quotesDTO.fromApi(data.data);
  }

  async approve(idCotizacion) {
    try {
      const { data } = await apiClient.patch(`${ENDPOINT}/${idCotizacion}/aprobar`);
      return data;
    } catch (error) {
      throw createRequestError(error, 'No se pudo aprobar la cotizacion');
    }
  }

  async cancel(idCotizacion) {
    try {
      const { data } = await apiClient.patch(`${ENDPOINT}/${idCotizacion}/anular`);
      return data;
    } catch (error) {
      throw createRequestError(error, 'No se pudo anular la cotizacion');
    }
  }

  // Eliminación permanente: DELETE /:id/eliminar
  async hardDelete(idCotizacion) {
    try {
      const { data } = await apiClient.delete(`${ENDPOINT}/${idCotizacion}/eliminar`);
      return data;
    } catch (error) {
      throw createRequestError(error, 'No se pudo eliminar la cotizacion');
    }
  }
}
