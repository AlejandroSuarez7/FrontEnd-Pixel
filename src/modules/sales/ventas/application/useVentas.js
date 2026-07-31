import { useLatestListRequest } from '../../../../core/hooks/useLatestListRequest';
import { ventaRepository } from '../infrastructure/venta.repository';

export const useVentas = (filters = {}) => {
  const initialData = {
    ventas: [],
    resumen: {
    totalVentas: 0,
    cantidadVentas: 0,
    ticketPromedio: 0,
    ventasPagadasCompletas: 0,
    ventasPagadasParciales: 0,
    },
  };
  const queryKey = JSON.stringify(filters);
  const {
    data,
    loading,
    refreshing,
    error,
    refetch: fetchVentas,
  } = useLatestListRequest({
    queryKey,
    load: async (signal) => {
      const [ventas, resumen] = await Promise.all([
        ventaRepository.list(filters, { signal }),
        ventaRepository.getResumen(filters, { signal }),
      ]);
      return { ventas, resumen };
    },
    initialData,
  });

  return {
    ventas: data.ventas,
    resumen: data.resumen,
    loading,
    refreshing,
    error,
    refetch: fetchVentas,
  };
};
