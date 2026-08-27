import { useCallback } from 'react';
import { useLatestListRequest } from '../../../../core/hooks/useLatestListRequest';
import { disenoRepository } from '../infrastructure/diseno.repository';

export const useDisenos = (filters = {}) => {
  const queryKey = JSON.stringify(filters);
  const {
    data: disenos,
    loading,
    refreshing,
    error,
    refetch: fetchDisenos,
  } = useLatestListRequest({
    queryKey,
    load: (signal) => disenoRepository.list(filters, { signal }),
    initialData: [],
  });

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
  const getRequerimientosDiseno = useCallback(
    (idPedido, options) => disenoRepository.getRequerimientosDiseno(idPedido, options),
    [],
  );

  return {
    disenos,
    loading,
    refreshing,
    error,
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
    getRequerimientosDiseno,
  };
};
