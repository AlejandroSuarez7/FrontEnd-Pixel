import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TechniqueRatesPage } from './TechniqueRatesPage';

const mocks = vi.hoisted(() => ({ state: {}, listTechniques: vi.fn(), modalProps: null, deleteProps: null, notifications: { success: vi.fn(), error: vi.fn() } }));
vi.mock('../../../../core/hooks/useDebounce', () => ({ useDebounce: (value) => value }));
vi.mock('../../../../store/AuthContext', () => ({ useAuth: () => ({ hasPermission: () => true }) }));
vi.mock('../../../../core/utils/notifications', () => ({ notifications: mocks.notifications }));
vi.mock('../application/useTariffs', () => ({ useTariffs: () => mocks.state }));
vi.mock('../infrastructure/tariff.repository', () => ({ tariffRepository: { listTechniques: mocks.listTechniques } }));
vi.mock('../../../../core/components/Pagination', () => ({ Pagination: ({ onPageChange }) => <button onClick={() => onPageChange(2)}>page-2</button> }));
vi.mock('../../../../shared/components/TableActions/TableActions', () => ({ TableActions: ({ primaryAction, actions = [] }) => <>{[primaryAction, ...actions].filter(Boolean).map((action) => <button key={action.label} onClick={action.onClick}>{action.label}</button>)}</> }));
vi.mock('../presentation/TariffModal', () => ({ TariffModal: (props) => { mocks.modalProps = props; return props.open ? <div data-testid="tariff-modal">{props.tariff?.idTarifa || 'new'}</div> : null; } }));
vi.mock('../../../../shared/components/SafeDeleteModal/SafeDeleteModal', () => ({ SafeDeleteModal: (props) => { mocks.deleteProps = props; return props.isOpen ? <button onClick={props.deleteAction}>confirm-delete</button> : null; } }));

const baseState = () => ({
  tariffs: [
    { idTarifa: 1, tecnica: { nombre: 'DTF' }, anchoHastaCm: 10, altoHastaCm: null, precioUnitario: 5000, estado: true },
    { idTarifa: 2, tecnica: null, anchoHastaCm: null, altoHastaCm: 20, precioUnitario: null, estado: false },
  ],
  paginationMeta: { limit: 10, total: 2, totalPages: 1, hasNextPage: false, hasPrevPage: false }, loading: false, error: null,
  createTariff: vi.fn().mockResolvedValue(), updateTariff: vi.fn().mockResolvedValue(), deleteTariff: vi.fn().mockResolvedValue(), refreshTariffs: vi.fn(),
});

describe('TechniqueRatesPage', () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.state = baseState(); mocks.listTechniques.mockResolvedValue([{ idTecnica: 3, nombre: 'Sublimación' }]); });
  it('loads catalog and runs create, edit and delete flows', async () => {
    render(<TechniqueRatesPage />);
    expect(await screen.findByText('Sublimación')).toBeInTheDocument();
    expect(screen.getAllByText('No especificada')).toHaveLength(2);
    expect(screen.getByText('No especificado')).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText('Buscar por técnica...'), { target: { value: 'dtf' } });
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '3' } });
    fireEvent.click(screen.getByText('Nueva tarifa'));
    await act(() => mocks.modalProps.onSubmit({ idTecnica: 3 }));
    expect(mocks.state.createTariff).toHaveBeenCalled();
    fireEvent.click(screen.getAllByText('Editar')[0]);
    await act(() => mocks.modalProps.onSubmit({ precioUnitario: 10 }));
    expect(mocks.state.updateTariff).toHaveBeenCalledWith(1, { precioUnitario: 10 });
    fireEvent.click(screen.getAllByText('Eliminar')[0]);
    await act(() => mocks.deleteProps.deleteAction());
    expect(mocks.state.deleteTariff).toHaveBeenCalledWith(1);
  });
  it('shows catalog and list errors', async () => {
    mocks.listTechniques.mockRejectedValueOnce(new Error('catalog fail'));
    mocks.state = { ...baseState(), tariffs: [], error: new Error('list fail') };
    render(<TechniqueRatesPage />);
    expect(await screen.findByText('catalog fail')).toBeInTheDocument();
    expect(screen.getByText('No se pudieron cargar las tarifas.')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Reintentar'));
    expect(mocks.state.refreshTariffs).toHaveBeenCalled();
  });
  it.each([
    [{ loading: true }, 'Cargando tarifas...'],
    [{ tariffs: [], error: null }, 'No hay tarifas para los filtros seleccionados.'],
  ])('renders alternate state', (override, text) => {
    mocks.state = { ...baseState(), ...override };
    render(<TechniqueRatesPage />);
    expect(screen.getByText(text)).toBeInTheDocument();
  });
});
