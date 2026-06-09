import { apiClient } from '../../../core/services/apiService';

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

const normalizeText = (value = '') =>
  String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const isClientRole = (user) => normalizeText(user?.nombreRol || user?.rol?.nombre || user?.role).includes('cliente');

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

const buildClientTracking = (pedidoActivo) => {
  const state = pedidoActivo?.estadoPedido || '';

  return {
    activeOrder: pedidoActivo ? `Pedido PX-${pedidoActivo.idPedido}` : 'Sin pedido activo',
    steps: [
      { label: 'Diseño aprobado', completed: Boolean(pedidoActivo) },
      { label: 'Producción', completed: state === 'EN_PROCESO' || state === 'FINALIZADO' },
      { label: 'Control de calidad', completed: state === 'FINALIZADO' },
      { label: 'Entrega', completed: state === 'FINALIZADO' && pedidoActivo?.estadoPago === 'COMPLETO' },
    ],
  };
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
    tracking: buildClientTracking(payload.pedidoActivo),
    history: buildLatestOrders(payload.historialPedidos).map(({ number, date, status }) => ({ number, date, status })),
    quotes: payload.cotizacionesPendientes || [],
  };
};

export const dashboardRepository = {
  async getDashboardData(user) {
    const isClient = isClientRole(user);
    const endpoint = isClient ? 'api/dashboard/cliente' : 'api/dashboard/admin';
    const params = isClient ? { limite: 5 } : { anio: currentYear, ultimos: 5 };

    const { data } = await apiClient.get(endpoint, { params });
    const payload = data.data || {};

    return isClient
      ? { client: adaptClientDashboard(payload) }
      : { admin: adaptAdminDashboard(payload) };
  },
};
