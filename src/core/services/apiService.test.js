import { describe, expect, it, vi } from 'vitest';
import { notifications } from '../utils/notifications';
import { apiClient } from './apiService';

vi.mock('../utils/notifications', () => ({
  notifications: {
    error: vi.fn(),
  },
}));

describe('apiClient', () => {
  it('uses a 5000 ms timeout for frontend feedback', () => {
    expect(apiClient.defaults.timeout).toBe(5000);
  });

  it('normalizes timeout errors with a clear message', async () => {
    const rejected = apiClient.interceptors.response.handlers[0].rejected;

    await expect(rejected({ code: 'ECONNABORTED', message: 'timeout exceeded' }))
      .rejects
      .toMatchObject({
        message: 'La solicitud tardó demasiado. Intenta nuevamente.',
        isTimeout: true,
      });

    expect(notifications.error).toHaveBeenCalledWith('La solicitud tardó demasiado. Intenta nuevamente.');
  });
});
