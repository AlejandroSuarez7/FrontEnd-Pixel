import {
  ArrowRight,
  BadgeDollarSign,
  Clock3,
  Factory,
  FileText,
  PencilRuler,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Truck,
  UserRound,
  UsersRound,
} from 'lucide-react';
import { useEffect, useState } from 'react';
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
import './DashboardPage.css';

const kpiIcons = {
  clock: Clock3,
  users: UsersRound,
  shopping: ShoppingBag,
  truck: Truck,
};

const trackingIcons = {
  'Cotizacion aceptada': FileText,
  'Pendiente de primer abono': Clock3,
  'Primer abono confirmado': BadgeDollarSign,
  'Diseno en proceso': PencilRuler,
  'Diseno pendiente de aprobacion': ShieldCheck,
  'En produccion': Factory,
  'Pendiente de segundo abono / saldo final': Clock3,
  'Pedido finalizado': ShieldCheck,
  'Listo para reclamar / entregar': Truck,
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
  FINALIZADO: 'statusDone',
  ANULADO: 'statusCancelled',
  POR_APROBAR: 'statusProduction',
};

const readableStatus = (status) => {
  const labels = {
    PENDIENTE: 'Pendiente',
    EN_PROCESO: 'En produccion',
    FINALIZADO: 'Terminado',
    ANULADO: 'Anulado',
    POR_APROBAR: 'Por aprobar',
  };

  return labels[status] || status;
};

const KpiCard = ({ item }) => {
  const Icon = kpiIcons[item.iconKey] || Clock3;

  return (
    <article className={`dashboard-kpi-card dashboard-tone-${item.tone}`}>
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

const RevenueKpiCard = ({ revenue }) => {
  const [period, setPeriod] = useState('monthly');
  const selected = revenue[period];
  const options = [
    { key: 'daily', label: 'Dia' },
    { key: 'monthly', label: 'Mes' },
    { key: 'yearly', label: 'Ano' },
  ];

  return (
    <article className="dashboard-kpi-card dashboard-revenue-card dashboard-tone-success">
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
              onClick={() => setPeriod(option.key)}
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
      <div className="dashboard-tracking">
        {order.tracking.map((step) => {
        const Icon = trackingIcons[step.label] || Clock3;
        return (
          <article className={`tracking-step ${step.state}`} key={step.label}>
            <span className="tracking-marker">
              <Icon size={20} />
            </span>
            <div>
              <strong>{step.label}</strong>
              <small>{trackingStatusText[step.state] || 'Pendiente'}</small>
            </div>
          </article>
        );
      })}
      </div>
    )}
  </section>
);

const QuickActions = () => {
  const navigate = useNavigate();
  const { hasAnyPermission } = useAuth();
  const actions = [
    hasAnyPermission(['cotizaciones.crear_cliente', 'cotizaciones.crear_presencial']) && { label: 'Crear cotizacion', icon: FileText, onClick: () => navigate(PATHS.SERVICES_QUOTES) },
    { label: 'Actualizar perfil', icon: UserRound, onClick: () => navigate(PATHS.PROFILE) },
  ].filter(Boolean);

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
      <p>Estamos consultando el resumen desde la API.</p>
    </section>
  </div>
);

const ErrorDashboard = ({ message }) => (
  <div className="dashboard-page">
    <section className="dashboard-panel dashboard-state-panel">
      <strong>No se pudo cargar el dashboard</strong>
      <p>{message}</p>
    </section>
  </div>
);

const AdminDashboard = ({ userName, data }) => (
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
      {data.kpis.map((item) => <KpiCard item={item} key={item.label} />)}
      <RevenueKpiCard revenue={data.revenue} />
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

const ClientDashboard = ({ userName, data }) => {
  const activeOrders = data.activeOrders || [];
  const [selectedOrderId, setSelectedOrderId] = useState(activeOrders[0]?.id || '');
  const selectedOrder = activeOrders.find((order) => order.id === selectedOrderId) || activeOrders[0] || null;
  const activeOrderLabel = selectedOrder ? selectedOrder.number : 'Sin pedido activo';

  useEffect(() => {
    if (activeOrders.length === 0) {
      setSelectedOrderId('');
      return;
    }

    if (!activeOrders.some((order) => order.id === selectedOrderId)) {
      setSelectedOrderId(activeOrders[0].id);
    }
  }, [activeOrders, selectedOrderId]);

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

      <div className="dashboard-grid dashboard-client-grid">
        <ActiveOrdersPanel
          orders={activeOrders}
          selectedOrderId={selectedOrder?.id || ''}
          onSelectOrder={setSelectedOrderId}
        />
        <QuickActions />
      </div>

      <TrackingPanel order={selectedOrder} />

      <OrdersTable title="Historial" orders={data.history} showCustomer={false} />
    </div>
  );
};

const DashboardPage = () => {
  const { user, permissions } = useAuth();
  const { data, loading, error } = useDashboardData(user, permissions);
  const userName = user?.nombre || user?.name || user?.correo || user?.email || 'Usuario';
  const isClient = isClientUser(user, permissions);

  if (loading) return <LoadingDashboard />;
  if (error || !data) return <ErrorDashboard message={error || 'Respuesta vacia desde la API.'} />;

  if (isClient && data.client) {
    return <ClientDashboard userName={userName} data={data.client} />;
  }

  if (!isClient && data.admin) {
    return <AdminDashboard userName={userName} data={data.admin} />;
  }

  return <ErrorDashboard message="La API no devolvio datos para este rol." />;
};

export default DashboardPage;
