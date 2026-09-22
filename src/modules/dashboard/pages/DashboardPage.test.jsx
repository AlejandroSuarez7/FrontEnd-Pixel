import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import DashboardPage, { ClientDesignFilePanel } from './DashboardPage';

const mocks = vi.hoisted(() => ({
  dashboard: {}, auth: {}, isClient: false, navigate: vi.fn(), uploaderProps: null,
  pedidoRepository: { saveClientDesignUrl: vi.fn() }, disenoRepository: { uploadClientDesign: vi.fn() },
  notifications: { success: vi.fn(), warning: vi.fn(), error: vi.fn() },
}));
vi.mock('react-router-dom', () => ({ useNavigate: () => mocks.navigate }));
vi.mock('../../../store/AuthContext', () => ({ useAuth: () => mocks.auth }));
vi.mock('../../../core/utils/permissions', () => ({ isClientUser: () => mocks.isClient }));
vi.mock('../application/useDashboardData', () => ({ useDashboardData: () => mocks.dashboard }));
vi.mock('../../../core/utils/notifications', () => ({ notifications: mocks.notifications }));
vi.mock('../../sales/pedidos/infrastructure/pedido.repository', () => ({ pedidoRepository: mocks.pedidoRepository }));
vi.mock('../../production/disenos/infrastructure/diseno.repository', () => ({ disenoRepository: mocks.disenoRepository }));
vi.mock('./AdminTrendsPanel', () => ({ AdminTrendsPanel: () => <div>admin trends</div> }));
vi.mock('./ClientPaymentsPanel', () => ({ ClientPaymentsPanel: ({ canUpload, canView }) => <div>payments {String(canUpload)} {String(canView)}</div> }));
vi.mock('../../../shared/components/DesignFileUploader/DesignFileUploader', () => ({ DesignFileUploader: (props) => { mocks.uploaderProps = props; return <button onClick={() => props.onFileChange(new File(['x'], 'design.png'))}>choose-design</button>; } }));
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div>{children}</div>, PieChart: ({ children }) => <div>{children}</div>,
  Pie: ({ children }) => <div>{children}</div>, Cell: () => <span>cell</span>,
  Tooltip: ({ content }) => <div>{content({ active: true, payload: [{ name: 'Pendiente', value: 2, payload: { color: '#000' } }] })}</div>,
}));

const adminData = () => ({
  kpis: [
    { label: 'Pedidos pendientes', value: 2, detail: 'hoy', iconKey: 'clock', tone: 'warning' },
    { label: 'Total clientes', value: 3, detail: 'total', iconKey: 'users', tone: 'info' },
    { label: 'Otro', value: 1, detail: 'otro', iconKey: 'unknown', tone: 'neutral' },
  ],
  revenue: {
    daily: { value: '$1', detail: 'día' }, monthly: { value: '$2', detail: 'mes' }, yearly: { value: '$3', detail: 'año' },
  },
  orderStatus: [{ label: 'Pendiente', value: 2, color: '#000' }, { label: 'Terminado', value: 0, color: '#fff' }],
  latestOrders: [{ number: '#1', customer: 'Ana', date: 'hoy', status: 'EN_PROCESO' }, { number: '#2', customer: 'Beto', date: 'ayer', status: 'DESCONOCIDO' }],
  pendingQuotes: { value: 2, readyToPrice: 1, waitingClient: 1 },
  pendingQuotesList: [{ number: 'C-1', customer: 'Ana', status: 'Cotizar' }],
});

