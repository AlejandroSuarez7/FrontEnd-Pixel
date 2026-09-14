import { useMemo, useState } from 'react';
import {
  Area,
  CartesianGrid,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useAdminTrends } from '../application/useAdminTrends';
import {
  ADMIN_TRENDS_PRESETS,
  buildAdminTrendPeriod,
  formatAdminTrendAxisDate,
  formatAdminTrendTooltipDate,
  isCompleteAdminTrendPeriod,
} from '../domain/adminTrends';

const METRICS = {
  ingresos: {
    label: 'Ingresos',
    title: 'Ingresos en el tiempo',
    description: 'Pagos confirmados registrados en PIXEL.',
    color: '#6c5ce7',
  },
  ventas: {
    label: 'Ventas',
    title: 'Ventas en el tiempo',
    description: 'Ventas no anuladas según la fecha de su primer pago.',
    color: '#0984e3',
  },
  pedidos: {
    label: 'Pedidos',
    title: 'Pedidos en el tiempo',
    description: 'Pedidos creados durante el periodo seleccionado.',
    color: '#00a884',
  },
  cotizaciones: {
    label: 'Cotizaciones',
    title: 'Cotizaciones en el tiempo',
    description: 'Cotizaciones creadas durante el periodo seleccionado.',
    color: '#e17b00',
  },
};

const PRESET_OPTIONS = [
  { value: ADMIN_TRENDS_PRESETS.SEVEN_DAYS, label: '7 días' },
  { value: ADMIN_TRENDS_PRESETS.THIRTY_DAYS, label: '30 días' },
  { value: ADMIN_TRENDS_PRESETS.CURRENT_MONTH, label: 'Este mes' },
  { value: ADMIN_TRENDS_PRESETS.CURRENT_YEAR, label: 'Este año' },
  { value: ADMIN_TRENDS_PRESETS.CUSTOM, label: 'Personalizado' },
];

const GRANULARITY_OPTIONS = [
  { value: 'DIA', label: 'Día' },
  { value: 'SEMANA', label: 'Semana' },
  { value: 'MES', label: 'Mes' },
  { value: 'ANIO', label: 'Año' },
];

const formatCop = (value = 0) => `$ ${Number(value || 0).toLocaleString('es-CO')}`;

const formatCopCompact = (value = 0) => {
  const amount = Number(value || 0);

  if (Math.abs(amount) >= 1000000) {
    return `$ ${(amount / 1000000).toLocaleString('es-CO', { maximumFractionDigits: 1 })} M`;
  }

  if (Math.abs(amount) >= 1000) {
    return `$ ${Math.round(amount / 1000).toLocaleString('es-CO')} mil`;
  }

  return `$ ${amount.toLocaleString('es-CO')}`;
};

const formatMetricValue = (metric, value, includeLabel = false) => {
  const amount = Number(value || 0);
  if (metric === 'ingresos') return formatCop(amount);

  const labels = {
    ventas: ['venta', 'ventas'],
    pedidos: ['pedido', 'pedidos'],
    cotizaciones: ['cotización', 'cotizaciones'],
  }[metric];
  const text = `${amount.toLocaleString('es-CO')} ${amount === 1 ? labels[0] : labels[1]}`;

  return includeLabel ? text : amount.toLocaleString('es-CO');
};

const TrendsTooltip = ({ active, payload, label, metric }) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="dashboard-chart-tooltip">
      <strong>{formatAdminTrendTooltipDate(label)}</strong>
      <span style={{ color: METRICS[metric].color }}>
        {metric === 'ingresos'
          ? `Ingresos: ${formatMetricValue(metric, payload[0]?.value, true)}`
          : formatMetricValue(metric, payload[0]?.value, true)}
      </span>
    </div>
  );
};

const PeriodSummary = ({ summary }) => (
  <div className="dashboard-trends-summary" aria-label="Resumen del periodo">
    <div><span>Ingresos</span><strong>{formatCop(summary.ingresos)}</strong></div>
    <div><span>Ventas</span><strong>{Number(summary.ventas || 0).toLocaleString('es-CO')}</strong></div>
    <div><span>Pedidos</span><strong>{Number(summary.pedidos || 0).toLocaleString('es-CO')}</strong></div>
    <div><span>Cotizaciones</span><strong>{Number(summary.cotizaciones || 0).toLocaleString('es-CO')}</strong></div>
  </div>
);

