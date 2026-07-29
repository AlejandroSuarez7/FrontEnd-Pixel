import {
  ArrowRight,
  BadgeDollarSign,
  Check,
  Clock3,
  Factory,
  FileSearch,
  FileText,
  Link2,
  PencilRuler,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Truck,
  UserRound,
  UsersRound,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Area,
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useAuth } from '../../../store/AuthContext';
import { PATHS } from '../../../routes/paths';
import { isClientUser } from '../../../core/utils/permissions';
import { useDashboardData } from '../application/useDashboardData';
import { ClientPaymentsPanel } from './ClientPaymentsPanel';
import { notifications } from '../../../core/utils/notifications';
import { getDesignCoverageInfo } from '../../../core/utils/designCoverage';
import { pedidoRepository } from '../../sales/pedidos/infrastructure/pedido.repository';
import { formatCalendarDate } from '../../../core/utils/fechaFormato';
import { navigateToLandingQuote } from '../../../core/utils/landingNavigation';
import './DashboardPage.css';

const kpiIcons = {
  clock: Clock3,
  users: UsersRound,
  shopping: ShoppingBag,
  truck: Truck,
};

const trackingIcons = {
  'Cotizacion aceptada': FileText,
  'Comprobante en revision': FileSearch,
  'Pendiente de primer abono': Clock3,
  'Primer abono confirmado': BadgeDollarSign,
  'Diseno en proceso': PencilRuler,
  'Diseno pendiente de aprobacion': ShieldCheck,
  'Diseno aprobado': ShieldCheck,
  'Correcciones solicitadas': PencilRuler,
  'En produccion': Factory,
  'Pendiente de saldo final': Clock3,
  'Pedido listo para reclamar / entregar': Truck,
  'Producto entregado': ShieldCheck,
  'Pedido anulado': Clock3,
};

const statusClassMap = {
  Pendiente: 'statusPending',
  'En produccion': 'statusProduction',
  Produccion: 'statusProduction',
  Terminado: 'statusDone',
  Entregado: 'statusDelivered',
  Solicitada: 'statusRequested',
  Cotizar: 'statusProduction',
  PENDIENTE: 'statusPending',
  EN_PROCESO: 'statusProduction',
  PENDIENTE_SALDO_FINAL: 'statusPending',
  FINALIZADO: 'statusDone',
  ENTREGADO: 'statusDelivered',
  ANULADO: 'statusCancelled',
  POR_APROBAR: 'statusProduction',
};

const readableStatus = (status) => {
  const labels = {
    PENDIENTE: 'Pendiente',
    EN_PROCESO: 'En produccion',
    PENDIENTE_SALDO_FINAL: 'Pendiente saldo final',
    FINALIZADO: 'Terminado',
    ENTREGADO: 'Entregado',
    ANULADO: 'Anulado',
    POR_APROBAR: 'Por aprobar',
  };

  return labels[status] || status;
};

const KpiCard = ({ item, onActivate }) => {
  const Icon = kpiIcons[item.iconKey] || Clock3;
  const interactiveProps = onActivate
    ? {
        role: 'link',
        tabIndex: 0,
        onClick: onActivate,
        onKeyDown: (event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onActivate();
          }
        },
      }
    : {};

  return (
    <article
      className={`dashboard-kpi-card dashboard-tone-${item.tone}${onActivate ? ' dashboard-kpi-card-link' : ''}`}
      {...interactiveProps}
    >
      <div>
        <p className="dashboard-kpi-label">{item.label}</p>
        <strong>{item.value}</strong>
        <span>{item.detail}</span>
      </div>
      <span className="dashboard-kpi-icon">
        <Icon size={22} strokeWidth={2.2} />
      </span>
    </article>
  );
};

