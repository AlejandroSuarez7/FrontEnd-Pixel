import { apiClient } from '../../../../core/services/apiService.js';
import { ventaDTO } from './adapters/venta.dto.js';

const ENDPOINT = 'api/ventas';
const CACHE_TTL = 5000;

const getItems = (data) => data.data || data.ventas || data || [];
const cache = new Map();

const createKey = (scope, filters = {}) => `${scope}:${JSON.stringify(filters)}`;

const getCachedOrFetch = async (key, fetcher) => {
  const now = Date.now();
  const cached = cache.get(key);

  if (cached && now - cached.createdAt < CACHE_TTL) {
    return cached.promise;
  }

  const promise = fetcher().catch(error => {
    cache.delete(key);
    throw error;
  });

  cache.set(key, { createdAt: now, promise });
  return promise;
};

export class VentaApiRepository {
  async list(filters = {}) {
    try {
      const normalizedFilters = {
        search: filters.search?.trim() || '',
        fechaInicio: filters.fechaInicio || '',
        fechaFin: filters.fechaFin || '',
        idCliente: filters.idCliente || '',
        estadoPago: filters.estadoPago || '',
      };
      const key = createKey('ventas-list', normalizedFilters);

      return await getCachedOrFetch(key, async () => {
      if (normalizedFilters.search) {
        const { data } = await apiClient.get(`${ENDPOINT}/buscar`, {
          params: { termino: normalizedFilters.search },
        });
        return this.applyLocalFilters(ventaDTO.fromApiList(getItems(data)), normalizedFilters);
      }

      const params = {};
      if (normalizedFilters.fechaInicio) params.fechaInicio = normalizedFilters.fechaInicio;
      if (normalizedFilters.fechaFin) params.fechaFin = normalizedFilters.fechaFin;
      if (normalizedFilters.idCliente) params.idCliente = normalizedFilters.idCliente;
      if (normalizedFilters.estadoPago) params.estadoPago = normalizedFilters.estadoPago;

      const { data } = await apiClient.get(ENDPOINT, { params });
      return ventaDTO.fromApiList(getItems(data));
      });
    } catch (error) {
      console.error('Error al listar ventas:', error);
      return [];
    }
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

  async getResumen(filters = {}) {
    try {
      const normalizedFilters = {
        fechaInicio: filters.fechaInicio || '',
        fechaFin: filters.fechaFin || '',
      };
      const key = createKey('ventas-resumen', normalizedFilters);

      return await getCachedOrFetch(key, async () => {
      if (normalizedFilters.fechaInicio && normalizedFilters.fechaFin) {
        const { data } = await apiClient.get(`${ENDPOINT}/resumen-periodo`, {
          params: {
            fechaInicio: normalizedFilters.fechaInicio,
            fechaFin: normalizedFilters.fechaFin,
          },
        });
        return {
          totalVentas: data.data?.totalVentas || 0,
          cantidadVentas: data.data?.cantidadVentas || 0,
          ticketPromedio: data.data?.ticketPromedio || 0,
          ventasPagadasCompletas: 0,
          ventasPagadasParciales: 0,
        };
      }

      const { data } = await apiClient.get(`${ENDPOINT}/resumen`);
      return data.data || {
        totalVentas: 0,
        cantidadVentas: 0,
        ticketPromedio: 0,
        ventasPagadasCompletas: 0,
        ventasPagadasParciales: 0,
      };
      });
    } catch (error) {
      console.error('Error al consultar resumen de ventas:', error);
      return {
        totalVentas: 0,
        cantidadVentas: 0,
        ticketPromedio: 0,
        ventasPagadasCompletas: 0,
        ventasPagadasParciales: 0,
      };
    }
  }
}

export const ventaRepository = new VentaApiRepository();
