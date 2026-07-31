import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { disenoRepository } from '../../../production/disenos/infrastructure/diseno.repository';
import { pedidoRepository } from '../infrastructure/pedido.repository';
import { PedidoExpedientePage } from './PedidoExpedientePage';

const mocks = vi.hoisted(() => ({
  loadExpediente: vi.fn(),
  loadRequirements: vi.fn(),
  navigate: vi.fn(),
  success: vi.fn(),
  requirement: null,
}));

vi.mock('react-router-dom', async importOriginal => ({
  ...(await importOriginal()),
  useNavigate: () => mocks.navigate,
  useLocation: () => ({ key: 'default' }),
  useParams: () => ({ idPedido: '54' }),
}));

vi.mock('../../../../core/hooks/useLatestListRequest', () => ({
  useLatestListRequest: ({ queryKey }) => {
    if (queryKey === '54') {
      return {
        data: {
          pedido: { idPedido: 54, estadoPedido: 'PENDIENTE', estadoPago: 'PENDIENTE' },
          cliente: { idCliente: 8, nombre: 'Cliente PIXEL' },
          resumenEconomico: { total: 0, totalConfirmado: 0, saldoPendiente: 0, estadoPago: 'PENDIENTE' },
          detalles: [],
          abonos: [],
          historial: [],
          proximasAcciones: [],
          venta: null,
        },
        loading: false,
        error: null,
        refetch: mocks.loadExpediente,
      };
    }

    return {
      data: {
        requerimientos: [mocks.requirement],
        resumen: {},
      },
      loading: false,
      error: null,
      refetch: mocks.loadRequirements,
    };
  },
}));

vi.mock('../../../../store/AuthContext', () => ({
  useAuth: () => ({ hasPermission: () => true }),
}));

vi.mock('../../../../shared/components/ConfirmDialog/ConfirmProvider', () => ({
  useConfirm: () => vi.fn(),
}));

vi.mock('../../../../core/utils/notifications', () => ({
  notifications: {
    success: mocks.success,
    error: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock('../../../production/disenos/infrastructure/diseno.repository', () => ({
  disenoRepository: {
    definirOrigenRequerimiento: vi.fn(),
    getRequerimientosDiseno: vi.fn(),
    listPedidos: vi.fn(),
    create: vi.fn(),
    approveByClientAdmin: vi.fn(),
    rejectByClientAdmin: vi.fn(),
  },
}));

vi.mock('../infrastructure/pedido.repository', () => ({
  pedidoRepository: {
    getExpediente: vi.fn(),
    registrarDisenoRecibidoCliente: vi.fn(),
  },
}));

vi.mock('../../abonos/infrastructure/abono.repository', () => ({
  abonoRepository: {
    getAdminReceipt: vi.fn(),
    create: vi.fn(),
    reject: vi.fn(),
    getPedido: vi.fn(),
    listByPedido: vi.fn(),
    listPedidos: vi.fn(),
  },
}));

vi.mock('../../abonos/presentation/AbonoModal', () => ({ AbonoModal: () => null }));
vi.mock('../../abonos/presentation/ReceiptPreviewModal', () => ({ ReceiptPreviewModal: () => null }));
vi.mock('../../abonos/presentation/ReviewConfirmAbonoModal', () => ({ ReviewConfirmAbonoModal: () => null }));
vi.mock('../../../production/disenos/presentation/DisenoModal', () => ({ DisenoModal: () => null }));
vi.mock('../../../production/disenos/presentation/DesignClientResponseModal', () => ({ DesignClientResponseModal: () => null }));
describe('PedidoExpedientePage design origin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requirement = {
      idPedido: 54,
      idRequerimientoDiseno: 'STAMP-34',
      tipo: 'ESTAMPADO',
      origenDiseno: 'PENDIENTE_DEFINIR',
      estadoCoberturaDiseno: 'PENDIENTE_DEFINIR_ORIGEN',
      puedeDefinirOrigen: true,
      puedeCrearDiseno: false,
      puedeCargarCorreccion: false,
      puedeRegistrarDisenoCliente: false,
      puedeAprobar: false,
      versiones: [],
      estampadosCubiertos: [],
      producto: { nombre: 'Camiseta' },
      tecnica: { nombre: 'DTF' },
      ubicacion: 'FRENTE',
      cantidad: 12,
    };
    disenoRepository.definirOrigenRequerimiento.mockResolvedValue({});
    pedidoRepository.registrarDisenoRecibidoCliente.mockResolvedValue({ estado: 'ENVIADO' });
    mocks.loadRequirements.mockResolvedValue(undefined);
  });

  it('shows the action, saves CLIENTE and refreshes requirements without reloading the page', async () => {
    render(<PedidoExpedientePage />);

    fireEvent.click(screen.getByRole('tab', { name: /Disenos/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Definir quien entrega el diseno' }));
    fireEvent.click(screen.getByRole('radio', { name: /^El cliente entrega el diseno/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Guardar seleccion' }));

    await waitFor(() => {
      expect(disenoRepository.definirOrigenRequerimiento).toHaveBeenCalledWith(54, 'STAMP-34', 'CLIENTE');
      expect(mocks.loadRequirements).toHaveBeenCalledTimes(1);
    });
    expect(mocks.loadExpediente).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog', { name: 'Definir quien entrega el diseno' })).not.toBeInTheDocument();
    expect(mocks.success).toHaveBeenCalled();
  });

  it('registers the client design by requirement and refreshes only requirements', async () => {
    mocks.requirement = {
      ...mocks.requirement,
      origenDiseno: 'CLIENTE',
      estadoCoberturaDiseno: 'PENDIENTE_RECEPCION_CLIENTE',
      puedeDefinirOrigen: false,
      puedeRegistrarDisenoCliente: true,
    };
    render(<PedidoExpedientePage />);

    fireEvent.click(screen.getByRole('tab', { name: /Disenos/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Registrar diseno recibido' }));
    const dialog = screen.getByRole('dialog', { name: 'Registrar diseno recibido' });
    fireEvent.change(within(dialog).getByLabelText(/url del diseno/i), {
      target: { value: 'https://example.com/diseno.png' },
    });
    fireEvent.change(within(dialog).getByLabelText(/observaciones/i), {
      target: { value: 'Recibido por WhatsApp.' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Registrar diseno recibido' }));

    await waitFor(() => {
      expect(pedidoRepository.registrarDisenoRecibidoCliente).toHaveBeenCalledWith(
        54,
        'STAMP-34',
        {
          archivoDisenoInicialUrl: 'https://example.com/diseno.png',
          medioRecepcion: 'WHATSAPP',
          observaciones: 'Recibido por WhatsApp.',
        },
      );
      expect(mocks.loadRequirements).toHaveBeenCalledTimes(1);
    });
    expect(mocks.loadExpediente).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog', { name: 'Registrar diseno recibido' })).not.toBeInTheDocument();
    expect(mocks.success).toHaveBeenCalledWith('Diseno recibido. Quedo pendiente de revision.');
  });
});
