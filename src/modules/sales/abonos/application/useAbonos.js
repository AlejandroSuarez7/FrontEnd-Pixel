/* eslint-disable react-hooks/set-state-in-effect, react-hooks/use-memo, react-hooks/exhaustive-deps */
import { useCallback, useEffect, useState } from 'react';
import { abonoRepository } from '../infrastructure/abono.repository';

export const useAbonos = (filters = {}) => {
  const [abonos, setAbonos] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchAbonos = useCallback(async () => {
    setLoading(true);
    try {
      const data = await abonoRepository.list(filters);
      setAbonos(data);
    } catch (error) {
      console.error('Error en useAbonos al listar:', error);
      setAbonos([]);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => {
    fetchAbonos();
  }, [fetchAbonos]);

  const handleCreate = async (abonoData) => {
    await abonoRepository.create(abonoData);
    await fetchAbonos();
  };

  const handleUpdate = async (idAbono, abonoData) => {
    await abonoRepository.update(idAbono, abonoData);
    await fetchAbonos();
  };

  const handleConfirm = async (idAbono, payload) => {
    const result = await abonoRepository.confirm(idAbono, payload);
    await fetchAbonos();
    return result;
  };

  const handleReject = async (idAbono, motivoRechazo) => {
    await abonoRepository.reject(idAbono, motivoRechazo);
    await fetchAbonos();
  };

  const handleDelete = async (idAbono) => {
    await abonoRepository.remove(idAbono);
    await fetchAbonos();
  };

  const getPedido = useCallback((idPedido) => abonoRepository.getPedido(idPedido), []);
  const getAbonosByPedido = useCallback((idPedido) => abonoRepository.listByPedido(idPedido), []);
  const getPedidos = useCallback((pedidoFilters) => abonoRepository.listPedidos(pedidoFilters), []);

  return {
    abonos,
    loading,
    refetch: fetchAbonos,
    handleCreate,
    handleUpdate,
    handleConfirm,
    handleReject,
    handleDelete,
    getPedido,
    getAbonosByPedido,
    getPedidos,
  };
};
