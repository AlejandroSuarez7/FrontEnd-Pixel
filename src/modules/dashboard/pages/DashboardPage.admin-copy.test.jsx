import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { AdminDashboard } from './DashboardPage';

vi.mock('../../../store/AuthContext', () => ({
  useAuth: () => ({ hasPermission: () => false }),
}));

vi.mock('./AdminTrendsPanel', () => ({
  AdminTrendsPanel: () => <div>Resumen de tendencias</div>,
}));

const data = {
  kpis: [],
  revenue: {
    daily: { value: '$ 0', detail: 'Hoy' },
    monthly: { value: '$ 0', detail: 'Este mes' },
    yearly: { value: '$ 0', detail: 'Este año' },
  },
  orderStatus: [],
  latestOrders: [],
  pendingQuotes: { value: 0, readyToPrice: 0, waitingClient: 0 },
  pendingQuotesList: [],
};

describe('AdminDashboard visible copy', () => {
  it('shows human synchronization copy without exposing request details', () => {
    const { container } = render(
      <MemoryRouter>
        <AdminDashboard userName="Admin" data={data} />
      </MemoryRouter>,
    );

    expect(screen.getByText('Datos en tiempo real')).toBeInTheDocument();
    expect(screen.getByText('Información actualizada automáticamente.')).toBeInTheDocument();
    expect(container).not.toHaveTextContent('/api/dashboard/admin');
    expect(container).not.toHaveTextContent('Conectado a /api');
    expect(container).not.toHaveTextContent(/\b(GET|endpoint|request)\b/i);
  });
});
