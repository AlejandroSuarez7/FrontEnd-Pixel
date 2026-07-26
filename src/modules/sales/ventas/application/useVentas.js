import { useCallback, useEffect, useMemo, useState } from 'react';
import { ventaRepository } from '../infrastructure/venta.repository';

export const useVentas = (filters = {}) => {
  const { search, fechaInicio, fechaFin, idCliente, estadoPago } = filters;
  const listFilters = useMemo(() => ({
    search,
    fechaInicio,
    fechaFin,
    idCliente,
    estadoPago,
  }), [search, fechaInicio, fechaFin, idCliente, estadoPago]);
  const [ventas, setVentas] = useState([]);
  const [resumen, setResumen] = useState({
    totalVentas: 0,
    cantidadVentas: 0,
    ticketPromedio: 0,
    ventasPagadasCompletas: 0,
    ventasPagadasParciales: 0,
  });
  const [loading, setLoading] = useState(false);

  const fetchVentas = useCallback(async () => {
    setLoading(true);
    try {
      const [ventasData, resumenData] = await Promise.all([
        ventaRepository.list(listFilters),
        ventaRepository.getResumen(listFilters),
      ]);
      setVentas(ventasData);
      setResumen(resumenData);
    } catch (error) {
      console.error('Error en useVentas al listar:', error);
      setVentas([]);
    } finally {
      setLoading(false);
    }
  }, [listFilters]);

  useEffect(() => {
    fetchVentas();
  }, [fetchVentas]);

  return {
    ventas,
    resumen,
    loading,
    refetch: fetchVentas,
  };
};
