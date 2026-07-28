import { apiClient } from '../../../core/services/apiService';
import { isClientUser } from '../../../core/utils/permissions';
import { getDesignCoverageInfo } from '../../../core/utils/designCoverage';

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
  if (!value) return 'Por definir';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Por definir';

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
    revenue: toNumber(item.total),
  }));

const buildOrderStatus = (distribucion = {}) => [
  { label: 'Pendiente', value: toNumber(distribucion.PENDIENTE), color: '#e17b00' },
  { label: 'En producción', value: toNumber(distribucion.EN_PROCESO), color: '#0984e3' },
  { label: 'Terminado', value: toNumber(distribucion.FINALIZADO), color: '#6c5ce7' },
  { label: 'Entregado', value: toNumber(distribucion.ENTREGADO), color: '#00b894' },
];

const buildLatestOrders = (pedidos = []) =>
  pedidos.map((pedido) => ({
    number: `PX-${pedido.idPedido}`,
    customer: pedido.cliente?.nombre || 'Cliente no especificado',
    date: formatShortDate(pedido.fechaCreacion),
    status: pedido.estadoPedido || 'PENDIENTE',
  }));

const buildPendingQuotesList = (cotizaciones = []) =>
  cotizaciones.map((quote) => ({
    number: `CT-${quote.idCotizacion}`,
    customer: quote.cliente?.nombre || 'Cliente no especificado',
    date: formatShortDate(quote.fechaCreacion),
    status: quote.estado || 'PENDIENTE',
  }));

const normalizeStatus = (value = '') => String(value || '').toUpperCase();

const getOrderDesigns = (pedido = {}) => {
  if (Array.isArray(pedido.disenos)) return pedido.disenos;
  if (pedido.diseno) return [pedido.diseno];
  return [];
};

const getRequiredDesignDetails = (pedido = {}) => {
  const detalles = Array.isArray(pedido.detalles) ? pedido.detalles : [];
  return detalles.filter((detalle) => detalle.requiereDiseno !== false);
};

