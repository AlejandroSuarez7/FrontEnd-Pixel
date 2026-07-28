import { createPaginationMeta } from '../../../../core/utils/serverPagination';
import { useLatestListRequest } from '../../../../core/hooks/useLatestListRequest';
import { pedidoRepository } from '../infrastructure/pedido.repository';

export const usePedidos = (filters = {}) => {
  const queryKey = JSON.stringify(filters);
  const {
    data,
    loading,
    refreshing,
    error,
    refetch: fetchPedidos,
  } = useLatestListRequest({
    queryKey,
    load: (signal) => pedidoRepository.list(filters, { signal }),
    initialData: { items: [], meta: createPaginationMeta() },
  });

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

  const handleUpdateEstimatedDelivery = async (id, fechaEntregaEstimada) => {
    try {
      await pedidoRepository.updateEstimatedDelivery(id, fechaEntregaEstimada);
      await fetchPedidos();
    } catch (error) {
      console.error(`Error al actualizar entrega estimada del pedido #${id}:`, error);
      throw error;
    }
  };

  const handlePendienteSaldo = async (id) => {
    try {
      await pedidoRepository.marcarPendienteSaldo(id);
      await fetchPedidos();
    } catch (error) {
      console.error(`Error al solicitar saldo final pedido #${id}:`, error);
      throw error;
    }
  };

  const handleAnular = async (id, motivoAnulacion) => {
    try {
      await pedidoRepository.anular(id, motivoAnulacion);
      await fetchPedidos();
    } catch (error) {
      console.error(`Error al anular pedido #${id}:`, error);
      throw error;
    }
  };

  const handleConfirmarEntrega = async (id) => {
    try {
      await pedidoRepository.confirmarEntrega(id);
      await fetchPedidos();
    } catch (error) {
      console.error(`Error al confirmar entrega pedido #${id}:`, error);
      throw error;
    }
  };

  const handleActualizarRequiereDiseno = async (idPedido, idDetallePedido, requiereDiseno) => {
    try {
      await pedidoRepository.actualizarRequiereDiseno(idPedido, idDetallePedido, requiereDiseno);
      await fetchPedidos();
    } catch (error) {
      console.error(`Error al actualizar requisito de diseno detalle #${idDetallePedido}:`, error);
      throw error;
    }
  };

  return {
    pedidos: data.items,
    paginationMeta: data.meta,
    loading,
    refreshing,
    error,
    refetch:            fetchPedidos,
    handleCreate,
    handleUpdate,
    handleUpdateEstimatedDelivery,
    handleMarcarEnProceso,
    handlePendienteSaldo,
    handleFinalizar,
    handleAnular,
    handleConfirmarEntrega,
    handleActualizarRequiereDiseno,
  };
};
