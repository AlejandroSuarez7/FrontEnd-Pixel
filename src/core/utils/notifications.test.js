import { beforeEach, describe, expect, it, vi } from 'vitest';
import { toast } from 'sonner';
import { notifications } from './notifications';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() } }));

describe('notifications', () => {
  beforeEach(() => vi.clearAllMocks());

  it('delegates every notification type with defaults and overrides', () => {
    notifications.success('Listo');
    notifications.warning('Cuidado', { duration: 100 });
    notifications.info('Dato');
    expect(toast.success).toHaveBeenCalledWith('Listo', { duration: 3800 });
    expect(toast.warning).toHaveBeenCalledWith('Cuidado', { duration: 100 });
    expect(toast.info).toHaveBeenCalledWith('Dato', { duration: 3800 });
  });

  it('creates stable error identifiers and accepts explicit options', () => {
    notifications.error('Falló');
    notifications.error('', { id: 'fixed', duration: 200 });
    expect(toast.error).toHaveBeenNthCalledWith(1, 'Falló', {
      id: 'pixel-error:Falló',
      duration: 5200,
    });
    expect(toast.error).toHaveBeenNthCalledWith(2, 'Ocurrio un error inesperado.', {
      id: 'fixed',
      duration: 200,
    });
  });
});
