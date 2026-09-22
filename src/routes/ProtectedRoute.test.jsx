import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ProtectedRoute from './ProtectedRoute';

const mocks = vi.hoisted(() => ({
  pathname: '/pedidos',
  auth: { user: { id: 1 }, permissions: ['pedidos.ver'], loading: false },
  canAccessPath: vi.fn(),
  getDefaultProtectedPath: vi.fn(),
}));

vi.mock('react-router-dom', () => ({
  useLocation: () => ({ pathname: mocks.pathname }),
  Navigate: ({ to, replace }) => <div data-testid="navigate" data-to={to} data-replace={String(replace)} />,
}));

vi.mock('../store/AuthContext', () => ({ useAuth: () => mocks.auth }));

vi.mock('./SIDEBAR_CONFIG', () => ({
  canAccessPath: (...args) => mocks.canAccessPath(...args),
  getDefaultProtectedPath: (...args) => mocks.getDefaultProtectedPath(...args),
}));

describe('ProtectedRoute', () => {
  beforeEach(() => {
    mocks.pathname = '/pedidos';
    mocks.auth = { user: { id: 1 }, permissions: ['pedidos.ver'], loading: false };
    mocks.canAccessPath.mockReset().mockReturnValue(false);
    mocks.getDefaultProtectedPath.mockReset().mockReturnValue(null);
  });

  it('renders nothing while authentication is loading', () => {
    mocks.auth = { user: null, permissions: [], loading: true };
    const { container } = render(<ProtectedRoute><p>Privado</p></ProtectedRoute>);
    expect(container).toBeEmptyDOMElement();
  });

  it('redirects anonymous users to login', () => {
    mocks.auth = { user: null, permissions: [], loading: false };
    render(<ProtectedRoute><p>Privado</p></ProtectedRoute>);
    expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/login');
  });

  it('renders children when the current path is allowed', () => {
    mocks.canAccessPath.mockReturnValue(true);
    render(<ProtectedRoute><p>Contenido privado</p></ProtectedRoute>);
    expect(screen.getByText('Contenido privado')).toBeInTheDocument();
    expect(mocks.canAccessPath).toHaveBeenCalledWith(
      ['pedidos.ver'],
      '/pedidos',
      { id: 1 },
    );
  });

  it('redirects to the first available protected path', () => {
    mocks.getDefaultProtectedPath.mockReturnValue('/productos');
    render(<ProtectedRoute><p>Privado</p></ProtectedRoute>);
    expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/productos');
  });

  it('falls back to the dashboard outside it', () => {
    mocks.pathname = '/sin-permiso';
    render(<ProtectedRoute><p>Privado</p></ProtectedRoute>);
    expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/dashboard');
  });

  it('shows the permission warning when no dashboard access exists', () => {
    mocks.pathname = '/dashboard';
    mocks.getDefaultProtectedPath.mockReturnValue('/dashboard');
    render(<ProtectedRoute><p>Privado</p></ProtectedRoute>);
    expect(screen.getByText(/No tienes permisos/)).toBeInTheDocument();
  });
});
