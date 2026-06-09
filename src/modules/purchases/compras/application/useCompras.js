import { useCallback, useEffect, useState } from 'react';
import { compraRepository } from '../infrastructure/compra.repository';

export const useCompras = (filters = {}, options = {}) => {
  const [compras, setCompras] = useState([]);
  const [resumen, setResumen] = useState({ totalCompras: 0, cantidadCompras: 0, porEstado: {} });
  const [loading, setLoading] = useState(false);

  const fetchCompras = useCallback(async () => {
    setLoading(true);
    try {
      const data = options.onlyDesigner ? await compraRepository.listForDesigner() : await compraRepository.list(filters);
      setCompras(data);
      if (!options.onlyDesigner) {
        setResumen(await compraRepository.getResumen(filters));
      }
    } catch (error) {
      console.error('Error en useCompras al listar:', error);
      setCompras([]);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters), options.onlyDesigner]);

  useEffect(() => {
    fetchCompras();
  }, [fetchCompras]);

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
    compras,
    resumen,
    loading,
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
