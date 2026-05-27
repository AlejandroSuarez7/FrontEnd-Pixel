// infrastructure/quote.repository.js
import { apiClient } from '../../../../core/services/apiService.js';
import { quotesDTO } from './adapters/cotizacionDTO.js';

const ENDPOINT = 'api/cotizaciones';

export class QuoteApiRepository {
  async list(filters = {}) {
    try {
      let url = ENDPOINT;
      const params = {};

      if (filters.search) {
        url = `${ENDPOINT}/buscar`;
        params.termino = filters.search;
      }

      const { data } = await apiClient.get(url, { params });
      return quotesDTO.fromApiList(data.data || []);
    } catch (error) {
      console.error("Error al listar cotizaciones:", error);
      return [];
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
    const { data } = await apiClient.patch(`${ENDPOINT}/${idCotizacion}/aprobar`);
    return data;
  }

  async cancel(idCotizacion) {
    const { data } = await apiClient.patch(`${ENDPOINT}/${idCotizacion}/anular`);
    return data;
  }
}