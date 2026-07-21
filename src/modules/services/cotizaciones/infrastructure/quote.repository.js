// infrastructure/quote.repository.js
import { apiClient } from '../../../../core/services/apiService.js';
import { buildPaginationParams, normalizePaginatedResponse } from '../../../../core/utils/serverPagination.js';
import { quotesDTO } from './adapters/cotizacionDTO.js';

const ENDPOINT = 'api/cotizaciones';

export class QuoteApiRepository {
  async list(filters = {}) {
    try {
      const params = buildPaginationParams({
        sortBy: 'idCotizacion',
        order: 'desc',
        ...filters,
      });
      const { data } = await apiClient.get(ENDPOINT, { params });
      return normalizePaginatedResponse(data, quotesDTO.fromApiList.bind(quotesDTO));
    } catch (error) {
      console.error("Error al listar cotizaciones:", error);
      return normalizePaginatedResponse({}, quotesDTO.fromApiList.bind(quotesDTO));
    }
  }

  async createAsClient(quoteData) {
    const payload = quotesDTO.toApi(quoteData);
    const { data } = await apiClient.post(`${ENDPOINT}/cliente`, payload);
    return quotesDTO.fromApi(data.data);
  }

  async createAsStaff(quoteData) {
    const payload = quotesDTO.toApi(quoteData);
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
        idDetalleCotizacion: Number(det.idDetalleCotizacion),
        precioUnitario: Number(det.precioUnitario || 0),
        costoDiseno: Number(det.costoDiseno || 0),
        observaciones: det.observaciones?.trim() || null
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
      throw new Error(error.response?.data?.message || 'No se pudo aprobar la cotización');
    }
  }

  async cancel(idCotizacion) {
    try {
      const { data } = await apiClient.patch(`${ENDPOINT}/${idCotizacion}/anular`);
      return data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'No se pudo anular la cotización');
    }
  }

  // Eliminación permanente: DELETE /:id/eliminar
  async hardDelete(idCotizacion) {
    try {
      const { data } = await apiClient.delete(`${ENDPOINT}/${idCotizacion}/eliminar`);
      return data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'No se pudo eliminar la cotización');
    }
  }
}
