import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import LoginPage from './LoginPage';

const navigateMock = vi.fn();
const loginMock = vi.fn();

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
}));

vi.mock('../../../store/AuthContext', () => ({
  useAuth: () => ({
    login: loginMock,
  }),
}));

vi.mock('../../../core/utils/notifications', () => ({
  notifications: {
    error: vi.fn(),
    info: vi.fn(),
  },
}));

describe('LoginPage', () => {
  beforeEach(() => {
    navigateMock.mockReset();
    loginMock.mockReset();
  });

  it('renders login form fields', () => {
    render(<LoginPage />);

    expect(screen.getByRole('heading', { name: /iniciar/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(document.querySelector('#contrasena')).toBeInTheDocument();
  });

  it('shows a controlled error and keeps the page mounted when login fails', async () => {
    loginMock.mockRejectedValueOnce(new Error('Credenciales incorrectas'));
    const user = userEvent.setup();

    render(<LoginPage />);

    await user.type(screen.getByRole('textbox'), 'admin@pixel.com');
    await user.type(document.querySelector('#contrasena'), 'bad-password');
    await user.click(screen.getByRole('button', { name: /iniciar/i }));

    expect(await screen.findByText('Credenciales incorrectas')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveValue('admin@pixel.com');
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it('redirects admin users to the protected dashboard path', async () => {
    loginMock.mockResolvedValueOnce({
      rol: { nombre: 'Admin' },
      codigos: ['dashboard.admin', 'usuarios.ver'],
    });
    const user = userEvent.setup();

    render(<LoginPage />);

    await user.type(screen.getByRole('textbox'), 'admin@pixel.com');
    await user.type(document.querySelector('#contrasena'), 'Valid123*');
    await user.click(screen.getByRole('button', { name: /iniciar/i }));

    await waitFor(() => expect(navigateMock).toHaveBeenCalledWith('/dashboard'));
  });

  it('redirects client users to dashboard without admin menu assumptions', async () => {
    loginMock.mockResolvedValueOnce({
      rol: { nombre: 'Cliente' },
      codigos: ['dashboard.cliente', 'pedidos.cliente.ver'],
    });
    const user = userEvent.setup();

    render(<LoginPage />);

    await user.type(screen.getByRole('textbox'), 'cliente@pixel.com');
    await user.type(document.querySelector('#contrasena'), 'Valid123*');
    await user.click(screen.getByRole('button', { name: /iniciar/i }));

    await waitFor(() => expect(navigateMock).toHaveBeenCalledWith('/dashboard'));
  });
});
