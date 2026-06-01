// pedidos/application/usePedidos.js
import { useState, useEffect, useCallback } from 'react';
import { pedidoRepository } from '../infrastructure/pedido.repository';

export const usePedidos = (filters = {}) => {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchPedidos = useCallback(async () => {
    setLoading(true);
    try {
      const data = await pedidoRepository.list(filters);
      setPedidos(data);
    } catch (error) {
      console.error('Error en usePedidos al listar:', error);
      setPedidos([]);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => {
    fetchPedidos();
  }, [fetchPedidos]);

  // Crea un pedido desde una cotización aprobada
  const handleCreate = async (pedidoData) => {
    try {
      await pedidoRepository.create(pedidoData);
      await fetchPedidos();
    } catch (error) {
      console.error('Error al crear pedido:', error);
      throw error;
    }
  };

  // Actualiza observaciones y/o fecha estimada
  const handleUpdate = async (id, pedidoData) => {
    try {
      await pedidoRepository.update(id, pedidoData);
      await fetchPedidos();
    } catch (error) {
      console.error(`Error al actualizar pedido #${id}:`, error);
      throw error;
    }
  };

  const handleMarcarEnProceso = async (id) => {
    try {
      await pedidoRepository.marcarEnProceso(id);
      await fetchPedidos();
    } catch (error) {
      console.error(`Error al marcar en proceso pedido #${id}:`, error);
      throw error;
    }
  };

  const handleFinalizar = async (id) => {
    try {
      await pedidoRepository.finalizar(id);
      await fetchPedidos();
    } catch (error) {
      console.error(`Error al finalizar pedido #${id}:`, error);
      throw error;
    }
  };

  const handleAnular = async (id) => {
    try {
      await pedidoRepository.anular(id);
      await fetchPedidos();
    } catch (error) {
      console.error(`Error al anular pedido #${id}:`, error);
      throw error;
    }
  };

  return {
    pedidos,
    loading,
    refetch:            fetchPedidos,
    handleCreate,
    handleUpdate,
    handleMarcarEnProceso,
    handleFinalizar,
    handleAnular,
  };
};