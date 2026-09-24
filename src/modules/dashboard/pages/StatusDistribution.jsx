import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

const ChartEmptyState = () => (
  <div className="dashboard-chart-empty">
    <strong>No hay datos suficientes para mostrar esta gráfica.</strong>
    <span>Cuando existan registros confirmados, la visualización aparecerá aquí.</span>
  </div>
);

const StatusDistribution = ({ data }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const chartData = data.filter((item) => Number(item.value || 0) > 0);

  return (
    <section className="dashboard-panel dashboard-status-panel">
      <div className="dashboard-section-header">
        <span>Estados</span>
        <h2>Distribución de pedidos</h2>
      </div>
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

export default StatusDistribution;
