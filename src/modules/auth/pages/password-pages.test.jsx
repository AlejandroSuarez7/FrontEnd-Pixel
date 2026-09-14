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

    expect(notifications.warning).toHaveBeenCalledWith('Las contrasenas no coinciden.');
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
    expect(notifications.success).toHaveBeenCalledWith('Contrasena actualizada correctamente.');
    expect(navigateMock).toHaveBeenCalledWith('/login');
  });

  it('calls create client password endpoint and redirects to login', async () => {
    authService.createClientPassword.mockResolvedValueOnce({});
    const user = userEvent.setup();
    render(<CreateClientPasswordPage />);

    await user.type(screen.getByLabelText(/^nueva/i), 'Valid123*');
    await user.type(screen.getByLabelText(/confirmar/i), 'Valid123*');
    await user.click(screen.getByRole('button', { name: /crear contrasena/i }));

    await waitFor(() => expect(authService.createClientPassword).toHaveBeenCalledWith('token-123', 'Valid123*'));
    expect(notifications.success).toHaveBeenCalledWith('Contrasena creada correctamente. Ya puedes iniciar sesion.');
    expect(navigateMock).toHaveBeenCalledWith('/login');
  });
});
