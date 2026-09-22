import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SESSION_EXPIRED_EVENT } from '../core/services/apiService';
import { authService } from '../modules/auth/services/authService';
import { useAuth } from './AuthContext';
import { AuthProvider } from './AuthProvider';

vi.mock('../modules/auth/services/authService', () => ({
  authService: {
    getSession: vi.fn(),
    getToken: vi.fn(),
    fetchPermissions: vi.fn(),
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  },
}));

const AuthConsumer = () => {
  const auth = useAuth();
  return (
    <div>
      <span data-testid="loading">{String(auth.loading)}</span>
      <span data-testid="user">{auth.user?.nombre || 'anonymous'}</span>
      <span data-testid="permissions">{auth.permissions.join(',')}</span>
      <span data-testid="permission-checks">
        {String(auth.hasPermission('ventas.ver'))}-
        {String(auth.hasAnyPermission(['missing', 'ventas.ver']))}-
        {String(auth.hasAllPermissions(['ventas.ver', 'ventas.editar']))}
      </span>
      <button type="button" onClick={() => auth.login('ana@example.com', 'secret')}>Login</button>
      <button type="button" onClick={() => auth.register({ nombre: 'Ana' })}>Register</button>
      <button type="button" onClick={() => auth.updateSession({ nombre: 'Actualizada' })}>Update</button>
      <button type="button" onClick={auth.logout}>Logout</button>
    </div>
  );
};

describe('AuthProvider', () => {
  beforeEach(() => {
    authService.getSession.mockReturnValue(null);
    authService.getToken.mockReturnValue(null);
    authService.fetchPermissions.mockResolvedValue({ permisos: [], codigos: [] });
    authService.login.mockResolvedValue({ nombre: 'Ana', codigos: ['ventas.ver', 'ventas.editar'] });
    authService.register.mockResolvedValue({ ok: true });
  });

  it('starts without a session and supports the complete authentication lifecycle', async () => {
    const user = userEvent.setup();
    render(<AuthProvider><AuthConsumer /></AuthProvider>);

    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));
    expect(screen.getByTestId('user')).toHaveTextContent('anonymous');

    await user.click(screen.getByRole('button', { name: 'Login' }));
    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('Ana'));
    expect(authService.login).toHaveBeenCalledWith('ana@example.com', 'secret');
    expect(screen.getByTestId('permission-checks')).toHaveTextContent('true-true-true');

    await user.click(screen.getByRole('button', { name: 'Register' }));
    await waitFor(() => expect(authService.register).toHaveBeenCalledWith({ nombre: 'Ana' }));

    await user.click(screen.getByRole('button', { name: 'Update' }));
    expect(screen.getByTestId('user')).toHaveTextContent('Actualizada');
    expect(JSON.parse(localStorage.getItem('pixel_user'))).toEqual(expect.objectContaining({
      nombre: 'Actualizada',
      codigos: ['ventas.ver', 'ventas.editar'],
    }));

    await user.click(screen.getByRole('button', { name: 'Logout' }));
    expect(authService.logout).toHaveBeenCalled();
    expect(screen.getByTestId('user')).toHaveTextContent('anonymous');
    expect(screen.getByTestId('permissions')).toBeEmptyDOMElement();
  });

  it('restores a session, refreshes permissions, and reacts to session expiration', async () => {
    authService.getSession.mockReturnValue({ nombre: 'Guardada', codigos: ['ventas.ver'] });
    authService.getToken.mockReturnValue('token');
    authService.fetchPermissions.mockResolvedValue({
      permisos: [{ codigo: 'ventas.editar' }],
      codigos: ['ventas.ver', 'ventas.editar'],
    });

    render(<AuthProvider><AuthConsumer /></AuthProvider>);

    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));
    expect(screen.getByTestId('permissions')).toHaveTextContent('ventas.ver,ventas.editar');
    expect(JSON.parse(localStorage.getItem('pixel_user'))).toEqual(expect.objectContaining({
      nombre: 'Guardada',
      permisos: [{ codigo: 'ventas.editar' }],
    }));

    act(() => window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT)));
    expect(screen.getByTestId('user')).toHaveTextContent('anonymous');
    expect(screen.getByTestId('permissions')).toBeEmptyDOMElement();
  });

  it('keeps the restored session when refreshing permissions fails', async () => {
    const error = new Error('network');
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    authService.getSession.mockReturnValue({ nombre: 'Guardada', codigos: ['ventas.ver'] });
    authService.getToken.mockReturnValue('token');
    authService.fetchPermissions.mockRejectedValue(error);

    render(<AuthProvider><AuthConsumer /></AuthProvider>);

    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));
    expect(screen.getByTestId('user')).toHaveTextContent('Guardada');
    expect(consoleError).toHaveBeenCalledWith(
      'No se pudieron refrescar los permisos de sesion:',
      error,
    );
    consoleError.mockRestore();
  });
});
