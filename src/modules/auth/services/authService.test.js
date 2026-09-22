import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '../../../core/services/apiService';
import { authService } from './authService';

vi.mock('../../../core/services/apiService', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe('authService session persistence', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('stores the complete session only after permissions load', async () => {
    apiClient.post.mockResolvedValueOnce({
      data: {
        data: {
          token: 'token-ok',
          usuario: { idUsuario: 1, correo: 'admin@pixel.com' },
        },
      },
    });
    apiClient.get.mockResolvedValueOnce({
      data: {
        data: {
          permisos: [],
          codigos: ['dashboard.admin'],
        },
      },
    });

    const session = await authService.login('admin@pixel.com', 'secret');

    expect(session.codigos).toEqual(['dashboard.admin']);
    expect(localStorage.getItem('token')).toBe('token-ok');
    expect(JSON.parse(localStorage.getItem('pixel_user')).idUsuario).toBe(1);
  });

  it('removes an orphan token when permissions fail during login', async () => {
    apiClient.post.mockResolvedValueOnce({
      data: {
        data: {
          token: 'orphan-token',
          usuario: { idUsuario: 1 },
        },
      },
    });
    apiClient.get.mockRejectedValueOnce(new Error('Network Error'));

    await expect(authService.login('admin@pixel.com', 'secret')).rejects.toThrow('Network Error');

    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('pixel_user')).toBeNull();
    expect(localStorage.getItem('pixel_permissions')).toBeNull();
  });

  it('normalizes and persists permissions from backend aliases', async () => {
    apiClient.get.mockResolvedValueOnce({
      data: { data: { usuario: { idUsuario: 2 }, permisos: [{ codigo: 'ventas.ver' }] } },
    });

    const result = await authService.fetchPermissions();

    expect(result.usuario.idUsuario).toBe(2);
    expect(result.codigos).toEqual(['ventas.ver']);
    expect(JSON.parse(localStorage.getItem('pixel_permissions'))).toEqual(['ventas.ver']);
  });

  it.each([
    ['register', [{ nombre: 'Ana', telefono: '300', correo: 'a@b.co', contrasena: 'secret' }], '/api/auth/register', { nombre: 'Ana', telefono: '300', correo: 'a@b.co', contrasena: 'secret' }],
    ['forgotPassword', ['a@b.co'], '/api/auth/forgot-password', { correo: 'a@b.co' }],
    ['resetPassword', ['token-reset', 'new-pass'], '/api/auth/reset-password', { token: 'token-reset', password: 'new-pass' }],
    ['createClientPassword', ['token-client', 'new-pass'], '/api/auth/cliente/crear-password', { token: 'token-client', password: 'new-pass' }],
  ])('calls the exact endpoint from %s', async (method, args, endpoint, payload) => {
    apiClient.post.mockResolvedValueOnce({ data: { ok: true } });
    await expect(authService[method](...args)).resolves.toEqual({ ok: true });
    expect(apiClient.post).toHaveBeenCalledWith(endpoint, payload);
  });

  it('reads token and session data and normalizes stored permission codes', () => {
    localStorage.setItem('token', 'token-read');
    localStorage.setItem('pixel_user', JSON.stringify({ id: 3, codigos: ['fallback.ver'] }));
    localStorage.setItem('pixel_permissions', JSON.stringify([{ codigo: 'roles.ver' }]));

    expect(authService.getToken()).toBe('token-read');
    expect(authService.getSession()).toEqual({ id: 3, codigos: ['roles.ver'] });
  });

  it('falls back to session permissions and rejects invalid sessions', () => {
    localStorage.setItem('pixel_user', JSON.stringify({ id: 4, codigos: ['dashboard.ver'] }));
    expect(authService.getSession().codigos).toEqual(['dashboard.ver']);

    localStorage.setItem('pixel_user', '{invalid');
    expect(authService.getSession()).toBeNull();
    localStorage.removeItem('pixel_user');
    expect(authService.getSession()).toBeNull();
  });

  it('clears every session key on logout', () => {
    localStorage.setItem('token', 'x');
    localStorage.setItem('pixel_user', '{}');
    localStorage.setItem('pixel_permissions', '[]');
    authService.logout();
    expect(localStorage).toHaveLength(0);
  });
});
