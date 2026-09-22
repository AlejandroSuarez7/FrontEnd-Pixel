import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import RegisterPage from './RegisterPage';

const mocks = vi.hoisted(() => ({ register: vi.fn(), navigate: vi.fn(), notifications: { success: vi.fn(), warning: vi.fn(), error: vi.fn() } }));
vi.mock('react-router-dom', () => ({ useNavigate: () => mocks.navigate }));
vi.mock('motion/react', () => ({ motion: { div: ({ children, ...props }) => {
  const safeProps = { ...props };
  delete safeProps.initial;
  delete safeProps.whileInView;
  delete safeProps.viewport;
  delete safeProps.transition;
  return <div {...safeProps}>{children}</div>;
} } }));
vi.mock('../../../core/hooks/useAsyncLock', () => ({ useAsyncLock: () => ({ isLocked: false, runLocked: (operation) => operation() }) }));
vi.mock('../../../store/AuthContext', () => ({ useAuth: () => ({ register: mocks.register }) }));
vi.mock('../../../core/utils/notifications', () => ({ notifications: mocks.notifications }));

const fillValidForm = () => {
  fireEvent.change(screen.getByLabelText('Nombre completo'), { target: { value: ' Ana ' } });
  fireEvent.change(screen.getByLabelText(/Telefono/), { target: { value: '300-123-4567abc' } });
  fireEvent.change(screen.getByLabelText('Correo electronico'), { target: { value: 'ana@example.com' } });
  fireEvent.focus(screen.getByLabelText('Contrasena'));
  fireEvent.change(screen.getByLabelText('Contrasena'), { target: { value: 'Clave#123' } });
  fireEvent.change(screen.getByLabelText('Confirmar contrasena'), { target: { value: 'Clave#123' } });
};

describe('RegisterPage', () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.register.mockResolvedValue(); });
  it('validates, shows password rules and registers successfully', async () => {
    render(<RegisterPage />);
    fireEvent.submit(screen.getByRole('button', { name: 'Registrarse' }).closest('form'));
    expect(mocks.notifications.warning).toHaveBeenCalled();
    fillValidForm();
    expect(screen.getByLabelText(/Telefono/)).toHaveValue('3001234567');
    expect(screen.getAllByText('OK')).toHaveLength(5);
    fireEvent.click(screen.getByRole('button', { name: 'Registrarse' }));
    await waitFor(() => expect(mocks.register).toHaveBeenCalledWith({ nombre: ' Ana ', telefono: '3001234567', correo: 'ana@example.com', contrasena: 'Clave#123' }));
    expect(mocks.navigate).toHaveBeenCalledWith('/login');
    fireEvent.click(screen.getByText('Seguir explorando'));
    expect(mocks.navigate).toHaveBeenCalledWith('/');
  });
  it('shows mismatch and registration errors', async () => {
    mocks.register.mockRejectedValueOnce(new Error('correo usado'));
    render(<RegisterPage />);
    fillValidForm();
    fireEvent.change(screen.getByLabelText('Confirmar contrasena'), { target: { value: 'Otra#123' } });
    expect(screen.getByText('No coinciden')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Confirmar contrasena'), { target: { value: 'Clave#123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Registrarse' }));
    expect(await screen.findByText('correo usado')).toBeInTheDocument();
    expect(mocks.notifications.error).toHaveBeenCalledWith('correo usado');
  });
});
