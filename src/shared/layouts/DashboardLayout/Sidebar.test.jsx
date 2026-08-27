import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Sidebar from './Sidebar';

const authState = vi.hoisted(() => ({
  user: { nombre: 'Admin PIXEL', rol: { nombre: 'Administrador' } },
  permissions: [
    'dashboard.admin',
    'roles.ver',
    'usuarios.ver',
    'clientes.ver',
    'categorias_producto.ver',
    'productos.ver',
    'tecnicas.ver',
    'cotizaciones.ver',
    'pedidos.ver',
    'abonos.ver',
    'ventas.ver',
    'proveedores.ver',
    'compras.ver',
    'disenos.produccion',
    'disenos.ver',
  ],
  logout: vi.fn(),
}));

vi.mock('../../../store/AuthContext', () => ({
  useAuth: () => authState,
}));

const renderSidebar = (route) => render(
  <MemoryRouter initialEntries={[route]}>
    <Sidebar />
  </MemoryRouter>,
);

describe('Sidebar accordion', () => {
  beforeEach(() => {
    authState.logout.mockClear();
    window.innerWidth = 1200;
  });

  it('opens only one group and opening Catalogo closes Usuarios', async () => {
    const user = userEvent.setup();
    renderSidebar('/dashboard/users');

    const usersButton = screen.getByTitle('Usuarios');
    const catalogButton = screen.getByTitle('Catalogo');

    await waitFor(() => expect(usersButton).toHaveAttribute('aria-expanded', 'true'));
    expect(screen.getByText('Gestion de Usuarios')).toBeInTheDocument();

    await user.click(catalogButton);

    expect(catalogButton).toHaveAttribute('aria-expanded', 'true');
    expect(usersButton).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('Gestion de Usuarios')).not.toBeInTheDocument();
    expect(screen.getByText('Categorias de productos')).toBeInTheDocument();
    expect(document.querySelectorAll('.menu-toggle.active')).toHaveLength(1);
  });

  it('opens and activates the parent group for a nested route on first render', async () => {
    renderSidebar('/dashboard/services/quotes');

    const salesButton = screen.getByTitle('Ventas');
    await waitFor(() => expect(salesButton).toHaveAttribute('aria-expanded', 'true'));

    expect(salesButton).toHaveClass('active');
    expect(screen.getByText('Gestion de Cotizaciones')).toBeInTheDocument();
    expect(document.querySelectorAll('.menu-toggle.active')).toHaveLength(1);
  });

  it('does not expose Gestion de Abonos as an independent navigation module', async () => {
    renderSidebar('/dashboard/orders');

    await waitFor(() => expect(screen.getByTitle('Ventas')).toHaveAttribute('aria-expanded', 'true'));
    expect(screen.queryByText('Gestion de Abonos')).not.toBeInTheDocument();
    expect(screen.getByText('Gestion de Pedidos')).toBeInTheDocument();
  });
});
