import { useCallback } from 'react';
import { useLatestListRequest } from '../../../../core/hooks/useLatestListRequest';
import { compraRepository } from '../infrastructure/compra.repository';

const EMPTY_SUMMARY = { totalCompras: 0, cantidadCompras: 0, porEstado: {} };

export const useCompras = (filters = {}, options = {}) => {
  const onlyDesigner = Boolean(options.onlyDesigner);
  const queryKey = JSON.stringify({ ...filters, onlyDesigner });
  const {
    data,
    loading,
    refreshing,
    error,
    refetch: fetchCompras,
  } = useLatestListRequest({
    queryKey,
    load: async (signal) => {
      if (onlyDesigner) {
        return {
          compras: await compraRepository.listForDesigner({ signal }),
          resumen: EMPTY_SUMMARY,
        };
      }

      const [compras, resumen] = await Promise.all([
        compraRepository.list(filters, { signal }),
        compraRepository.getResumen(filters, { signal }),
      ]);
      return { compras, resumen };
    },
    initialData: { compras: [], resumen: EMPTY_SUMMARY },
  });

  const handleCreate = async (compraData) => {
    await compraRepository.create(compraData);
    await fetchCompras();
  };

  const handleUpdate = async (idCompra, compraData) => {
    await compraRepository.update(idCompra, compraData);
    await fetchCompras();
  };

  const handleConfirm = async (idCompra) => {
    const result = await compraRepository.confirm(idCompra);
    await fetchCompras();
    return result;
  };

  const handleCancel = async (idCompra, observaciones) => {
    await compraRepository.cancel(idCompra, observaciones);
    await fetchCompras();
  };

  const handleDelete = async (idCompra) => {
    await compraRepository.remove(idCompra);
    await fetchCompras();
  };

  const getPedidos = useCallback(() => compraRepository.listPedidos(), []);
  const getProveedoresActivos = useCallback(() => compraRepository.listProveedoresActivos(), []);

  return {
    compras: data.compras,
    resumen: data.resumen,
    loading,
    refreshing,
    error,
    refetch: fetchCompras,
    handleCreate,
    handleUpdate,
    handleConfirm,
    handleCancel,
    handleDelete,
    getPedidos,
    getProveedoresActivos,
  };
};