const clientData = () => ({
  kpis: [{ label: 'Activos', value: 2, detail: 'pedidos', iconKey: 'shopping', tone: 'info' }],
  activeOrders: [
    {
      id: 10, number: '#10', date: 'hoy', status: 'PENDIENTE', estimatedDelivery: '2026-10-10',
      progressNotice: { tone: 'warning', title: 'Diseno en proceso', detail: 'Tu pedido esta esperando la aprobacion de los disenos.', balance: 500 },
      tracking: [{ label: 'Cotizacion aceptada', state: 'completed', detail: 'Listo' }, { label: 'Diseno pendiente de aprobacion', state: 'current' }, { label: 'Otro', state: 'unknown' }],
      requirements: [
        { idRequerimientoDiseno: 'REQ-1', requiereDiseno: true, origenDiseno: 'CLIENTE', producto: { nombre: 'Camiseta' }, tecnica: { nombre: 'DTF' }, cantidad: 2 },
        { idRequerimientoDiseno: 'REQ-2', requiereDiseno: true, origenDiseno: 'CLIENTE', producto: { nombre: 'Vaso' }, cantidad: 1, diseno: { idDiseno: 2, archivoUrl: 'https://file.test/a.png' } },
      ],
    },
    { id: 11, number: '#11', date: 'ayer', status: 'FINALIZADO', estimatedDelivery: null, tracking: [], details: [] },
  ],
  history: [{ number: '#9', date: 'antes', status: 'ENTREGADO' }],
});

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth = { user: { nombre: 'Admin' }, permissions: [], hasPermission: () => true };
    mocks.dashboard = { data: { admin: adminData() }, loading: false, error: null, refetch: vi.fn() };
    mocks.isClient = false;
    mocks.pedidoRepository.saveClientDesignUrl.mockResolvedValue();
    mocks.disenoRepository.uploadClientDesign.mockResolvedValue();
  });

  it('renders and interacts with the administrator dashboard', () => {
    render(<DashboardPage />);
    expect(screen.getByText('admin trends')).toBeInTheDocument();
    expect(screen.getByText('2 pedidos')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Abrir Pedidos pendientes'));
    fireEvent.click(screen.getByLabelText('Abrir Total clientes'));
    fireEvent.click(screen.getByLabelText('Abrir ventas'));
    fireEvent.click(screen.getByText('Dia'));
    expect(screen.getByText('$1')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Año'));
    expect(screen.getByText('$3')).toBeInTheDocument();
    expect(mocks.navigate).toHaveBeenCalledTimes(3);
    expect(screen.getByText('En producción')).toBeInTheDocument();
  });

  it('renders the client dashboard, switches orders and uploads a design', async () => {
    mocks.isClient = true;
    mocks.auth = { user: { name: 'Cliente' }, permissions: [], hasPermission: () => true };
    mocks.dashboard = { data: { client: clientData() }, loading: false, error: null, refetch: vi.fn() };
    render(<DashboardPage />);
    expect(screen.getByText('Diseño en proceso')).toBeInTheDocument();
    expect(screen.getByText('Tu pedido está esperando la aprobación de los diseños.')).toBeInTheDocument();
    expect(screen.getByText('Abrir diseño')).toHaveAttribute('href', 'https://file.test/a.png');
    fireEvent.click(screen.getByText('choose-design'));
    fireEvent.click(screen.getByText('Enviar diseño'));
    await waitFor(() => expect(mocks.disenoRepository.uploadClientDesign).toHaveBeenCalledWith(10, 'REQ-1', expect.any(File)));
    fireEvent.click(screen.getByText('#11'));
    expect(screen.getByText('Entrega estimada: Por definir')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Crear cotización'));
    fireEvent.click(screen.getByText('Actualizar perfil'));
    expect(mocks.navigate).toHaveBeenCalledTimes(2);
  });

  it('supports the legacy design URL path and validation/errors', async () => {
    const onSaved = vi.fn();
    const legacy = { id: 5, details: [{ idDetallePedido: 8, requiereDiseno: true, origenDiseno: 'CLIENTE', descripcion: 'Bolso', cantidad: 1 }] };
    const { rerender } = render(<ClientDesignFilePanel order={legacy} onSaved={onSaved} />);
    fireEvent.click(screen.getByText('Guardar diseño'));
    expect(mocks.notifications.warning).toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText('Enlace de diseño histórico'), { target: { value: 'https://drive.test/a' } });
    fireEvent.click(screen.getByText('Guardar diseño'));
    await waitFor(() => expect(mocks.pedidoRepository.saveClientDesignUrl).toHaveBeenCalledWith(5, 8, 'https://drive.test/a'));
    mocks.pedidoRepository.saveClientDesignUrl.mockRejectedValueOnce(new Error('url fail'));
    rerender(<ClientDesignFilePanel order={legacy} onSaved={onSaved} />);
    fireEvent.change(screen.getByLabelText('Enlace de diseño histórico'), { target: { value: 'https://drive.test/b' } });
    fireEvent.click(screen.getByText('Guardar diseño'));
    await waitFor(() => expect(mocks.notifications.error).toHaveBeenCalledWith('url fail'));
  });

  it.each([
    [{ loading: true, data: null, error: null }, 'Cargando dashboard...'],
    [{ loading: false, data: null, error: 'offline', refetch: vi.fn() }, 'offline'],
    [{ loading: false, data: {}, error: null }, 'No hay datos disponibles para este perfil.'],
  ])('renders dashboard state variants', (state, text) => {
    mocks.dashboard = state;
    render(<DashboardPage />);
    expect(screen.getByText(text)).toBeInTheDocument();
  });

  it('renders empty administrator charts and tables', () => {
    const data = adminData();
    data.orderStatus = [{ label: 'Pendiente', value: 0, color: '#000' }];
    data.latestOrders = [];
    mocks.dashboard = { data: { admin: data }, loading: false, error: null };
    render(<DashboardPage />);
    expect(screen.getByText('No hay datos suficientes para mostrar esta grafica.')).toBeInTheDocument();
    expect(screen.getByText('No hay pedidos para mostrar.')).toBeInTheDocument();
  });
});
