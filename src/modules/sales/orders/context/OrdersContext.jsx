import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { notification } from 'antd';
import { ordersService } from '../services/orders.service.js';
import { ORDER_STATUS_OPTIONS } from '../constants/orderStatus.js';
import { useDebounce } from '../hooks/useDebounce.js';

const OrdersContext = createContext();

export const OrdersProvider = ({ children }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filters, setFilters] = useState({ search: '', status: '', dateRange: [] });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [formMode, setFormMode] = useState('create');
  const [editingOrder, setEditingOrder] = useState(null);
  const [ordersEmpty, setOrdersEmpty] = useState(false);

  const debouncedSearch = useDebounce(filters.search, 500);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const result = await ordersService.listOrders(filters);
      setOrders(result);
      setOrdersEmpty(result.length === 0);
    } catch (error) {
      notification.error({ message: 'Error al cargar pedidos', description: error.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [debouncedSearch, filters.status, filters.dateRange]);

  const handleChangeFilters = (changedFilters) => {
    setFilters((current) => ({ ...current, ...changedFilters }));
  };

  const handleResetFilters = () => {
    setFilters({ search: '', status: '', dateRange: [] });
  };

  const openNewOrderDrawer = () => {
    setFormMode('create');
    setEditingOrder(null);
    setDrawerOpen(true);
  };

  const openEditOrderModal = async (orderNumber) => {
    setSubmitting(true);
    try {
      const order = await ordersService.getOrder(orderNumber);
      setEditingOrder(order);
      setFormMode('edit');
      setModalOpen(true);
    } catch (error) {
      notification.error({ message: 'Error al cargar pedido', description: error.message });
    } finally {
      setSubmitting(false);
    }
  };

  const closeOrderDrawer = () => {
    setDrawerOpen(false);
    setEditingOrder(null);
  };

  const closeOrderModal = () => {
    setModalOpen(false);
    setEditingOrder(null);
  };

  const openOrderDetail = async (orderNumber) => {
    setSubmitting(true);
    try {
      const order = await ordersService.getOrder(orderNumber);
      setSelectedOrder(order);
      setDetailOpen(true);
    } catch (error) {
      notification.error({ message: 'Error al cargar detalle', description: error.message });
    } finally {
      setSubmitting(false);
    }
  };

  const closeOrderDetail = () => {
    setDetailOpen(false);
    setSelectedOrder(null);
  };

  const createOrder = async (payload) => {
    setSubmitting(true);
    try {
      await ordersService.createOrder(payload);
      notification.success({ message: 'Pedido creado', description: 'El pedido se ha guardado correctamente.' });
      closeOrderDrawer();
      loadOrders();
    } catch (error) {
      notification.error({ message: 'Error al crear pedido', description: error.message });
    } finally {
      setSubmitting(false);
    }
  };

  const updateOrder = async (orderNumber, payload) => {
    setSubmitting(true);
    try {
      await ordersService.updateOrder(orderNumber, payload);
      notification.success({ message: 'Pedido actualizado', description: 'Los cambios se guardaron correctamente.' });
      closeOrderDrawer();
      loadOrders();
    } catch (error) {
      notification.error({ message: 'Error al actualizar pedido', description: error.message });
    } finally {
      setSubmitting(false);
    }
  };

  const cancelOrder = async (orderNumber, reason) => {
    setSubmitting(true);
    try {
      await ordersService.cancelOrder(orderNumber, reason);
      notification.success({ message: 'Pedido anulado', description: 'El pedido fue anulado correctamente.' });
      closeOrderDetail();
      loadOrders();
    } catch (error) {
      notification.error({ message: 'Error al anular pedido', description: error.message });
    } finally {
      setSubmitting(false);
    }
  };

  const exportOrder = async (order) => {
    setSubmitting(true);
    try {
      const { fileName, blob } = await ordersService.exportOrderPdf(order);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      notification.success({ message: 'Exportación lista', description: 'Se descargó el pedido correctamente.' });
    } catch (error) {
      notification.error({ message: 'Error al exportar', description: error.message });
    } finally {
      setSubmitting(false);
    }
  };

  const value = useMemo(
    () => ({
      orders,
      loading,
      submitting,
      filters,
      ordersEmpty,
      drawerOpen,
      modalOpen,
      detailOpen,
      selectedOrder,
      formMode,
      editingOrder,
      statusOptions: ORDER_STATUS_OPTIONS,
      handleChangeFilters,
      handleResetFilters,
      openNewOrderDrawer,
      closeOrderDrawer,
      openEditOrderModal,
      closeOrderModal,
      openOrderDetail,
      closeOrderDetail,
      createOrder,
      updateOrder,
      cancelOrder,
      exportOrder,
      loadOrders,
    }),
    [orders, loading, submitting, filters, ordersEmpty, drawerOpen, detailOpen, selectedOrder, formMode, editingOrder]
  );

  return <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>;
};

export const useOrdersContext = () => {
  const context = useContext(OrdersContext);
  if (!context) throw new Error('useOrdersContext debe usarse dentro de OrdersProvider');
  return context;
};
