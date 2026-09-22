import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ClientDisenosPage } from './ClientDisenosPage';

const mocks = vi.hoisted(() => ({ listState: {}, config: null, confirm: vi.fn(), repository: { listClientDesigns: vi.fn(), getClientDesign: vi.fn(), approveClientDesign: vi.fn(), rejectClientDesign: vi.fn() }, viewProps: null, notifications: { success: vi.fn(), error: vi.fn() } }));
vi.mock('../../../../core/hooks/useLatestListRequest', () => ({ useLatestListRequest: (config) => { mocks.config = config; return mocks.listState; } }));
vi.mock('../../../../core/hooks/useAsyncLock', () => ({ useAsyncLock: () => ({ isLocked: false, runLocked: (operation) => operation() }) }));
vi.mock('../../../../store/AuthContext', () => ({ useAuth: () => ({ hasPermission: () => true }) }));
vi.mock('../../../../shared/components/ConfirmDialog/ConfirmProvider', () => ({ useConfirm: () => mocks.confirm }));
vi.mock('../../../../core/utils/notifications', () => ({ notifications: mocks.notifications }));
vi.mock('../infrastructure/diseno.repository', () => ({ disenoRepository: mocks.repository }));
vi.mock('./DisenoViewModal', () => ({ DisenoViewModal: (props) => { mocks.viewProps = props; return props.isOpen ? <div data-testid="client-design-view">view</div> : null; } }));

const design = (overrides) => ({ idDiseno: 1, idPedido: 10, estado: 'ENVIADO', origenDiseno: 'CLIENTE', medioRecepcion: 'WEB', fechaEnvio: '2026-01-01', descripcion: 'Logo', detallePedido: { producto: { nombre: 'Camiseta' }, tecnica: { nombre: 'DTF' }, cantidad: 2 }, ...overrides });
const baseState = () => ({
  data: [
    design({ idDiseno: 1 }),
    design({ idDiseno: 2, estado: 'APROBADO', esDisenoGeneral: true, origenDiseno: 'ADMIN' }),
    design({ idDiseno: 3, estado: 'RECHAZADO', observacionesCliente: '' }),
  ],
  loading: false, error: null, refetch: vi.fn().mockResolvedValue(),
});

describe('ClientDisenosPage', () => {
  beforeEach(() => {
    vi.clearAllMocks(); mocks.listState = baseState(); mocks.confirm.mockResolvedValue(true);
    mocks.repository.listClientDesigns.mockResolvedValue([]); mocks.repository.getClientDesign.mockResolvedValue(design({ idDiseno: 1, descripcion: 'Detalle' }));
    mocks.repository.approveClientDesign.mockResolvedValue({ data: { pedido: { estadoPedido: 'EN_PROCESO' } } });
    mocks.repository.rejectClientDesign.mockResolvedValue({});
  });
  it('loads, views, approves and rejects designs', async () => {
    render(<ClientDisenosPage />);
    await mocks.config.load('signal');
    expect(mocks.repository.listClientDesigns).toHaveBeenCalledWith({ signal: 'signal' });
    expect(screen.getByText('Aplica a todos los productos que requieren diseño.')).toBeInTheDocument();
    expect(screen.getByText(/Sin observaciones registradas/)).toBeInTheDocument();
    fireEvent.click(screen.getAllByText('Ver detalle')[0]);
    expect(await screen.findByTestId('client-design-view')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Aprobar'));
    await waitFor(() => expect(mocks.repository.approveClientDesign).toHaveBeenCalledWith(1));
    mocks.confirm.mockResolvedValueOnce({ confirmed: true, value: 'Más azul' });
    fireEvent.click(screen.getByText('Solicitar cambios'));
    await waitFor(() => expect(mocks.repository.rejectClientDesign).toHaveBeenCalledWith(1, { observacionesCliente: 'Más azul' }));
  });
  it('handles declined and failed detail/approval paths', async () => {
    mocks.repository.getClientDesign.mockRejectedValueOnce(new Error('detail fail'));
    mocks.confirm.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    mocks.repository.approveClientDesign.mockRejectedValueOnce(new Error('approve fail'));
    render(<ClientDisenosPage />);
    fireEvent.click(screen.getAllByText('Ver detalle')[0]);
    await waitFor(() => expect(mocks.notifications.error).toHaveBeenCalledWith('detail fail'));
    fireEvent.click(screen.getByText('Aprobar'));
    expect(mocks.repository.approveClientDesign).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText('Aprobar'));
    await waitFor(() => expect(mocks.notifications.error).toHaveBeenCalledWith('approve fail'));
  });
  it.each([
    [{ loading: true }, 'Cargando tus diseños...'],
    [{ data: [], error: new Error('x') }, 'No fue posible cargar tus diseños.'],
    [{ data: [], error: null }, 'Aún no tienes diseños enviados para revisar.'],
  ])('renders alternate state', (override, text) => {
    mocks.listState = { ...baseState(), ...override };
    render(<ClientDisenosPage />);
    expect(screen.getByText(text)).toBeInTheDocument();
  });
});