export const AdminTrendsPanel = () => {
  const initialPeriod = useMemo(() => buildAdminTrendPeriod(), []);
  const [preset, setPreset] = useState(ADMIN_TRENDS_PRESETS.THIRTY_DAYS);
  const [period, setPeriod] = useState(initialPeriod);
  const [customPeriod, setCustomPeriod] = useState(initialPeriod);
  const [metric, setMetric] = useState('ingresos');
  const { data, loading, refreshing, error, refetch } = useAdminTrends(period);
  const metricConfig = METRICS[metric];
  const series = data?.series || [];
  const hasData = series.some((point) => Number(point[metric] || 0) > 0);
  const effectiveGranularity = data?.periodo?.granularidad || period.granularidad;
  const customPeriodIsValid = isCompleteAdminTrendPeriod(customPeriod);

  const selectPreset = (nextPreset) => {
    setPreset(nextPreset);
    if (nextPreset === ADMIN_TRENDS_PRESETS.CUSTOM) {
      setCustomPeriod(period);
      return;
    }

    const nextPeriod = buildAdminTrendPeriod(nextPreset);
    setPeriod(nextPeriod);
    setCustomPeriod(nextPeriod);
  };

  const applyCustomPeriod = () => {
    if (!customPeriodIsValid) return;
    setPeriod({ ...customPeriod });
  };

  return (
    <section className="dashboard-panel dashboard-chart-panel dashboard-trends-panel">
      <div className="dashboard-trends-heading">
        <div className="dashboard-section-header">
          <span>Analítica histórica</span>
          <h2>{metricConfig.title}</h2>
          <p>{metricConfig.description}</p>
        </div>
        {refreshing && <span className="dashboard-trends-refreshing">Actualizando...</span>}
      </div>

      <div className="dashboard-trends-toolbar">
        <div className="dashboard-trends-presets" aria-label="Periodo de las estadísticas">
          {PRESET_OPTIONS.map((option) => (
            <button
              type="button"
              key={option.value}
              className={preset === option.value ? 'active' : ''}
              aria-pressed={preset === option.value}
              onClick={() => selectPreset(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="dashboard-trends-metrics" aria-label="Métrica de la gráfica">
          {Object.entries(METRICS).map(([key, option]) => (
            <button
              type="button"
              key={key}
              className={metric === key ? 'active' : ''}
              aria-pressed={metric === key}
              onClick={() => setMetric(key)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {preset === ADMIN_TRENDS_PRESETS.CUSTOM && (
        <div className="dashboard-trends-custom">
          <label>
            <span>Desde</span>
            <input
              type="date"
              value={customPeriod.fechaInicio}
              max={customPeriod.fechaFin || undefined}
              onChange={(event) => setCustomPeriod((current) => ({
                ...current,
                fechaInicio: event.target.value,
              }))}
            />
          </label>
          <label>
            <span>Hasta</span>
            <input
              type="date"
              value={customPeriod.fechaFin}
              min={customPeriod.fechaInicio || undefined}
              onChange={(event) => setCustomPeriod((current) => ({
                ...current,
                fechaFin: event.target.value,
              }))}
            />
          </label>
          <label>
            <span>Granularidad</span>
            <select
              value={customPeriod.granularidad}
              onChange={(event) => setCustomPeriod((current) => ({
                ...current,
                granularidad: event.target.value,
              }))}
            >
              {GRANULARITY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="dashboard-trends-apply"
            disabled={!customPeriodIsValid}
            onClick={applyCustomPeriod}
          >
            Aplicar
          </button>
          {!customPeriodIsValid && (
            <span className="dashboard-trends-validation">Selecciona un rango de fechas válido.</span>
          )}
        </div>
      )}

      {loading ? (
        <div className="dashboard-trends-loading" aria-label="Cargando estadísticas">
          <span />
          <span />
          <span />
        </div>
      ) : error ? (
        <div className="dashboard-chart-empty dashboard-trends-error">
          <strong>No pudimos cargar las estadísticas de este periodo.</strong>
          <button type="button" onClick={refetch}>Reintentar</button>
        </div>
      ) : (
        <>
          <PeriodSummary summary={data?.resumen || {}} />
          {!hasData ? (
            <div className="dashboard-chart-empty">
              <strong>No hay movimientos registrados en este periodo.</strong>
              <span>Prueba con otro rango para consultar la actividad histórica.</span>
            </div>
          ) : (
            <div className="dashboard-recharts-wrap" aria-label={metricConfig.title}>
              <ResponsiveContainer width="100%" height={292}>
                <ComposedChart data={series} margin={{ top: 12, right: 8, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id={`dashboardTrendGradient-${metric}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={metricConfig.color} stopOpacity={0.28} />
                      <stop offset="95%" stopColor={metricConfig.color} stopOpacity={0.03} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#edf1f7" vertical={false} />
                  <XAxis
                    dataKey="fecha"
                    axisLine={false}
                    tickLine={false}
                    minTickGap={24}
                    tick={{ fill: '#8f9bb3', fontSize: 11, fontWeight: 500 }}
                    tickFormatter={(value) => formatAdminTrendAxisDate(value, effectiveGranularity)}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={metric === 'ingresos'}
                    tick={{ fill: '#8f9bb3', fontSize: 11, fontWeight: 500 }}
                    tickFormatter={(value) => metric === 'ingresos'
                      ? formatCopCompact(value)
                      : Number(value || 0).toLocaleString('es-CO')}
                    width={metric === 'ingresos' ? 72 : 42}
                  />
                  <Tooltip
                    content={<TrendsTooltip metric={metric} />}
                    cursor={{ fill: 'rgba(108, 92, 231, 0.05)' }}
                  />
                  <Area
                    type="monotone"
                    dataKey={metric}
                    name={metricConfig.label}
                    stroke={metricConfig.color}
                    strokeWidth={3}
                    fill={`url(#dashboardTrendGradient-${metric})`}
                    activeDot={{ r: 5, strokeWidth: 2 }}
                    isAnimationActive={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}
    </section>
  );
};

export default AdminTrendsPanel;
