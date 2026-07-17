import { apiClient } from '../../../core/services/apiService';
import { isClientUser } from '../../../core/utils/permissions';

const currentYear = new Date().getFullYear();

const toNumber = (value) => Number(value || 0);

const currencyCompact = (value) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
    notation: 'compact',
  }).format(toNumber(value));

const formatShortDate = (value) => {
  if (!value) return 'Sin fecha';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

const buildRevenue = (ingresos = {}) => ({
  daily: {
    label: 'Diario',
    value: currencyCompact(ingresos.diario),
    detail: 'Ingresos confirmados hoy',
  },
  monthly: {
    label: 'Mensual',
    value: currencyCompact(ingresos.mensual),
    detail: 'Ingresos confirmados este mes',
  },
  yearly: {
    label: 'Anual',
    value: currencyCompact(ingresos.anual),
    detail: `Ingresos confirmados ${currentYear}`,
  },
});

const buildMonthlySales = (ventasPorMes = []) =>
  ventasPorMes.map((item) => ({
    month: item.mes,
    orders: toNumber(item.cantidadPedidos),
    revenue: Math.round(toNumber(item.total) / 1000000),
  }));

const buildOrderStatus = (distribucion = {}) => [
  { label: 'Pendiente', value: toNumber(distribucion.PENDIENTE), color: '#e17b00' },
  { label: 'En producción', value: toNumber(distribucion.EN_PROCESO), color: '#0984e3' },
  { label: 'Terminado', value: toNumber(distribucion.FINALIZADO), color: '#6c5ce7' },
];

const buildLatestOrders = (pedidos = []) =>
  pedidos.map((pedido) => ({
    number: `PX-${pedido.idPedido}`,
    customer: pedido.cliente?.nombre || 'Cliente',
    date: formatShortDate(pedido.fechaCreacion),
    status: pedido.estadoPedido || 'PENDIENTE',
  }));

const buildPendingQuotesList = (cotizaciones = []) =>
  cotizaciones.map((quote) => ({
    number: `CT-${quote.idCotizacion}`,
    customer: quote.cliente?.nombre || 'Cliente',
    date: formatShortDate(quote.fechaCreacion),
    status: quote.estado || 'PENDIENTE',
  }));

const normalizeStatus = (value = '') => String(value || '').toUpperCase();

const getOrderDesign = (pedido = {}) => pedido.diseno || pedido.disenos?.[0] || null;

const hasConfirmedPayment = (pedido = {}) => {
  const estadoPago = normalizeStatus(pedido.estadoPago);
  const abonos = Array.isArray(pedido.abonos) ? pedido.abonos : [];

  return ['ABONADO', 'PARCIAL', 'COMPLETO', 'PAGADO'].includes(estadoPago) ||
    abonos.some((abono) => normalizeStatus(abono.estado).includes('CONFIRM'));
};

const hasFinalPaymentPending = (pedido = {}) => {
  const estadoPago = normalizeStatus(pedido.estadoPago);
  const saldo = Number(pedido.saldoPendiente ?? pedido.saldo ?? 0);

  return estadoPago === 'PARCIAL' || saldo > 0;
};

const isOrderFinalized = (pedido = {}) => ['FINALIZADO', 'TERMINADO'].includes(normalizeStatus(pedido.estadoPedido));

const buildClientTrackingSteps = (pedido = {}) => {
  const estadoPedido = normalizeStatus(pedido.estadoPedido);
  const diseno = getOrderDesign(pedido);
  const estadoDiseno = normalizeStatus(diseno?.estado || pedido.estadoDiseno);
  const firstPaymentConfirmed = hasConfirmedPayment(pedido);
  const inProduction = ['EN_PROCESO', 'PRODUCCION', 'EN_PRODUCCION', 'FINALIZADO', 'TERMINADO'].includes(estadoPedido);
  const finalized = isOrderFinalized(pedido);
  const finalPaymentPending = hasFinalPaymentPending(pedido);
  const readyToDeliver = finalized && !finalPaymentPending;
  const delivered = ['ENTREGADO', 'RECLAMADO'].includes(estadoPedido);
  const designWaitingApproval = ['PENDIENTE_APROBACION', 'POR_APROBAR', 'EN_REVISION'].includes(estadoDiseno);
  const designApproved = ['APROBADO', 'APROBADA', 'PRODUCCION'].includes(estadoDiseno) || inProduction || finalized;

  const steps = [
    { label: 'Cotizacion aceptada', completed: Boolean(pedido.idPedido) },
    { label: 'Pendiente de primer abono', completed: firstPaymentConfirmed, current: !firstPaymentConfirmed },
    { label: 'Primer abono confirmado', completed: firstPaymentConfirmed },
    {
      label: 'Diseno en proceso',
      completed: designWaitingApproval || designApproved || inProduction || finalized,
      current: firstPaymentConfirmed && !designWaitingApproval && !designApproved && !inProduction && !finalized,
    },
    {
      label: 'Diseno pendiente de aprobacion',
      completed: designApproved || inProduction || finalized,
      current: designWaitingApproval && !designApproved,
    },
    { label: 'En produccion', completed: finalized, current: inProduction && !finalized },
    { label: 'Pendiente de segundo abono / saldo final', completed: readyToDeliver, current: finalized && finalPaymentPending },
    { label: 'Pedido finalizado', completed: readyToDeliver, current: finalized && !readyToDeliver },
    { label: 'Listo para reclamar / entregar', completed: delivered, current: readyToDeliver && !delivered },
  ];

  const currentIndex = steps.findIndex((step) => step.current);
  const fallbackCurrentIndex = currentIndex === -1 ? steps.findIndex((step) => !step.completed) : currentIndex;

  return steps.map((step, index) => ({
    label: step.label,
    state: step.completed
      ? 'completed'
      : index === fallbackCurrentIndex
        ? 'current'
        : 'pending',
  }));
};

const buildClientActiveOrder = (pedido = {}) => ({
  id: String(pedido.idPedido),
  number: `PX-${pedido.idPedido}`,
  date: formatShortDate(pedido.fechaCreacion),
  status: pedido.estadoPedido || 'PENDIENTE',
  total: toNumber(pedido.total),
  balance: toNumber(pedido.saldoPendiente ?? pedido.saldo),
  tracking: buildClientTrackingSteps(pedido),
});

const buildClientActiveOrders = (payload = {}) => {
  const activeOrders = payload.pedidosActivos || payload.pedidosEnProceso || payload.activeOrders;

  if (Array.isArray(activeOrders)) {
    return activeOrders.map(buildClientActiveOrder).filter((order) => order.id !== 'undefined');
  }

  return payload.pedidoActivo?.idPedido ? [buildClientActiveOrder(payload.pedidoActivo)] : [];
};
const adaptAdminDashboard = (payload) => {
  const kpis = payload.kpis || {};
  const cotizacionesPendientes = payload.cotizacionesPendientes || [];

  return {
    kpis: [
      {
        label: 'Pedidos pendientes',
        value: String(toNumber(kpis.pedidosPendientes)),
        detail: `${toNumber(kpis.pedidosEnProceso)} en producción`,
        iconKey: 'clock',
        tone: 'warning',
      },
      {
        label: 'Total clientes',
        value: String(toNumber(kpis.totalClientes)),
        detail: 'Clientes activos registrados',
        iconKey: 'users',
        tone: 'info',
      },
    ],
    pendingQuotes: {
      value: toNumber(kpis.cotizacionesPendientes),
      readyToPrice: cotizacionesPendientes.length,
      waitingClient: 0,
    },
    pendingQuotesList: buildPendingQuotesList(cotizacionesPendientes),
    revenue: buildRevenue(payload.ingresos),
    monthlySales: buildMonthlySales(payload.ventasPorMes),
    orderStatus: buildOrderStatus(payload.distribucionPedidos),
    latestOrders: buildLatestOrders(payload.ultimosPedidos),
  };
};

const adaptClientDashboard = (payload) => {
  const kpis = payload.kpis || {};
  const activeOrders = buildClientActiveOrders(payload);

  return {
    kpis: [
      {
        label: 'Total de mis pedidos',
        value: String(toNumber(kpis.totalPedidos)),
        detail: `${toNumber(kpis.pedidosEnProceso)} en producción`,
        iconKey: 'shopping',
        tone: 'violet',
      },
      {
        label: 'Mis pedidos pendientes',
        value: String(toNumber(kpis.pedidosPendientes)),
        detail: `${toNumber(kpis.cotizacionesPendientes)} cotizaciones pendientes`,
        iconKey: 'clock',
        tone: 'amber',
      },
      {
        label: 'Mis pedidos entregados',
        value: String(toNumber(kpis.pedidosFinalizados)),
        detail: `${currencyCompact(kpis.saldoPendiente)} por pagar`,
        iconKey: 'truck',
        tone: 'green',
      },
    ],
    activeOrders,
    history: buildLatestOrders(payload.historialPedidos).map(({ number, date, status }) => ({ number, date, status })),
    quotes: payload.cotizacionesPendientes || [],
  };
};

export const dashboardRepository = {
  async getDashboardData(user, permissions = []) {
    const isClient = isClientUser(user, permissions.length > 0 ? permissions : user?.codigos);
    const endpoint = isClient ? 'api/cliente/dashboard' : 'api/dashboard/admin';
    const params = isClient ? { limite: 5 } : { anio: currentYear, ultimos: 5 };

    const { data } = await apiClient.get(endpoint, { params });
    const payload = data.data || {};

    return isClient
      ? { client: adaptClientDashboard(payload) }
      : { admin: adaptAdminDashboard(payload) };
  },
};
