/* eslint-disable react-hooks/set-state-in-effect, react-hooks/use-memo, react-hooks/exhaustive-deps */
import { useCallback, useEffect, useState } from 'react';
import { disenoRepository } from '../infrastructure/diseno.repository';

export const useDisenos = (filters = {}) => {
  const [disenos, setDisenos] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchDisenos = useCallback(async () => {
    setLoading(true);
    try {
      const data = await disenoRepository.list(filters);
      setDisenos(data);
    } catch (error) {
      console.error('Error en useDisenos al listar:', error);
      setDisenos([]);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => {
    fetchDisenos();
  }, [fetchDisenos]);

  const handleCreate = async (disenoData) => {
    await disenoRepository.create(disenoData);
    await fetchDisenos();
  };

  const handleUpdate = async (idDiseno, disenoData) => {
    await disenoRepository.update(idDiseno, disenoData);
    await fetchDisenos();
  };

  const handleApprove = async (idDiseno, payload) => {
    const result = await disenoRepository.approve(idDiseno, payload);
    await fetchDisenos();
    return result;
  };

  const handleApproveByClientAdmin = async (idDiseno, payload) => {
    const result = await disenoRepository.approveByClientAdmin(idDiseno, payload);
    await fetchDisenos();
    return result;
  };

  const handleRejectByClientAdmin = async (idDiseno, payload) => {
    const result = await disenoRepository.rejectByClientAdmin(idDiseno, payload);
    await fetchDisenos();
    return result;
  };

  const handleDelete = async (idDiseno) => {
    await disenoRepository.remove(idDiseno);
    await fetchDisenos();
  };

  const getDisenosByPedido = useCallback((idPedido) => disenoRepository.listByPedido(idPedido), []);
  const getPendingProduction = useCallback(() => disenoRepository.listPendingProduction(), []);
  const getPedidos = useCallback((pedidoFilters) => disenoRepository.listPedidos(pedidoFilters), []);

  return {
    disenos,
    loading,
    refetch: fetchDisenos,
    handleCreate,
    handleUpdate,
    handleApprove,
    handleApproveByClientAdmin,
    handleRejectByClientAdmin,
    handleDelete,
    getDisenosByPedido,
    getPendingProduction,
    getPedidos,
  };
};
