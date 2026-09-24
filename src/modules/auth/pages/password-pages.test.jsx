import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { notifications } from '../../../core/utils/notifications';
import { authService } from '../services/authService';
import CreateClientPasswordPage from './CreateClientPasswordPage';
import ResetPasswordPage from './ResetPasswordPage';

const navigateMock = vi.fn();

vi.mock('motion/react', async () => {
  return {
    motion: {
      div: ({ children, ...props }) => {
        const cleanProps = { ...props };
        delete cleanProps.initial;
        delete cleanProps.whileInView;
        delete cleanProps.viewport;
        delete cleanProps.transition;
        return <div {...cleanProps}>{children}</div>;
      },
    },
  };
});

vi.mock('react-router-dom', () => ({
  useNavigate: () => navigateMock,
  useParams: () => ({ token: 'token-123' }),
}));

vi.mock('../services/authService', () => ({
  authService: {
    resetPassword: vi.fn(),
    createClientPassword: vi.fn(),
  },
}));

vi.mock('../../../core/utils/notifications', () => ({
  notifications: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  },
}));

describe('password pages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    navigateMock.mockReset();
    authService.resetPassword.mockReset();
    authService.createClientPassword.mockReset();
  });

  it('validates matching passwords on reset password', async () => {
    const user = userEvent.setup();
    render(<ResetPasswordPage />);

    await user.type(screen.getByLabelText(/^nueva/i), 'Valid123*');
    await user.type(screen.getByLabelText(/confirmar/i), 'Other123*');
    await user.click(screen.getByRole('button', { name: /actualizar/i }));

    expect(notifications.warning).toHaveBeenCalledWith('Las contraseñas no coinciden.');
    expect(authService.resetPassword).not.toHaveBeenCalled();
  });

  it('calls reset password endpoint and redirects to login', async () => {
    authService.resetPassword.mockResolvedValueOnce({});
    const user = userEvent.setup();
    render(<ResetPasswordPage />);

    await user.type(screen.getByLabelText(/^nueva/i), 'Valid123*');
    await user.type(screen.getByLabelText(/confirmar/i), 'Valid123*');
    await user.click(screen.getByRole('button', { name: /actualizar/i }));

    await waitFor(() => expect(authService.resetPassword).toHaveBeenCalledWith('token-123', 'Valid123*'));
    expect(notifications.success).toHaveBeenCalledWith('Contraseña actualizada correctamente.');
    expect(navigateMock).toHaveBeenCalledWith('/login');
  });

  it('renders the client password copy with Unicode ñ', () => {
    render(<CreateClientPasswordPage />);

    expect(screen.getByRole('heading', { name: 'Crea tu contraseña' })).toBeInTheDocument();
    expect(screen.getByLabelText('Nueva contraseña')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirmar contraseña')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Crear contraseña' })).toBeInTheDocument();
    expect(document.body).not.toHaveTextContent(/\bcontrasena(?:s)?\b/i);
  });

  it('toggles both client password fields independently without losing their values or submitting', async () => {
    const user = userEvent.setup();
    render(<CreateClientPasswordPage />);
    const passwordInput = screen.getByLabelText('Nueva contraseña');
    const confirmInput = screen.getByLabelText('Confirmar contraseña');

    await user.type(passwordInput, 'Valid123*');
    await user.type(confirmInput, 'Valid123*');
    expect(passwordInput).toHaveAttribute('type', 'password');
    expect(confirmInput).toHaveAttribute('type', 'password');

    await user.click(screen.getByRole('button', { name: 'Mostrar contraseña' }));
    expect(passwordInput).toHaveAttribute('type', 'text');
    expect(confirmInput).toHaveAttribute('type', 'password');
    expect(passwordInput).toHaveValue('Valid123*');
    expect(confirmInput).toHaveValue('Valid123*');

    await user.click(screen.getByRole('button', { name: 'Ocultar contraseña' }));
    expect(passwordInput).toHaveAttribute('type', 'password');

    await user.click(screen.getByRole('button', { name: 'Mostrar confirmación de contraseña' }));
    expect(passwordInput).toHaveAttribute('type', 'password');
    expect(confirmInput).toHaveAttribute('type', 'text');
    expect(passwordInput).toHaveValue('Valid123*');
    expect(confirmInput).toHaveValue('Valid123*');
    expect(authService.createClientPassword).not.toHaveBeenCalled();
  });

  it('keeps the password requirements active while visibility changes', async () => {
    const user = userEvent.setup();
    render(<CreateClientPasswordPage />);
    const passwordInput = screen.getByLabelText('Nueva contraseña');

    await user.type(passwordInput, 'Valid123*');
    expect(screen.getByText('Mínimo 8 caracteres')).toBeInTheDocument();
    expect(screen.getByText('Al menos una mayúscula')).toBeInTheDocument();
    expect(screen.getAllByText('OK')).toHaveLength(5);

    await user.click(screen.getByRole('button', { name: 'Mostrar contraseña' }));
    expect(screen.getAllByText('OK')).toHaveLength(5);
  });

  it('rejects an invalid client password before calling the endpoint', async () => {
    const user = userEvent.setup();
    render(<CreateClientPasswordPage />);

    await user.type(screen.getByLabelText('Nueva contraseña'), 'débil');
    await user.type(screen.getByLabelText('Confirmar contraseña'), 'débil');
    await user.click(screen.getByRole('button', { name: 'Crear contraseña' }));

    expect(notifications.warning).toHaveBeenCalledWith('La contraseña no cumple todos los requisitos.');
    expect(authService.createClientPassword).not.toHaveBeenCalled();
  });

  it('keeps client password matching validation', async () => {
    const user = userEvent.setup();
    render(<CreateClientPasswordPage />);

    await user.type(screen.getByLabelText('Nueva contraseña'), 'Valid123*');
    await user.type(screen.getByLabelText('Confirmar contraseña'), 'Other123*');
    await user.click(screen.getByRole('button', { name: 'Crear contraseña' }));

    expect(notifications.warning).toHaveBeenCalledWith('Las contraseñas no coinciden.');
    expect(authService.createClientPassword).not.toHaveBeenCalled();
  });

  it('calls create client password endpoint and redirects to login', async () => {
    authService.createClientPassword.mockResolvedValueOnce({});
    const user = userEvent.setup();
    render(<CreateClientPasswordPage />);

    await user.type(screen.getByLabelText(/^nueva/i), 'Valid123*');
    await user.type(screen.getByLabelText(/confirmar/i), 'Valid123*');
    await user.click(screen.getByRole('button', { name: 'Crear contraseña' }));

    await waitFor(() => expect(authService.createClientPassword).toHaveBeenCalledWith('token-123', 'Valid123*'));
    expect(notifications.success).toHaveBeenCalledWith('Contraseña creada correctamente. Ya puedes iniciar sesión.');
    expect(navigateMock).toHaveBeenCalledWith('/login');
  });

  it('shows a controlled backend error when client password creation fails', async () => {
    authService.createClientPassword.mockRejectedValueOnce(new Error('Servicio no disponible'));
    const user = userEvent.setup();
    render(<CreateClientPasswordPage />);

    await user.type(screen.getByLabelText('Nueva contraseña'), 'Valid123*');
    await user.type(screen.getByLabelText('Confirmar contraseña'), 'Valid123*');
    await user.click(screen.getByRole('button', { name: 'Crear contraseña' }));

    await waitFor(() => {
      expect(notifications.error).toHaveBeenCalledWith('Servicio no disponible');
    });
    expect(navigateMock).not.toHaveBeenCalled();
  });
});
