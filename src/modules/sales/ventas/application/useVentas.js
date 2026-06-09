import { useCallback, useEffect, useState } from 'react';
import { ventaRepository } from '../infrastructure/venta.repository';

export const useVentas = (filters = {}) => {
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
        ventaRepository.list(filters),
        ventaRepository.getResumen(filters),
      ]);
      setVentas(ventasData);
      setResumen(resumenData);
    } catch (error) {
      console.error('Error en useVentas al listar:', error);
      setVentas([]);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]);

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
