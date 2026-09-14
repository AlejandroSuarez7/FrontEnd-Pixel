import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAdminTrends } from '../application/useAdminTrends';
import { AdminTrendsPanel } from './AdminTrendsPanel';

vi.mock('../application/useAdminTrends', () => ({
  useAdminTrends: vi.fn(),
}));

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div data-testid="responsive-chart">{children}</div>,
  ComposedChart: ({ children, data }) => (
    <div data-testid="trend-chart" data-series={JSON.stringify(data)}>{children}</div>
  ),
  Area: ({ dataKey }) => <span data-testid="trend-area" data-key={dataKey} />,
  CartesianGrid: () => null,
  Tooltip: () => null,
  XAxis: () => null,
  YAxis: () => null,
}));

const trendData = {
  periodo: {
    fechaInicio: '2026-08-01',
    fechaFin: '2026-08-31',
    granularidad: 'DIA',
    zonaHoraria: 'America/Bogota',
  },
  resumen: { ingresos: 3500000, ventas: 15, pedidos: 18, cotizaciones: 24 },
  series: [{ fecha: '2026-08-10', ingresos: 350000, ventas: 2, pedidos: 3, cotizaciones: 4 }],
};

const makeHookResult = (overrides = {}) => ({
  data: trendData,
  loading: false,
  refreshing: false,
  error: '',
  refetch: vi.fn(),
  ...overrides,
});

describe('AdminTrendsPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAdminTrends.mockReturnValue(makeHookResult());
  });

  it('requests a complete 30-day period by default and renders backend values', () => {
    render(<AdminTrendsPanel />);

    const initialPeriod = useAdminTrends.mock.calls[0][0];
    expect(initialPeriod.fechaInicio).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(initialPeriod.fechaFin).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(initialPeriod.granularidad).toBe('DIA');
    expect(screen.getByText('$ 3.500.000')).toBeInTheDocument();
    expect(screen.getByTestId('trend-chart')).toHaveAttribute(
      'data-series',
      JSON.stringify(trendData.series),
    );
  });

  it('uses one real series and changes the selected metric without another graph', () => {
    render(<AdminTrendsPanel />);

    expect(screen.getAllByTestId('trend-area')).toHaveLength(1);
    expect(screen.getByTestId('trend-area')).toHaveAttribute('data-key', 'ingresos');

    fireEvent.click(screen.getByRole('button', { name: 'Pedidos' }));

    expect(screen.getAllByTestId('trend-area')).toHaveLength(1);
    expect(screen.getByTestId('trend-area')).toHaveAttribute('data-key', 'pedidos');
    expect(screen.getByText('Pedidos en el tiempo')).toBeInTheDocument();
  });

  it('changes quick periods with their expected granularities', () => {
    render(<AdminTrendsPanel />);

    fireEvent.click(screen.getByRole('button', { name: '7 días' }));
    expect(useAdminTrends.mock.calls.at(-1)[0].granularidad).toBe('DIA');

    fireEvent.click(screen.getByRole('button', { name: 'Este año' }));
    expect(useAdminTrends.mock.calls.at(-1)[0]).toMatchObject({
      fechaInicio: expect.stringMatching(/^\d{4}-01-01$/),
      granularidad: 'MES',
    });
  });

  it('applies custom dates and backend granularity together', () => {
    render(<AdminTrendsPanel />);

    fireEvent.click(screen.getByRole('button', { name: 'Personalizado' }));
    fireEvent.change(screen.getByLabelText('Desde'), { target: { value: '2026-01-01' } });
    fireEvent.change(screen.getByLabelText('Hasta'), { target: { value: '2026-08-24' } });
    fireEvent.change(screen.getByLabelText('Granularidad'), { target: { value: 'SEMANA' } });
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar' }));

    expect(useAdminTrends.mock.calls.at(-1)[0]).toEqual({
      fechaInicio: '2026-01-01',
      fechaFin: '2026-08-24',
      granularidad: 'SEMANA',
    });
  });

  it('shows a local loader without replacing the dashboard page', () => {
    useAdminTrends.mockReturnValue(makeHookResult({ data: null, loading: true }));

    render(<AdminTrendsPanel />);

    expect(screen.getByLabelText('Cargando estadísticas')).toBeInTheDocument();
    expect(screen.getByText('Ingresos en el tiempo')).toBeInTheDocument();
  });

  it('shows an isolated error and retries the trend request', () => {
    const refetch = vi.fn();
    useAdminTrends.mockReturnValue(makeHookResult({
      data: null,
      error: 'Servidor no disponible',
      refetch,
    }));

    render(<AdminTrendsPanel />);
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));

    expect(screen.getByText('No pudimos cargar las estadísticas de este periodo.')).toBeInTheDocument();
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('renders a clean empty state for empty or zero-only series', () => {
    useAdminTrends.mockReturnValue(makeHookResult({
      data: {
        ...trendData,
        resumen: { ingresos: 0, ventas: 0, pedidos: 0, cotizaciones: 0 },
        series: [{ fecha: '2026-08-10', ingresos: 0, ventas: 0, pedidos: 0, cotizaciones: 0 }],
      },
    }));

    render(<AdminTrendsPanel />);

    expect(screen.getByText('No hay movimientos registrados en este periodo.')).toBeInTheDocument();
    expect(screen.queryByTestId('trend-chart')).not.toBeInTheDocument();
  });
});
