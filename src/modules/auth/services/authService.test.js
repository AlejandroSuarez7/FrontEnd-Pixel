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
});