const RevenueKpiCard = ({ revenue, onActivate }) => {
  const [period, setPeriod] = useState('monthly');
  const selected = revenue[period];
  const options = [
    { key: 'daily', label: 'Dia' },
    { key: 'monthly', label: 'Mes' },
    { key: 'yearly', label: 'Ano' },
  ];

  return (
    <article
      className={`dashboard-kpi-card dashboard-revenue-card dashboard-tone-success${onActivate ? ' dashboard-kpi-card-link' : ''}`}
      role={onActivate ? 'link' : undefined}
      tabIndex={onActivate ? 0 : undefined}
      onClick={onActivate}
      onKeyDown={(event) => {
        if (onActivate && (event.key === 'Enter' || event.key === ' ')) {
          event.preventDefault();
          onActivate();
        }
      }}
    >
      <div className="dashboard-kpi-content">
        <p className="dashboard-kpi-label">Ingresos</p>
        <strong>{selected.value}</strong>
        <span>{selected.detail}</span>
      </div>
      <div className="dashboard-revenue-side">
        <span className="dashboard-kpi-icon">
          <BadgeDollarSign size={22} strokeWidth={2.2} />
        </span>
        <div className="dashboard-period-tabs" aria-label="Periodo de ingresos">
          {options.map((option) => (
            <button
              type="button"
              key={option.key}
              className={period === option.key ? 'active' : ''}
              onClick={(event) => {
                event.stopPropagation();
                setPeriod(option.key);
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </article>
  );
};

const SectionHeader = ({ eyebrow, title }) => (
  <div className="dashboard-section-header">
    {eyebrow && <span>{eyebrow}</span>}
    <h2>{title}</h2>
  </div>
);

const formatCopCompact = (value = 0) => {
  const amount = Number(value || 0);

  if (Math.abs(amount) >= 1000000) {
    return `$${(amount / 1000000).toLocaleString('es-CO', {
      maximumFractionDigits: 1,
    })}M`;
  }

  if (Math.abs(amount) >= 1000) {
    return `$${Math.round(amount / 1000).toLocaleString('es-CO')}k`;
  }

  return `$${amount.toLocaleString('es-CO')}`;
};

const formatCopFull = (value = 0) =>
  `$${Number(value || 0).toLocaleString('es-CO')}`;

const hasChartData = (data = [], keys = []) =>
  data.some((item) => keys.some((key) => Number(item[key] || 0) > 0));

const ChartEmptyState = () => (
  <div className="dashboard-chart-empty">
    <strong>No hay datos suficientes para mostrar esta grafica.</strong>
    <span>Cuando existan registros confirmados, la visualizacion aparecera aqui.</span>
  </div>
);

const DashboardChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="dashboard-chart-tooltip">
      <strong>{label}</strong>
      {payload.map((item) => (
        <span key={item.dataKey} style={{ color: item.color }}>
          {item.name}: {item.dataKey === 'revenue' ? formatCopFull(item.value) : Number(item.value || 0).toLocaleString('es-CO')}
        </span>
      ))}
    </div>
  );
};

const MonthlyRevenueChart = ({ data }) => {
  const hasData = hasChartData(data, ['revenue', 'orders']);

  return (
    <section className="dashboard-panel dashboard-chart-panel">
      <SectionHeader eyebrow="Ventas" title="Ingresos y ventas por mes" />
      {!hasData ? (
        <ChartEmptyState />
      ) : (
        <div className="dashboard-recharts-wrap" aria-label="Ingresos y ventas por mes">
          <ResponsiveContainer width="100%" height={292}>
            <ComposedChart data={data} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="dashboardRevenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6c5ce7" stopOpacity={0.28} />
                  <stop offset="95%" stopColor="#6c5ce7" stopOpacity={0.03} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#edf1f7" vertical={false} />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#8f9bb3', fontSize: 12, fontWeight: 600 }}
              />
              <YAxis
                yAxisId="revenue"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#8f9bb3', fontSize: 11, fontWeight: 600 }}
                tickFormatter={formatCopCompact}
                width={58}
              />
              <YAxis
                yAxisId="orders"
                orientation="right"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#8f9bb3', fontSize: 11, fontWeight: 600 }}
                allowDecimals={false}
                width={34}
              />
              <Tooltip content={<DashboardChartTooltip />} cursor={{ fill: 'rgba(108, 92, 231, 0.06)' }} />
              <Legend
                verticalAlign="bottom"
                iconType="circle"
                wrapperStyle={{ paddingTop: 14, color: '#8f9bb3', fontSize: 12, fontWeight: 600 }}
              />
              <Area
                yAxisId="revenue"
                type="monotone"
                dataKey="revenue"
                name="Ingresos"
                stroke="#6c5ce7"
                strokeWidth={3}
                fill="url(#dashboardRevenueGradient)"
                activeDot={{ r: 5, strokeWidth: 2 }}
              />
              <Bar
                yAxisId="orders"
                dataKey="orders"
                name="Ventas"
                fill="#0984e3"
                radius={[8, 8, 2, 2]}
                maxBarSize={34}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
};

const StatusDistribution = ({ data }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const chartData = data.filter((item) => Number(item.value || 0) > 0);

  return (
    <section className="dashboard-panel dashboard-status-panel">
      <SectionHeader eyebrow="Estados" title="Distribucion de pedidos" />
      {total === 0 ? (
        <ChartEmptyState />
      ) : (
        <div className="dashboard-donut-wrap">
          <div className="dashboard-pie-wrap">
            <ResponsiveContainer width="100%" height={210}>
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="label"
                  innerRadius={62}
                  outerRadius={88}
                  paddingAngle={3}
                  stroke="#ffffff"
                  strokeWidth={3}
                >
                  {chartData.map((item) => (
                    <Cell key={item.label} fill={item.color} />
                  ))}
                </Pie>
                <Tooltip
                  allowEscapeViewBox={{ x: true, y: true }}
                  position={{ x: 158, y: 66 }}
                  wrapperStyle={{ zIndex: 20, pointerEvents: 'none' }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const item = payload[0];
                    return (
                      <div className="dashboard-chart-tooltip">
                        <strong>{item.name}</strong>
                        <span style={{ color: item.payload.color }}>
                          {Number(item.value || 0).toLocaleString('es-CO')} pedidos
                        </span>
                      </div>
                    );
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="dashboard-pie-center" aria-hidden="true">
              <strong>{total}</strong>
              <span>pedidos</span>
            </div>
          </div>
          <div className="dashboard-status-list">
            {data.map((item) => (
              <div key={item.label}>
                <span><i style={{ backgroundColor: item.color }} />{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

const OrdersTable = ({ title, orders, showCustomer = true }) => (
  <section className="dashboard-panel dashboard-table-panel">
    <SectionHeader eyebrow="Actividad" title={title} />
    <div className="dashboard-table-wrap">
      <table className="dashboard-table">
        <thead>
          <tr>
            <th>Numero de pedido</th>
            {showCustomer && <th>Cliente</th>}
            <th>Fecha</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {orders.length === 0 ? (
            <tr>
              <td colSpan={showCustomer ? 4 : 3}>No hay pedidos para mostrar.</td>
            </tr>
          ) : orders.map((order) => (
            <tr key={order.number}>
              <td>{order.number}</td>
              {showCustomer && <td>{order.customer}</td>}
              <td>{order.date}</td>
              <td>
                <span className={`dashboard-status-badge ${statusClassMap[order.status] || 'statusPending'}`}>
                  {readableStatus(order.status)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </section>
);

const QuoteFlowPanel = ({ data, quotes }) => (
  <section className="dashboard-panel">
    <SectionHeader eyebrow="Cotizaciones" title="Pendientes por cotizar" />
    <div className="dashboard-quote-summary">
      <span className="dashboard-quote-icon"><FileText size={22} /></span>
      <div>
        <strong>{data.value}</strong>
        <p>Cotizaciones pendientes antes de pasar a pedido.</p>
      </div>
    </div>
    <div className="dashboard-quote-breakdown">
      <span><b>{data.readyToPrice}</b> pendientes recientes</span>
      <span><b>{data.waitingClient}</b> esperando aprobacion del cliente</span>
    </div>
    <div className="dashboard-mini-list">
      {quotes.map((quote) => (
        <article key={quote.number}>
          <div>
            <strong>{quote.number}</strong>
            <span>{quote.customer}</span>
          </div>
          <span className={`dashboard-status-badge ${statusClassMap[quote.status] || 'statusPending'}`}>
            {readableStatus(quote.status)}
          </span>
        </article>
      ))}
    </div>
  </section>
);

const trackingStatusText = {
  completed: 'Completado',
  current: 'En este paso',
  pending: 'Pendiente',
};

const ActiveOrdersPanel = ({ orders, selectedOrderId, onSelectOrder }) => (
  <section className="dashboard-panel dashboard-active-orders-panel">
    <SectionHeader eyebrow="Pedidos" title="Pedidos activos" />
    {orders.length === 0 ? (
      <div className="dashboard-empty-state">
        <strong>No tienes pedidos activos</strong>
        <p>Cuando una cotizacion avance a pedido, podras consultar aqui su progreso.</p>
      </div>
    ) : (
      <div className="dashboard-order-selector">
        {orders.map((order) => (
          <button
            type="button"
            key={order.id}
            className={selectedOrderId === order.id ? 'dashboard-order-card active' : 'dashboard-order-card'}
            onClick={() => onSelectOrder(order.id)}
          >
            <span>
              <strong>{order.number}</strong>
              <small>{order.date}</small>
              <small>{order.estimatedDelivery
                ? `Entrega estimada: ${formatCalendarDate(order.estimatedDelivery)}`
                : 'Entrega estimada: Por definir'}
              </small>
            </span>
            <span className={`dashboard-status-badge ${statusClassMap[order.status] || 'statusPending'}`}>
              {readableStatus(order.status)}
            </span>
          </button>
        ))}
      </div>
    )}
  </section>
);

const TrackingPanel = ({ order }) => (
  <section className="dashboard-panel dashboard-tracking-panel">
    <SectionHeader eyebrow="Seguimiento" title={order ? `Progreso de ${order.number}` : 'Progreso del pedido'} />
    {!order ? (
      <div className="dashboard-empty-state">
        <strong>Selecciona un pedido</strong>
        <p>No hay un pedido activo para mostrar seguimiento.</p>
      </div>
    ) : (
      <>
      {order.isPendingFinalBalance && (
        <div className="dashboard-final-balance-alert">
          <strong>Tu pedido ya termino produccion.</strong>
          <span>Falta confirmar el saldo final para coordinar la entrega.</span>
          <small>Saldo pendiente: {formatCopFull(order.balance)}</small>
          <p>Un asesor se comunicara contigo para coordinar el segundo abono y la entrega.</p>
        </div>
      )}
      {order.isReadyToDeliver && (
        <div className="dashboard-final-balance-alert dashboard-ready-alert">
          <strong>Tu pedido esta listo.</strong>
          <span>Coordina la entrega o reclamacion con PIXEL.</span>
        </div>
      )}
      {order.estimatedDelivery && (
        <div className="dashboard-estimated-delivery">
          Entrega estimada: <strong>{formatCalendarDate(order.estimatedDelivery)}</strong>
        </div>
      )}
      <div className="dashboard-tracking dashboard-tracking-timeline">
        {order.tracking.map((step) => {
        const Icon = step.state === 'completed' ? Check : trackingIcons[step.label] || Clock3;
        return (
          <article className={`tracking-step ${step.state}`} key={step.label}>
            <span className="tracking-marker">
              <Icon size={20} />
            </span>
            <div>
              <strong>{step.label}</strong>
              <small>{trackingStatusText[step.state] || 'Pendiente'}</small>
              {step.detail && <p>{step.detail}</p>}
            </div>
          </article>
        );
      })}
      </div>
      </>
    )}
  </section>
);

const QuickActions = () => {
  const navigate = useNavigate();
  const actions = [
    { label: 'Crear cotizacion', icon: FileText, onClick: () => navigateToLandingQuote(navigate) },
    { label: 'Actualizar perfil', icon: UserRound, onClick: () => navigate(PATHS.PROFILE) },
  ];

  return (
    <section className="dashboard-panel">
      <SectionHeader eyebrow="Acciones" title="Acciones rapidas" />
      <div className="dashboard-actions">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button type="button" key={action.label} onClick={action.onClick}>
              <Icon size={20} />
              <span>{action.label}</span>
              <ArrowRight size={17} />
            </button>
          );
        })}
      </div>
    </section>
  );
};

const LoadingDashboard = () => (
  <div className="dashboard-page">
    <section className="dashboard-panel dashboard-state-panel">
      <strong>Cargando dashboard...</strong>
      <p>Estamos consultando el resumen del sistema.</p>
    </section>
  </div>
);

const ErrorDashboard = ({ message, onRetry }) => (
  <div className="dashboard-page">
    <section className="dashboard-panel dashboard-state-panel">
      <strong>No se pudo cargar el dashboard</strong>
      <p>{message}</p>
      {onRetry && (
        <button type="button" className="dashboard-state-retry" onClick={onRetry}>
          Reintentar
        </button>
      )}
    </section>
  </div>
);

const AdminDashboard = ({ userName, data }) => {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const destinations = {
    'Pedidos pendientes': hasPermission('pedidos.ver') ? PATHS.ORDERS : null,
    'Total clientes': hasPermission('clientes.ver') ? PATHS.USERS_CLIENTS : null,
  };
  const salesPath = hasPermission('ventas.ver') || hasPermission('ventas.resumen')
    ? PATHS.SALES
    : null;

  return (
    <div className="dashboard-page">
    <header className="dashboard-hero">
      <div>
        <span className="dashboard-eyebrow"><Sparkles size={16} /> Panel administrador</span>
        <h1>Dashboard</h1>
        <p>Bienvenido de nuevo, {userName}. Vision general del negocio en tiempo real.</p>
      </div>
      <div className="dashboard-hero-card">
        <FileText size={24} />
        <strong>Datos en tiempo real</strong>
        <span>Conectado a /api/dashboard/admin</span>
      </div>
    </header>

    <section className="dashboard-kpi-grid admin-kpis">
      {data.kpis.map((item) => (
        <KpiCard
          item={item}
          key={item.label}
          onActivate={destinations[item.label] ? () => navigate(destinations[item.label]) : undefined}
        />
      ))}
      <RevenueKpiCard
        revenue={data.revenue}
        onActivate={salesPath ? () => navigate(salesPath) : undefined}
      />
    </section>

    <div className="dashboard-grid dashboard-grid-charts">
      <MonthlyRevenueChart data={data.monthlySales} />
      <StatusDistribution data={data.orderStatus} />
    </div>

    <div className="dashboard-grid dashboard-grid-bottom">
      <OrdersTable title="Ultimos pedidos" orders={data.latestOrders} />
      <QuoteFlowPanel data={data.pendingQuotes} quotes={data.pendingQuotesList} />
    </div>
    </div>
  );
};

const ClientDesignUrlPanel = ({ order, onSaved }) => {
  const [urls, setUrls] = useState({});
  const [pendingDetailId, setPendingDetailId] = useState(null);
  const clientDetails = (order?.details || []).filter((detail) => (
    detail.requiereDiseno !== false
    && String(detail.origenDiseno || '').toUpperCase() === 'CLIENTE'
  ));

  if (!order || clientDetails.length === 0) return null;

  const saveDesignUrl = async (detail) => {
    if (pendingDetailId) return;
    const value = String(urls[detail.idDetallePedido] || '').trim();

    if (!/^https?:\/\/\S+$/i.test(value)) {
      notifications.warning('Ingresa una URL valida que comience con http:// o https://.');
      return;
    }

    setPendingDetailId(detail.idDetallePedido);
    try {
      await pedidoRepository.saveClientDesignUrl(order.id, detail.idDetallePedido, value);
      notifications.success('Diseno enviado correctamente. Quedo pendiente de revision.');
      setUrls((current) => ({ ...current, [detail.idDetallePedido]: '' }));
      await onSaved?.();
    } catch (error) {
      notifications.error(error.message || 'No se pudo guardar el enlace del diseno.');
    } finally {
      setPendingDetailId(null);
    }
  };

  return (
    <section className="dashboard-panel dashboard-client-design-panel">
      <div className="dashboard-panel-title">
        <span>Archivos del cliente</span>
        <h2>Tu diseno</h2>
      </div>
      <div className="dashboard-client-design-list">
        {clientDetails.map((detail, index) => {
          const coverage = getDesignCoverageInfo(detail);
          const fileUrl = coverage.fileUrl;
          return (
            <article key={detail.idDetallePedido || index}>
              <div>
                <strong>{detail.producto?.nombre || detail.descripcion || `Producto ${index + 1}`}</strong>
                <span>{detail.tecnica?.nombre || 'Tecnica no especificada'} · Cant. {Number(detail.cantidad || 0).toLocaleString('es-CO')}</span>
              </div>
              {fileUrl ? (
                <a href={fileUrl} target="_blank" rel="noreferrer">
                  <Link2 size={15} /> Abrir diseno
                </a>
              ) : (
                <div className="dashboard-client-design-form">
                  <label htmlFor={`client-design-${detail.idDetallePedido}`}>URL del diseno</label>
                  <div>
                    <input
                      id={`client-design-${detail.idDetallePedido}`}
                      type="url"
                      placeholder="https://drive.google.com/... o enlace accesible"
                      value={urls[detail.idDetallePedido] || ''}
                      onChange={(event) => setUrls((current) => ({
                        ...current,
                        [detail.idDetallePedido]: event.target.value,
                      }))}
                      disabled={pendingDetailId === detail.idDetallePedido}
                    />
                    <button
                      type="button"
                      onClick={() => saveDesignUrl(detail)}
                      disabled={Boolean(pendingDetailId)}
                    >
                      {pendingDetailId === detail.idDetallePedido ? 'Guardando...' : 'Guardar diseno'}
                    </button>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
};

const ClientDashboard = ({ userName, data, onRefresh }) => {
  const { hasPermission } = useAuth();
  const activeOrders = useMemo(() => data.activeOrders || [], [data.activeOrders]);
  const [selectedOrderId, setSelectedOrderId] = useState(activeOrders[0]?.id || '');
  const effectiveOrderId = activeOrders.some((order) => order.id === selectedOrderId)
    ? selectedOrderId
    : activeOrders[0]?.id || '';
  const selectedOrder = activeOrders.find((order) => order.id === effectiveOrderId) || null;
  const activeOrderLabel = selectedOrder ? selectedOrder.number : 'Sin pedido activo';

  return (
    <div className="dashboard-page dashboard-page-client">
      <header className="dashboard-hero">
        <div>
          <span className="dashboard-eyebrow"><Sparkles size={16} /> Panel cliente</span>
          <h1>Mis pedidos</h1>
          <p>Hola, {userName}. Consulta el estado de tus estampados y gestiona tus proximas acciones.</p>
        </div>
        <div className="dashboard-hero-card">
          <Truck size={24} />
          <strong>Seguimiento activo</strong>
          <span>{activeOrderLabel}</span>
        </div>
      </header>

      <section className="dashboard-kpi-grid client-kpis">
        {data.kpis.map((item) => <KpiCard item={item} key={item.label} />)}
      </section>

      <div id="pedidos" className="dashboard-grid dashboard-client-grid">
        <ActiveOrdersPanel
          orders={activeOrders}
          selectedOrderId={selectedOrder?.id || ''}
          onSelectOrder={setSelectedOrderId}
        />
        <QuickActions />
      </div>

      <TrackingPanel order={selectedOrder} />
      <ClientPaymentsPanel
        order={selectedOrder}
        canUpload={hasPermission('abonos.cliente.crear')}
        canView={hasPermission('abonos.cliente.ver')}
      />
      <ClientDesignUrlPanel order={selectedOrder} onSaved={onRefresh} />

      <OrdersTable title="Historial" orders={data.history} showCustomer={false} />
    </div>
  );
};

const DashboardPage = () => {
  const { user, permissions } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const { data, loading, error, refetch } = useDashboardData(user, permissions, refreshKey);
  const userName = user?.nombre || user?.name || user?.correo || user?.email || 'Usuario';
  const isClient = isClientUser(user, permissions);

  if (loading) return <LoadingDashboard />;
  if (error || !data) {
    return <ErrorDashboard message={error || 'El sistema devolvio una respuesta vacia.'} onRetry={refetch} />;
  }

  if (isClient && data.client) {
    return <ClientDashboard userName={userName} data={data.client} onRefresh={() => setRefreshKey((value) => value + 1)} />;
  }

  if (!isClient && data.admin) {
    return <AdminDashboard userName={userName} data={data.admin} />;
  }

  return <ErrorDashboard message="No hay datos disponibles para este perfil." />;
};

export default DashboardPage;
