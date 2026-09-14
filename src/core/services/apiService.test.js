import { beforeEach, describe, expect, it, vi } from 'vitest';
import { notifications } from '../utils/notifications';
import {
  handleApiError,
  prepareApiRequest,
  SESSION_EXPIRED_EVENT,
} from './apiService';

vi.mock('../utils/notifications', () => ({
  notifications: {
    error: vi.fn(),
  },
}));

beforeEach(() => {
  localStorage.clear();
  notifications.error.mockClear();
});

describe('apiClient multipart requests', () => {
  it('removes the JSON content type so Axios can generate the multipart boundary', async () => {
    const body = new FormData();
    body.append('archivo', new File(['receipt'], 'receipt.png', { type: 'image/png' }));
    const config = {
      data: body,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const preparedConfig = prepareApiRequest(config);

    expect(preparedConfig.data).toBe(body);
    expect(preparedConfig.headers).not.toHaveProperty('Content-Type');
  });
});

describe('apiClient response errors', () => {
  it('does not redirect or close the session for 403 responses', async () => {
    const currentUrl = window.location.href;
    localStorage.setItem('token', 'valid-token');

    await expect(handleApiError({
      response: {
        status: 403,
        data: { message: 'Permiso insuficiente' },
      },
      message: 'Request failed',
      config: {},
    })).rejects.toMatchObject({
      status: 403,
      isForbidden: true,
      wasNotified: true,
    });

    expect(window.location.href).toBe(currentUrl);
    expect(localStorage.getItem('token')).toBe('valid-token');
    expect(notifications.error).toHaveBeenCalledTimes(1);
  });

  it('does not redirect for server or network failures', async () => {
    const currentUrl = window.location.href;

    await expect(handleApiError({
      response: {
        status: 500,
        data: { message: 'Error interno' },
      },
      message: 'Request failed',
      config: {},
    })).rejects.toMatchObject({ status: 500 });

    expect(window.location.href).toBe(currentUrl);

    localStorage.setItem('token', 'valid-token');
    await expect(handleApiError({
      message: 'Network Error',
      code: 'ERR_NETWORK',
      config: { headers: { Authorization: 'Bearer valid-token' } },
    })).rejects.toMatchObject({
      isNetworkError: true,
      code: 'ERR_NETWORK',
    });

    expect(localStorage.getItem('token')).toBe('valid-token');
    expect(window.location.href).toBe(currentUrl);
  });

  it('clears an authenticated session only for a real 401 response', async () => {
    localStorage.setItem('token', 'expired-token');
    localStorage.setItem('pixel_user', JSON.stringify({ idUsuario: 1 }));
    localStorage.setItem('pixel_permissions', JSON.stringify(['dashboard.admin']));
    const expiredListener = vi.fn();
    window.addEventListener(SESSION_EXPIRED_EVENT, expiredListener);

    await expect(handleApiError({
      response: {
        status: 401,
        data: { message: 'Token vencido' },
      },
      message: 'Request failed',
      config: {
        headers: { Authorization: 'Bearer expired-token' },
        skipAuthRedirect: true,
      },
    })).rejects.toMatchObject({ status: 401 });

    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('pixel_user')).toBeNull();
    expect(localStorage.getItem('pixel_permissions')).toBeNull();
    expect(expiredListener).toHaveBeenCalledTimes(1);
    window.removeEventListener(SESSION_EXPIRED_EVENT, expiredListener);
  });
});
