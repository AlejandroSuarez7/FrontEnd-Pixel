export const REPORT_TYPES = Object.freeze({
  SALES: 'ventas',
  ORDERS: 'pedidos',
  QUOTES: 'cotizaciones',
  PAYMENTS: 'abonos',
});

const ORDER_STATES = [
  ['PENDIENTE', 'Pendiente'],
  ['EN_PROCESO', 'En proceso'],
  ['PENDIENTE_SALDO_FINAL', 'Pendiente saldo final'],
  ['FINALIZADO', 'Finalizado'],
  ['ENTREGADO', 'Entregado'],
  ['ANULADO', 'Anulado'],
];

const QUOTE_STATES = [
  ['PENDIENTE', 'Pendiente'],
  ['APROBADA', 'Aprobada'],
  ['ANULADA', 'Anulada'],
  ['BORRADOR', 'Borrador'],
  ['SOLICITUD_RECIBIDA', 'Solicitud recibida'],
  ['EN_REVISION', 'En revisión'],
  ['PENDIENTE_APROBACION_CLIENTE', 'Pendiente de aprobación del cliente'],
  ['AJUSTE_SOLICITADO', 'Ajuste solicitado'],
  ['ACEPTADA', 'Aceptada'],
  ['RECHAZADA_CLIENTE', 'Rechazada por el cliente'],
  ['VENCIDA', 'Vencida'],
  ['CONVERTIDA_EN_PEDIDO', 'Convertida en pedido'],
];

export const REPORT_DEFINITIONS = Object.freeze({
  [REPORT_TYPES.SALES]: {
    title: 'Reporte de Ventas',
    permission: 'ventas.ver',
    statusField: 'estadoPago',
    statusLabel: 'Estado de pago',
    statusOptions: [
      ['PENDIENTE', 'Pendiente'],
      ['PARCIAL', 'Parcial'],
      ['COMPLETO', 'Completo'],
    ],
    summary: [
      { key: 'cantidadVentas', label: 'Ventas realizadas' },
      { key: 'totalVendido', label: 'Total vendido', format: 'currency' },
      { key: 'ticketPromedio', label: 'Ticket promedio', format: 'currency' },
      { key: 'cantidadClientes', label: 'Clientes atendidos' },
    ],
    columns: [
      { key: 'idVenta', label: 'Venta', format: 'id' },
      { key: 'idPedido', label: 'Pedido', format: 'id' },
      { key: 'fecha', label: 'Fecha', format: 'date' },
      { key: 'cliente.nombre', label: 'Cliente' },
      { key: 'estadoPago', label: 'Estado de pago', format: 'status' },
      { key: 'estadoVenta', label: 'Estado', format: 'status' },
      { key: 'total', label: 'Total', format: 'currency' },
    ],
    fallbackFilename: 'reporte-ventas.pdf',
  },
  [REPORT_TYPES.ORDERS]: {
    title: 'Reporte de Pedidos',
    permission: 'pedidos.ver',
    statusField: 'estado',
    statusLabel: 'Estado',
    statusOptions: ORDER_STATES,
    summary: [
      { key: 'totalPedidos', label: 'Total pedidos' },
      { key: 'pendientes', label: 'Pendientes' },
      { key: 'enProceso', label: 'En proceso' },
      { key: 'pendientesSaldoFinal', label: 'Pendiente saldo final' },
      { key: 'finalizados', label: 'Finalizados' },
      { key: 'entregados', label: 'Entregados' },
      { key: 'anulados', label: 'Anulados' },
    ],
    columns: [
      { key: 'idPedido', label: 'Pedido', format: 'id' },
      { key: 'fechaCreacion', label: 'Fecha', format: 'date' },
      { key: 'cliente.nombre', label: 'Cliente' },
      { key: 'estadoPedido', label: 'Estado', format: 'status' },
      { key: 'fechaEntregaEstimada', label: 'Fecha entrega estimada', format: 'dateOptional' },
      { key: 'totalPedido', label: 'Total', format: 'currency' },
    ],
    fallbackFilename: 'reporte-pedidos.pdf',
  },
  [REPORT_TYPES.QUOTES]: {
    title: 'Reporte de Cotizaciones',
    permission: 'cotizaciones.ver',
    statusField: 'estado',
    statusLabel: 'Estado',
    statusOptions: QUOTE_STATES,
    summary: [
      { key: 'totalCotizaciones', label: 'Total cotizaciones' },
      { key: 'cantidadConvertidasPedido', label: 'Convertidas en pedido' },
      { key: 'tasaConversion', label: 'Tasa de conversión', format: 'percentage' },
    ],
    columns: [
      { key: 'idCotizacion', label: 'Cotización', format: 'id' },
      { key: 'fechaCreacion', label: 'Fecha', format: 'date' },
      { key: 'cliente.nombre', label: 'Cliente' },
      { key: 'estado', label: 'Estado', format: 'status' },
      { key: 'valorPropuestaVigente', label: 'Valor propuesta vigente', format: 'currency' },
      { key: 'idPedido', label: 'Pedido generado', format: 'optionalId' },
    ],
    fallbackFilename: 'reporte-cotizaciones.pdf',
  },
  [REPORT_TYPES.PAYMENTS]: {
    title: 'Reporte de Abonos',
    permission: 'abonos.ver',
    statusField: 'estado',
    statusLabel: 'Estado',
    statusOptions: [
      ['PENDIENTE', 'Pendiente'],
      ['CONFIRMADO', 'Confirmado'],
      ['RECHAZADO', 'Rechazado'],
    ],
    hasOrderFilter: true,
    summary: [
      { key: 'cantidadAbonos', label: 'Total de abonos' },
      { key: 'cantidadConfirmados', label: 'Confirmados' },
      { key: 'cantidadPendientes', label: 'Pendientes' },
      { key: 'cantidadRechazados', label: 'Rechazados' },
      { key: 'totalConfirmado', label: 'Total confirmado', format: 'currency' },
      { key: 'totalPendiente', label: 'Total pendiente', format: 'currency' },
    ],
    columns: [
      { key: 'idAbono', label: 'Abono', format: 'id' },
      { key: 'idPedido', label: 'Pedido', format: 'id' },
      { key: 'cliente.nombre', label: 'Cliente' },
      { key: 'fecha', label: 'Fecha', format: 'date' },
      { key: 'monto', label: 'Monto', format: 'currency' },
      { key: 'estado', label: 'Estado', format: 'status' },
      { key: 'referencia', label: 'Referencia', fallback: 'Sin referencia' },
    ],
    fallbackFilename: 'reporte-abonos.pdf',
  },
});

export const getReportDefinition = (type) => {
  const definition = REPORT_DEFINITIONS[type];
  if (!definition) throw new Error('Tipo de reporte no soportado.');
  return definition;
};

export const createReportFilters = (type) => {
  const definition = getReportDefinition(type);
  return {
    fechaInicio: '',
    fechaFin: '',
    idCliente: '',
    [definition.statusField]: '',
    ...(definition.hasOrderFilter ? { idPedido: '' } : {}),
  };
};

export const createEmptyReport = () => ({
  reporte: '',
  generadoEn: '',
  zonaHoraria: 'America/Bogota',
  generadoPor: null,
  periodo: {},
  filtros: {},
  resumen: {},
  registros: [],
  totalRegistros: 0,
  paginacion: {
    page: 1,
    limit: 20,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  },
});
