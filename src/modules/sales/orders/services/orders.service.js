import { jsPDF } from 'jspdf';
import { ordersMock } from '../mock/orders.mock.js';
import { ORDER_STATUS } from '../constants/orderStatus.js';
import { calculateOrderTotals, cloneOrder } from '../utils/orderUtils.js';

const delay = (ms = 500) => new Promise((resolve) => setTimeout(resolve, ms));
let currentOrders = ordersMock.map((order) => cloneOrder(order));

const filterOrders = (orders, filters) => {
  return orders.filter((order) => {
    const search = filters.search?.trim().toLowerCase() || '';
    const status = filters.status || '';
    const hasSearch =
      !search ||
      order.orderNumber.toLowerCase().includes(search) ||
      order.clientName.toLowerCase().includes(search);
    const hasStatus = !status || order.status === status;
    const hasDateRange = (() => {
      if (!filters.dateRange?.length) return true;
      const [from, to] = filters.dateRange;
      const orderDate = new Date(order.date).setHours(0, 0, 0, 0);
      return orderDate >= new Date(from).setHours(0, 0, 0, 0) && orderDate <= new Date(to).setHours(0, 0, 0, 0);
    })();

    return hasSearch && hasStatus && hasDateRange;
  });
};

export const ordersService = {
  async listOrders(filters = {}) {
    await delay(700);
    const sorted = [...currentOrders].sort((a, b) => new Date(b.date) - new Date(a.date));
    return filterOrders(sorted, filters);
  },

  async getOrder(orderNumber) {
    await delay(450);
    return cloneOrder(currentOrders.find((order) => order.orderNumber === orderNumber));
  },

  async createOrder(payload) {
    await delay(800);
    const orderNumber = payload.orderNumber || `PED-${Date.now()}`;
    const totals = calculateOrderTotals(payload.products || []);
    const nextOrder = {
      ...payload,
      orderNumber,
      status: ORDER_STATUS.PENDING,
      date: payload.date || new Date().toISOString().split('T')[0],
      total: payload.total != null ? Number(payload.total) : totals.total,
      itemCount: totals.quantity || 1,
      createdAt: new Date().toISOString(),
      products: (payload.products || []).map((product) => ({ ...product })),
    };
    currentOrders = [nextOrder, ...currentOrders];
    return cloneOrder(nextOrder);
  },

  async updateOrder(orderNumber, payload) {
    await delay(700);
    const index = currentOrders.findIndex((order) => order.orderNumber === orderNumber);
    if (index < 0) {
      throw new Error('Pedido no encontrado');
    }
    const totals = calculateOrderTotals(payload.products || []);
    currentOrders[index] = {
      ...currentOrders[index],
      ...payload,
      total: payload.total != null ? Number(payload.total) : totals.total,
      itemCount: totals.quantity || currentOrders[index].itemCount,
      products: (payload.products || currentOrders[index].products || []).map((product) => ({ ...product })),
    };
    return cloneOrder(currentOrders[index]);
  },

  async cancelOrder(orderNumber, reason) {
    await delay(600);
    const order = currentOrders.find((item) => item.orderNumber === orderNumber);
    if (!order) {
      throw new Error('Pedido no encontrado');
    }
    if (![ORDER_STATUS.PENDING, ORDER_STATUS.PROCESSING].includes(order.status)) {
      throw new Error('Solo se pueden anular pedidos Pendiente o En proceso');
    }
    order.status = ORDER_STATUS.CANCELED;
    order.cancellationReason = reason;
    return cloneOrder(order);
  },

  async exportOrderPdf(order) {
    await delay(300);

    const doc = new jsPDF({ unit: 'pt' });
    const margin = 40;
    doc.setFontSize(16);
    doc.text(`Pedido ${order.orderNumber}`, margin, 60);
    doc.setFontSize(11);
    doc.text(`Cliente: ${order.clientName}`, margin, 90);
    doc.text(`Email: ${order.email}`, margin, 110);
    doc.text(`Fecha: ${order.createdAt}`, margin, 130);
    doc.text(`Estado: ${order.status}`, margin, 150);
    doc.text(`Total: $${order.total.toFixed(2)}`, margin, 170);
    doc.text('Productos:', margin, 200);

    const headers = ['Producto', 'Cantidad', 'Precio', 'Subtotal'];
    const rows = (order.products || []).map((product) => [product.nombreProducto, product.cantidad.toString(), `$${product.precio.toFixed(2)}`, `$${product.subtotal.toFixed(2)}`]);

    rows.forEach((row, index) => {
      const y = 220 + index * 20;
      row.forEach((cell, cellIndex) => {
        doc.text(cell, margin + cellIndex * 130, y);
      });
    });

    doc.text('Observaciones:', margin, 260 + (rows.length * 20));
    doc.text(order.notes || 'Sin observaciones', margin, 280 + (rows.length * 20));

    const blob = doc.output('blob');
    return {
      fileName: `pedido_${order.orderNumber}.pdf`,
      blob,
    };
  },
};