const getDesignProgress = (pedido = {}) => {
  const disenos = getOrderDesigns(pedido);
  const requiredDetails = getRequiredDesignDetails(pedido);
  const hasCentralizedTotals = [
    pedido.totalDisenosRequeridos,
    pedido.totalDisenosAprobados,
    pedido.totalDisenosPendientes,
  ].some(value => value !== null && value !== undefined);
  const coverage = requiredDetails.map(getDesignCoverageInfo);

  if (hasCentralizedTotals) {
    const totalRequired = toNumber(pedido.totalDisenosRequeridos);
    const approvedCount = toNumber(pedido.totalDisenosAprobados);
    const pendingCount = toNumber(pedido.totalDisenosPendientes);
    const hasRejected = coverage.some(item => (
      item.isCorrection
      || item.state.includes('RECHAZADO')
      || item.state.includes('CORRECCIONES')
    ));
    const hasClientDesignPending = coverage.some(item => [
      'PENDIENTE_ARCHIVO_CLIENTE',
      'DISENO_ENTREGADO_POR_CLIENTE',
      'DISENO_GENERAL_ENTREGADO_POR_CLIENTE',
      'DISENO_CLIENTE_PENDIENTE_VINCULACION',
    ].includes(item.state));
    const hasSentDesignPending = coverage.some(item => [
      'ENVIADO',
      'DISENO_ENVIADO',
      'DISENO_GENERAL_ENVIADO',
    ].includes(item.state));

    return {
      totalRequired,
      approvedCount,
      pendingCount,
      allApproved: totalRequired > 0 && approvedCount === totalRequired,
      hasWaitingApproval: pendingCount > 0 && (hasClientDesignPending || hasSentDesignPending),
      hasRejected,
      rejectedDesign: disenos.find(diseno => normalizeStatus(diseno.estado) === 'RECHAZADO') || null,
      hasClientDesignPending,
      hasPixelCreationPending: coverage.some(item => item.state === 'PENDIENTE_CREACION_PIXEL'),
      label: totalRequired > 0
        ? `${approvedCount} de ${totalRequired} disenos aprobados`
        : 'No requiere diseno',
      authoritative: true,
    };
  }

  const hasBackendCoverage = requiredDetails.some(detail => detail.estadoCoberturaDiseno);

  if (hasBackendCoverage) {
    const approvedCount = coverage.filter(item => item.covered).length;
    const hasRejected = coverage.some(item => item.isCorrection || item.state.includes('RECHAZADO'));
    const hasClientDesignPending = coverage.some(item => [
      'DISENO_ENTREGADO_POR_CLIENTE',
      'DISENO_GENERAL_ENTREGADO_POR_CLIENTE',
      'DISENO_CLIENTE_PENDIENTE_VINCULACION',
    ].includes(item.state));
    const hasSentDesignPending = coverage.some(item => [
      'DISENO_ENVIADO',
      'DISENO_GENERAL_ENVIADO',
    ].includes(item.state));
    const hasPixelCreationPending = coverage.some(item => item.state === 'PENDIENTE_CREACION_PIXEL');

    return {
      totalRequired: requiredDetails.length,
      approvedCount,
      allApproved: approvedCount >= requiredDetails.length,
      hasWaitingApproval: hasClientDesignPending || hasSentDesignPending,
      hasRejected,
      rejectedDesign: disenos.find(diseno => normalizeStatus(diseno.estado) === 'RECHAZADO') || null,
      hasClientDesignPending,
      hasPixelCreationPending,
      label: `${approvedCount} de ${requiredDetails.length} disenos aprobados`,
      authoritative: false,
    };
  }
  const generalApproved = disenos.some((diseno) => diseno.esDisenoGeneral && normalizeStatus(diseno.estado) === 'APROBADO');

  if (requiredDetails.length === 0) {
    return {
      totalRequired: 0,
      approvedCount: 0,
      allApproved: true,
      hasWaitingApproval: false,
      hasRejected: false,
      rejectedDesign: disenos.find((diseno) => normalizeStatus(diseno.estado) === 'RECHAZADO') || null,
      label: 'No requiere diseno',
      hasClientDesignPending: false,
      hasPixelCreationPending: false,
      authoritative: false,
    };
  }

  const approvedDetailIds = new Set(
    disenos
      .filter((diseno) => normalizeStatus(diseno.estado) === 'APROBADO' && diseno.idDetallePedido)
      .map((diseno) => String(diseno.idDetallePedido))
  );
  const approvedCount = generalApproved
    ? requiredDetails.length
    : requiredDetails.filter((detalle) => approvedDetailIds.has(String(detalle.idDetallePedido))).length;

  return {
    totalRequired: requiredDetails.length,
    approvedCount,
    allApproved: approvedCount >= requiredDetails.length,
    hasWaitingApproval: disenos.some((diseno) => ['ENVIADO', 'PENDIENTE_APROBACION', 'PENDIENTE_DE_APROBACION', 'POR_APROBAR', 'EN_REVISION'].includes(normalizeStatus(diseno.estado))),
    hasRejected: disenos.some((diseno) => ['RECHAZADO', 'RECHAZADA', 'CORRECCION', 'CORRECCIONES'].includes(normalizeStatus(diseno.estado))),
    rejectedDesign: disenos.find((diseno) => ['RECHAZADO', 'RECHAZADA', 'CORRECCION', 'CORRECCIONES'].includes(normalizeStatus(diseno.estado))) || null,
    label: `${approvedCount} de ${requiredDetails.length} disenos aprobados`,
    hasClientDesignPending: false,
    hasPixelCreationPending: false,
    authoritative: false,
  };
};

const hasConfirmedPayment = (pedido = {}) => {
  const estadoPago = normalizeStatus(pedido.estadoPago);
  const abonos = Array.isArray(pedido.abonos) ? pedido.abonos : [];

  return ['ABONADO', 'PARCIAL', 'COMPLETO', 'PAGADO'].includes(estadoPago) ||
    abonos.some((abono) => normalizeStatus(abono.estado).includes('CONFIRM'));
};

