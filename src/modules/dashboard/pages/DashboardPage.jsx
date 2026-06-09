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
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../store/AuthContext';
import { PATHS } from '../../../routes/paths';
import { useDashboardData } from '../application/useDashboardData';
import './DashboardPage.css';

const kpiIcons = {
  clock: Clock3,
  users: UsersRound,
  shopping: ShoppingBag,
  truck: Truck,
};

const trackingIcons = {
  'Diseno aprobado': PencilRuler,
  Produccion: Factory,
  'Control de calidad': ShieldCheck,
  Entrega: Truck,
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

const getRoleName = (user) => user?.rol?.nombre || user?.nombreRol || user?.role || 'Cliente';

const formatRole = (roleName) => roleName?.toLowerCase?.() || 'cliente';

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

const MonthlyRevenueChart = ({ data }) => {
  const maxValue = Math.max(1, ...data.map((item) => Math.max(item.revenue, item.orders)));
  const topValue = Math.ceil(maxValue / 10) * 10 || 10;
  const axisSteps = [topValue, Math.round(topValue * 0.75), Math.round(topValue * 0.5), Math.round(topValue * 0.25), 0];

  return (
    <section className="dashboard-panel dashboard-chart-panel">
      <SectionHeader eyebrow="Ventas" title="Ingresos/ventas por mes" />
      <div className="dashboard-chart-layout">
        <div className="dashboard-y-axis" aria-hidden="true">
          {axisSteps.map((step) => <span key={step}>{step}M</span>)}
        </div>
        <div className="dashboard-bars" aria-label="Ingresos y ventas por mes">
          {data.map((item) => (
            <div className="dashboard-bar-group" key={item.month}>
              <div className="dashboard-bar-track">
                <span
                  className="dashboard-bar-orders"
                  style={{ height: `${(item.orders / topValue) * 100}%` }}
                  title={`${item.orders} ventas`}
                />
                <span
                  className="dashboard-bar-revenue"
                  style={{ height: `${(item.revenue / topValue) * 100}%` }}
                  title={`$ ${item.revenue}M COP`}
                />
              </div>
              <strong>{item.month}</strong>
            </div>
          ))}
        </div>
      </div>
      <div className="dashboard-legend">
        <span><i className="legend-sales" />Cantidad de ventas</span>
        <span><i className="legend-income" />Ingresos en millones COP</span>
      </div>
    </section>
  );
};

const StatusDistribution = ({ data }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const conicStops = total > 0
    ? data
        .reduce((acc, item) => {
          const start = acc.current;
          const end = start + (item.value / total) * 100;
          acc.parts.push(`${item.color} ${start}% ${end}%`);
          acc.current = end;
          return acc;
        }, { current: 0, parts: [] })
        .parts.join(', ')
    : '#eef2f5 0% 100%';

  return (
    <section className="dashboard-panel">
      <SectionHeader eyebrow="Estados" title="Distribucion de pedidos" />
      <div className="dashboard-donut-wrap">
        <div className="dashboard-donut" style={{ background: `conic-gradient(${conicStops})` }}>
          <span>{total}</span>
          <small>pedidos</small>
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

const TrackingPanel = ({ tracking }) => (
  <section className="dashboard-panel dashboard-tracking-panel">
    <SectionHeader eyebrow="Seguimiento" title="Progreso del pedido actual" />
    <div className="dashboard-tracking">
      {tracking.map((step, index) => {
        const Icon = trackingIcons[step.label] || Clock3;
        return (
          <article className={step.completed ? 'tracking-step completed' : 'tracking-step'} key={step.label}>
            <span className="tracking-marker">
              <Icon size={20} />
            </span>
            <div>
              <strong>{step.label}</strong>
              <small>{step.completed ? 'Completado' : index === 2 ? 'En revision' : 'Pendiente'}</small>
            </div>
          </article>
        );
      })}
    </div>
  </section>
);

const QuickActions = () => {
  const navigate = useNavigate();
  const actions = [
    { label: 'Crear cotizacion', icon: FileText, onClick: () => navigate(PATHS.SERVICES_QUOTES) },
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

const ClientDashboard = ({ userName, data }) => (
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
        <span>{data.tracking.activeOrder}</span>
      </div>
    </header>

    <section className="dashboard-kpi-grid client-kpis">
      {data.kpis.map((item) => <KpiCard item={item} key={item.label} />)}
    </section>

    <div className="dashboard-grid dashboard-client-grid">
      <TrackingPanel tracking={data.tracking.steps} />
      <QuickActions />
    </div>

    <OrdersTable title="Historial" orders={data.history} showCustomer={false} />
  </div>
);

const DashboardPage = () => {
  const { user } = useAuth();
  const { data, loading, error } = useDashboardData(user);
  const roleName = useMemo(() => formatRole(getRoleName(user)), [user]);
  const userName = user?.nombre || user?.name || user?.correo || user?.email || 'Usuario';
  const isClient = roleName.includes('cliente');

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
