import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UserFormModal } from './UserFormModal';

const mocks = vi.hoisted(() => ({ notifications: { warning: vi.fn(), error: vi.fn() } }));
vi.mock('../../../core/hooks/useAsyncLock', () => ({ useAsyncLock: () => ({ isLocked: false, runLocked: (operation) => operation() }) }));
vi.mock('../../../core/utils/notifications', () => ({ notifications: mocks.notifications }));

const complete = () => {
  fireEvent.change(screen.getByLabelText('Nombre completo *'), { target: { value: ' Ana ' } });
  fireEvent.change(screen.getByLabelText('Correo electrónico *'), { target: { value: 'ANA@EXAMPLE.COM' } });
  fireEvent.change(screen.getByLabelText('Documento (ID)'), { target: { value: '10a20b304050' } });
  fireEvent.change(screen.getByLabelText('Teléfono'), { target: { value: '300x1234567' } });
  fireEvent.change(screen.getByLabelText('Rol del sistema *'), { target: { value: '2' } });
  fireEvent.change(screen.getByLabelText('Dirección de residencia'), { target: { value: ' Calle 1 ' } });
  fireEvent.change(screen.getByLabelText(/Contraseña/), { target: { value: 'Clave#123' } });
};

describe('UserFormModal', () => {
  beforeEach(() => vi.clearAllMocks());
  it('returns null when closed and validates before create', () => {
    const { container } = render(<UserFormModal isOpen={false} />);
    expect(container).toBeEmptyDOMElement();
    const onSubmit = vi.fn();
    render(<UserFormModal isOpen onSubmit={onSubmit} onClose={vi.fn()} roles={[{ id: 2, nombre: 'Operador' }]} />);
    fireEvent.submit(screen.getByText('Crear usuario').closest('form'));
    expect(mocks.notifications.warning).toHaveBeenCalled();
    expect(onSubmit).not.toHaveBeenCalled();
  });
  it('normalizes and submits a new user', async () => {
    const onSubmit = vi.fn().mockResolvedValue();
    render(<UserFormModal isOpen onSubmit={onSubmit} onClose={vi.fn()} roles={[{ id: 2, nombre: 'Operador' }]} />);
    complete();
    expect(screen.getByLabelText('Documento (ID)')).toHaveValue('1020304050');
    expect(screen.getAllByText(/OK/)).toHaveLength(5);
    fireEvent.click(screen.getByText('Crear usuario'));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ nombre: 'Ana', documento: '1020304050', correo: 'ana@example.com', telefono: '3001234567', direccion: 'Calle 1', idRol: 2, estado: true, contrasena: 'Clave#123' }));
  });
  it('edits status without requiring a password and handles errors', async () => {
    const onSubmit = vi.fn().mockRejectedValueOnce(new Error('falló'));
    const onClose = vi.fn();
    render(<UserFormModal isOpen onSubmit={onSubmit} onClose={onClose} user={{ nombre: 'Ana', correo: 'a@b.co', documento: '1234567890', telefono: '3001234567', idRol: 2, estado: true }} roles={[{ idRol: 2, nombre: 'Admin' }]} />);
    fireEvent.change(screen.getByLabelText('Estado de cuenta'), { target: { value: 'false' } });
    fireEvent.click(screen.getByText('Guardar cambios'));
    await waitFor(() => expect(mocks.notifications.error).toHaveBeenCalledWith('falló'));
    fireEvent.click(screen.getByText('Cancelar'));
    expect(onClose).toHaveBeenCalled();
  });
});