const hasFinalPaymentPending = (pedido = {}) => {
  const estadoPago = normalizeStatus(pedido.estadoPago);
  const saldo = Number(pedido.saldoPendiente ?? pedido.saldo ?? 0);

  return estadoPago !== 'COMPLETO' || saldo > 0;
};

const isOrderFinalized = (pedido = {}) => ['FINALIZADO', 'TERMINADO', 'ENTREGADO'].includes(normalizeStatus(pedido.estadoPedido));

const buildClientTrackingSteps = (pedido = {}) => {
  const estadoPedido = normalizeStatus(pedido.estadoPedido);
  if (['ANULADO', 'CANCELADO', 'CANCELADA'].includes(estadoPedido)) {
    return [{
      label: 'Pedido anulado',
      state: 'current',
      detail: 'Este pedido fue anulado y conserva su historial para consulta.',
    }];
  }
  const designProgress = getDesignProgress(pedido);
  const firstPaymentConfirmed = hasConfirmedPayment(pedido);
  const hasPendingReceipt = (pedido.abonos || []).some(abono => normalizeStatus(abono.estado) === 'PENDIENTE');
  const pendingFinalBalance = estadoPedido === 'PENDIENTE_SALDO_FINAL';
  const inProduction = ['EN_PROCESO', 'PRODUCCION', 'EN_PRODUCCION', 'PENDIENTE_SALDO_FINAL', 'FINALIZADO', 'TERMINADO', 'ENTREGADO'].includes(estadoPedido);
  const finalized = isOrderFinalized(pedido);
  const finalPaymentPending = hasFinalPaymentPending(pedido);
  const delivered = ['ENTREGADO', 'RECLAMADO'].includes(estadoPedido);
  const readyToDeliver = (estadoPedido === 'FINALIZADO' || estadoPedido === 'TERMINADO' || delivered) && !finalPaymentPending;
  const designWaitingApproval = designProgress.hasWaitingApproval;
  const designRejected = designProgress.hasRejected;
  const designApproved = designProgress.authoritative
    ? designProgress.allApproved
    : designProgress.allApproved || inProduction || finalized;

  const steps = [
    { label: 'Cotizacion aceptada', completed: Boolean(pedido.idPedido) },
    {
      label: 'Comprobante en revision',
      completed: false,
      current: hasPendingReceipt && !firstPaymentConfirmed,
      visible: hasPendingReceipt && !firstPaymentConfirmed,
    },
    { label: 'Pendiente de primer abono', completed: firstPaymentConfirmed, current: !firstPaymentConfirmed && !hasPendingReceipt },
    { label: 'Primer abono confirmado', completed: firstPaymentConfirmed },
    {
      label: designProgress.hasPixelCreationPending ? 'Diseno en preparacion' : 'Diseno en proceso',
      completed: designWaitingApproval || designRejected || designApproved || inProduction || finalized,
      current: firstPaymentConfirmed && !designWaitingApproval && !designRejected && !designApproved && !inProduction && !finalized,
      visible: designProgress.totalRequired > 0,
    },
    {
      label: designProgress.hasClientDesignPending ? 'Diseno pendiente de revision' : 'Diseno pendiente de aprobacion',
      completed: designRejected || designApproved || inProduction || finalized,
      current: designWaitingApproval && !designRejected && !designApproved,
      detail: designProgress.label,
      visible: designProgress.totalRequired > 0,
    },
    {
      label: 'Correcciones solicitadas',
      completed: false,
      current: designRejected,
      visible: designProgress.totalRequired > 0 && designRejected,
    },
    {
      label: 'Diseno aprobado',
      completed: designApproved || inProduction || finalized,
      detail: designProgress.label,
      visible: designProgress.totalRequired > 0,
    },
    { label: 'En produccion', completed: pendingFinalBalance || finalized, current: inProduction && !pendingFinalBalance && !finalized },
    {
      label: 'Pendiente de saldo final',
      completed: readyToDeliver,
      current: pendingFinalBalance || (finalized && finalPaymentPending),
      visible: finalPaymentPending,
    },
    { label: 'Pedido listo para reclamar / entregar', completed: delivered, current: readyToDeliver && !delivered },
    { label: 'Producto entregado', completed: delivered },
  ];

  const visibleSteps = steps.filter((step) => step.visible !== false);
  const currentIndex = visibleSteps.findIndex((step) => step.current);
  const fallbackCurrentIndex = currentIndex === -1 ? visibleSteps.findIndex((step) => !step.completed) : currentIndex;

  return visibleSteps.map((step, index) => ({
    label: step.label,
    state: step.completed
      ? 'completed'
      : index === fallbackCurrentIndex
        ? 'current'
        : 'pending',
    detail: step.label === 'Correcciones solicitadas'
      ? [designProgress.rejectedDesign?.observacionesCliente, formatShortDate(designProgress.rejectedDesign?.fechaRespuestaCliente)].filter(Boolean).join(' | ')
      : step.detail,
  }));
};

