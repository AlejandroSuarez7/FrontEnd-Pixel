import { apiClient } from '../../../../core/services/apiService.js';
import { ventaDTO } from './adapters/venta.dto.js';

const ENDPOINT = 'api/ventas';

const getItems = (data) => data.data || data.ventas || data || [];

export class VentaApiRepository {
  async list(filters = {}, options = {}) {
    const normalizedFilters = {
      search: filters.search?.trim() || '',
      fechaInicio: filters.fechaInicio || '',
      fechaFin: filters.fechaFin || '',
      idCliente: filters.idCliente || '',
      estadoPago: filters.estadoPago || '',
    };

    if (normalizedFilters.search) {
      const { data } = await apiClient.get(`${ENDPOINT}/buscar`, {
        params: { termino: normalizedFilters.search },
        signal: options.signal,
      });
      return this.applyLocalFilters(ventaDTO.fromApiList(getItems(data)), normalizedFilters);
    }

    const params = {};
    if (normalizedFilters.fechaInicio) params.fechaInicio = normalizedFilters.fechaInicio;
    if (normalizedFilters.fechaFin) params.fechaFin = normalizedFilters.fechaFin;
    if (normalizedFilters.idCliente) params.idCliente = normalizedFilters.idCliente;
    if (normalizedFilters.estadoPago) params.estadoPago = normalizedFilters.estadoPago;

    const { data } = await apiClient.get(ENDPOINT, { params, signal: options.signal });
    return ventaDTO.fromApiList(getItems(data));
  }

  applyLocalFilters(items, filters) {
    return items.filter(item => {
      const fecha = item.fechaFinalizado ? new Date(item.fechaFinalizado) : null;
      const desde = filters.fechaInicio ? new Date(`${filters.fechaInicio}T00:00:00`) : null;
      const hasta = filters.fechaFin ? new Date(`${filters.fechaFin}T23:59:59.999`) : null;

      return (
        (!filters.idCliente || Number(item.idCliente) === Number(filters.idCliente)) &&
        (!filters.estadoPago || item.estadoPago === filters.estadoPago) &&
        (!desde || (fecha && fecha >= desde)) &&
        (!hasta || (fecha && fecha <= hasta))
      );
    });
  }

  async getResumen(filters = {}, options = {}) {
    const normalizedFilters = {
      fechaInicio: filters.fechaInicio || '',
      fechaFin: filters.fechaFin || '',
    };

    if (normalizedFilters.fechaInicio && normalizedFilters.fechaFin) {
      const { data } = await apiClient.get(`${ENDPOINT}/resumen-periodo`, {
        params: {
          fechaInicio: normalizedFilters.fechaInicio,
          fechaFin: normalizedFilters.fechaFin,
        },
        signal: options.signal,
      });
      return {
        totalVentas: data.data?.totalVentas || 0,
        cantidadVentas: data.data?.cantidadVentas || 0,
        ticketPromedio: data.data?.ticketPromedio || 0,
        ventasPagadasCompletas: 0,
        ventasPagadasParciales: 0,
      };
    }

    const { data } = await apiClient.get(`${ENDPOINT}/resumen`, { signal: options.signal });
    return data.data || {
        totalVentas: 0,
        cantidadVentas: 0,
        ticketPromedio: 0,
        ventasPagadasCompletas: 0,
        ventasPagadasParciales: 0,
    };
  }
}

export const ventaRepository = new VentaApiRepository();
