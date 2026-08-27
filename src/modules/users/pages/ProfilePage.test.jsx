import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ProfilePage from './ProfilePage';

const mocks = vi.hoisted(() => ({
  update: vi.fn(),
  updateSession: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  user: {
    idUsuario: 7,
    nombre: 'Admin PIXEL',
    correo: 'admin@pixel.com',
    telefono: '3001234567',
    idRol: 1,
    estado: true,
  },
}));

vi.mock('../../../store/AuthContext', () => ({
  useAuth: () => ({
    user: mocks.user,
    updateSession: mocks.updateSession,
  }),
}));

vi.mock('../infrastructure/user.repository', () => ({
  UserApiRepository: class {
    update(...args) {
      return mocks.update(...args);
    }
  },
}));

vi.mock('../../../core/utils/notifications', () => ({
  notifications: {
    success: mocks.success,
    error: mocks.error,
    warning: mocks.warning,
  },
}));

describe('ProfilePage password editing', () => {
  beforeEach(() => {
    mocks.update.mockReset().mockResolvedValue({
      nombre: 'Admin PIXEL',
      correo: 'admin@pixel.com',
      telefono: '3001234567',
      estado: true,
    });
    mocks.updateSession.mockReset();
    mocks.success.mockReset();
    mocks.error.mockReset();
    mocks.warning.mockReset();
  });

  it('keeps password fields hidden and omits password when saving the profile', async () => {
    const user = userEvent.setup();
    render(<ProfilePage />);

    expect(screen.getByText('Tu contraseña permanece protegida.')).toBeInTheDocument();
    expect(screen.queryByLabelText('Nueva contraseña *')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    await waitFor(() => expect(mocks.update).toHaveBeenCalledOnce());
    expect(mocks.update.mock.calls[0][1]).not.toHaveProperty('contrasena');
  });

  it('reveals validated fields and sends the password only when the change is active', async () => {
    const user = userEvent.setup();
    render(<ProfilePage />);

    await user.click(screen.getByRole('button', { name: 'Cambiar contraseña' }));
    await user.type(screen.getByLabelText('Nueva contraseña *'), 'Segura123*');
    await user.type(screen.getByLabelText('Confirmar contraseña *'), 'Segura123*');
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    await waitFor(() => expect(mocks.update).toHaveBeenCalledOnce());
    expect(mocks.update.mock.calls[0][1]).toMatchObject({ contrasena: 'Segura123*' });
  });

  it('cancels the password change, clears both values and omits them from the payload', async () => {
    const user = userEvent.setup();
    render(<ProfilePage />);

    await user.click(screen.getByRole('button', { name: 'Cambiar contraseña' }));
    await user.type(screen.getByLabelText('Nueva contraseña *'), 'Segura123*');
    await user.type(screen.getByLabelText('Confirmar contraseña *'), 'Otra123*');
    await user.click(screen.getByRole('button', { name: 'Cancelar cambio de contraseña' }));

    expect(screen.queryByLabelText('Nueva contraseña *')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Cambiar contraseña' }));
    expect(screen.getByLabelText('Nueva contraseña *')).toHaveValue('');
    expect(screen.getByLabelText('Confirmar contraseña *')).toHaveValue('');

    await user.click(screen.getByRole('button', { name: 'Cancelar cambio de contraseña' }));
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    await waitFor(() => expect(mocks.update).toHaveBeenCalledOnce());
    expect(mocks.update.mock.calls[0][1]).not.toHaveProperty('contrasena');
  });
});
