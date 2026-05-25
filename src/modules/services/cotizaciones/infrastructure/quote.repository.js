// infrastructure/quote.repository.js
import { apiClient } from '../../../../core/services/apiService.js';
import { quotesDTO } from './adapters/cotizacionDTO.js';

const ENDPOINT = 'api/cotizaciones';

export class QuoteApiRepository {
  // Lista todas las cotizaciones con o sin filtros de búsqueda
  async list(filters = {}) {
    try {
      let url = ENDPOINT;
      const params = {};

      if (filters.search) {
        url = `${ENDPOINT}/buscar`;
        params.termino = filters.search;
      }

      const { data } = await apiClient.get(url, { params });

      // Fallback seguro por si falla el DTO mapeando la lista
      try {
        return quotesDTO.fromApiList(data.data || []);
      } catch (e) {
        console.error("Fallo el DTO mapeando la lista, usando mapeo alternativo:", e);
        return (data.data || []).map(q => ({
          id: q.idCotizacion,
          idCliente: q.idCliente,
          tipoCotizacion: q.tipoCotizacion,
          estado: q.estado,
          subtotal: Number(q.subtotal || 0),
          costosAdicionales: Number(q.costosAdicionales || 0),
          total: Number(q.total || 0),
          observaciones: q.observaciones,
          detalles: q.detalles || []
        }));
      }
    } catch (error) {
      console.error("Error al listar cotizaciones:", error);
      return [];
    }
  }

  // Flujo CLIENTE: Solicitud directa.
  // El backend NO acepta observaciones en la raíz ni múltiples detalles.
  // Solo se envía exactamente 1 detalle con: idTecnica, descripcion, cantidad,
  // y opcionalmente imagenReferencia y observaciones DENTRO del detalle.
  async createAsClient(quoteData) {
    try {
      const detalle = quoteData.detalles?.[0];

      if (!detalle) {
        throw new Error("Debes agregar al menos un ítem a la cotización.");
      }

      const payload = {
        detalles: [
          {
            idTecnica: Number(detalle.idTecnica),
            descripcion: detalle.descripcion?.trim(),
            cantidad: Number(detalle.cantidad),
            ...(detalle.imagenReferencia && { imagenReferencia: detalle.imagenReferencia }),
            ...(detalle.observaciones   && { observaciones:    detalle.observaciones }),
          }
        ]
      };

      const { data } = await apiClient.post(`${ENDPOINT}/cliente`, payload);
      return data.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message || "Error al solicitar cotización");
    }
  }

  // Flujo EMPLEADO: Registro presencial normal apuntando a la raíz (/)
  async createAsStaff(quoteData) {
    try {
      const detalle = quoteData.detalles?.[0];

      if (!detalle) {
        throw new Error("Debes agregar al menos un ítem a la cotización.");
      }

      const payload = {
        idCliente: Number(quoteData.idCliente),
        ...(quoteData.observaciones && { observaciones: quoteData.observaciones }),
        detalles: [
          {
            idTecnica: Number(detalle.idTecnica),
            descripcion: detalle.descripcion?.trim(),
            cantidad: Number(detalle.cantidad),
            ...(detalle.imagenReferencia && { imagenReferencia: detalle.imagenReferencia }),
            ...(detalle.observaciones    && { observaciones:    detalle.observaciones }),
          }
        ]
      };

      const { data } = await apiClient.post(`${ENDPOINT}`, payload);
      return data.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message || "Error al registrar cotización como Staff");
    }
  }

  // Flujo CLIENTE: Editar antes de ser cotizada.
  // El backend exige idDetalleCotizacion dentro del detalle para el updateMany.
  async updateAsClient(id, quoteData) {
    try {
      const detalle = quoteData.detalles?.[0];

      if (!detalle) {
        throw new Error("No se encontró el detalle a actualizar.");
      }

      if (!detalle.idDetalleCotizacion && !detalle.idDetalle) {
        throw new Error("El detalle no tiene idDetalleCotizacion. No se puede editar.");
      }

      const payload = {
        detalles: [
          {
            idDetalleCotizacion: Number(detalle.idDetalleCotizacion || detalle.idDetalle),
            idTecnica: Number(detalle.idTecnica),
            descripcion: detalle.descripcion?.trim(),
            cantidad: Number(detalle.cantidad),
            ...(detalle.imagenReferencia && { imagenReferencia: detalle.imagenReferencia }),
            ...(detalle.observaciones    && { observaciones:    detalle.observaciones }),
          }
        ]
      };

      const { data } = await apiClient.patch(`${ENDPOINT}/${id}/cliente`, payload);
      return data.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message || "No se pudo actualizar la solicitud");
    }
  }

  // Flujo EMPLEADO: Asignar precios y pasar a estado COTIZADA
  async assignPrices(id, pricingData) {
    try {
      const detalle = pricingData.detalles?.[0];

      if (!detalle) {
        throw new Error("No se encontró el detalle para cotizar.");
      }

      const payload = {
        costosAdicionales: Number(pricingData.costosAdicionales || 0),
        ...(pricingData.observaciones && { observaciones: pricingData.observaciones }),
        detalles: [
          {
            idDetalleCotizacion: Number(detalle.idDetalleCotizacion),
            precioUnitario: Number(detalle.precioUnitario || 0),
            costoDiseno: Number(detalle.costoDiseno || 0),
            ...(detalle.observaciones && { observaciones: detalle.observaciones }),
          }
        ]
      };

      const { data } = await apiClient.patch(`${ENDPOINT}/${id}/cotizar`, payload);
      return data.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message || "Error al asignar precios");
    }
  }

  // Acciones de Cambio de Estado (PATCH unificados)
  async approve(id) {
    const { data } = await apiClient.patch(`${ENDPOINT}/${id}/aprobar`);
    return data;
  }

  async reject(id) {
    const { data } = await apiClient.patch(`${ENDPOINT}/${id}/rechazar`);
    return data;
  }

  async cancel(id) {
    const { data } = await apiClient.patch(`${ENDPOINT}/${id}/anular`);
    return data;
  }
}