const buildClientActiveOrder = (pedido = {}) => ({
  id: String(pedido.idPedido),
  number: `PX-${pedido.idPedido}`,
  date: formatShortDate(pedido.fechaCreacion),
  status: pedido.estadoPedido || 'PENDIENTE',
  total: toNumber(pedido.total),
  paid: toNumber(pedido.totalPagado),
  balance: toNumber(pedido.saldoPendiente ?? pedido.saldo),
  paymentStatus: pedido.estadoPago || 'PENDIENTE',
  estimatedDelivery: pedido.fechaEntregaEstimada ?? pedido.fecha_estimada_entrega ?? null,
  details: Array.isArray(pedido.detalles)
    ? pedido.detalles
    : Array.isArray(pedido.detallesPedido)
      ? pedido.detallesPedido
      : [],
  isPendingFinalBalance: normalizeStatus(pedido.estadoPedido) === 'PENDIENTE_SALDO_FINAL',
  isReadyToDeliver: ['FINALIZADO', 'TERMINADO'].includes(normalizeStatus(pedido.estadoPedido)) &&
    Number(pedido.saldoPendiente ?? pedido.saldo ?? 0) <= 0,
  tracking: buildClientTrackingSteps(pedido),
});

const shouldShowOrderInTracking = (pedido = {}) => {
  return Boolean(pedido?.idPedido);
};

const addUniqueOrders = (target, pedidos = []) => {
  if (!Array.isArray(pedidos)) return;

  pedidos.forEach((pedido) => {
    if (!pedido?.idPedido || !shouldShowOrderInTracking(pedido)) return;
    if (target.some((item) => Number(item.idPedido) === Number(pedido.idPedido))) return;
    target.push(pedido);
  });
};

const buildClientActiveOrders = (payload = {}) => {
  const pedidos = [];

  addUniqueOrders(pedidos, payload.pedidoActivo?.idPedido ? [payload.pedidoActivo] : []);
  addUniqueOrders(pedidos, payload.pedidosActivos);
  addUniqueOrders(pedidos, payload.pedidosEnProceso);
  addUniqueOrders(pedidos, payload.activeOrders);
  addUniqueOrders(pedidos, payload.pedidosPendientes);
  addUniqueOrders(pedidos, payload.pedidos);
  addUniqueOrders(pedidos, payload.historialPedidos);

  return pedidos.map(buildClientActiveOrder).filter((order) => order.id !== 'undefined');
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
  async getDashboardData(user, permissions = [], options = {}) {
    const isClient = isClientUser(user, permissions.length > 0 ? permissions : user?.codigos);
    const endpoint = isClient ? 'api/cliente/dashboard' : 'api/dashboard/admin';
    const params = isClient ? { limite: 5 } : { anio: currentYear, ultimos: 5 };

    const { data } = await apiClient.get(endpoint, { params, signal: options.signal });
    const payload = data.data || {};

    return isClient
      ? { client: adaptClientDashboard(payload) }
      : { admin: adaptAdminDashboard(payload) };
  },
};
