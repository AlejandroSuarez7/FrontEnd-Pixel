import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DisenoModal } from './DisenoModal';

vi.mock('../../../../core/services/apiService', () => ({
  apiClient: { get: vi.fn() },
}));

vi.mock('../../../../core/utils/notifications', () => ({
  notifications: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  },
}));

const pedido = {
  idPedido: 54,
  estadoPedido: 'PENDIENTE',
  estadoPago: 'PARCIAL',
  cliente: { nombre: 'Cliente Pixel' },
};

const stampRequirement = {
  idRequerimientoDiseno: 'STAMP-34',
  tipo: 'ESTAMPADO',
  idPedido: 54,
  idDetallePedido: 20,
  idEstampadoPedido: 34,
  producto: { nombre: 'Camiseta' },
  ubicacion: 'Frente',
  tecnica: { nombre: 'DTF' },
  anchoCm: 10,
  altoCm: 12,
  origenDiseno: 'PIXEL',
  estadoCoberturaDiseno: 'PENDIENTE_CREACION_PIXEL',
  puedeCrearDiseno: true,
};

const clientRequirement = {
  idRequerimientoDiseno: 'STAMP-35',
  tipo: 'ESTAMPADO',
  idPedido: 54,
  idDetallePedido: 20,
  idEstampadoPedido: 35,
  producto: { nombre: 'Camiseta' },
  origenDiseno: 'CLIENTE',
  estadoCoberturaDiseno: 'PENDIENTE_ARCHIVO_CLIENTE',
  puedeRegistrarDisenoCliente: true,
};

const getRequirements = vi.fn();

describe('DisenoModal requirements flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getRequirements.mockResolvedValue({
      requerimientos: [stampRequirement, clientRequirement],
      resumen: {
        totalDisenosRequeridos: 2,
        totalDisenosAprobados: 0,
        totalDisenosPendientes: 2,
      },
    });
  });

  it('loads real requirements for the selected order and uses the stable requirement id', async () => {
    render(
      <DisenoModal
        isOpen
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        isStaff={false}
        getPedidos={vi.fn().mockResolvedValue([pedido])}
        getRequerimientosDiseno={getRequirements}
      />,
    );

    fireEvent.change(await screen.findByLabelText(/pedido/i), {
      target: { value: '54' },
    });

    const selector = await screen.findByLabelText(/que diseno vas a registrar/i);
    const stampOption = await screen.findByRole('option', {
      name: /camiseta - frente - dtf - 10 x 12 cm/i,
    });

    expect(getRequirements).toHaveBeenCalledWith('54', expect.objectContaining({
      signal: expect.any(AbortSignal),
    }));
    expect(stampOption).toHaveValue('STAMP-34');
    expect(screen.queryByRole('option', { name: /pendiente de archivo del cliente/i })).not.toBeInTheDocument();
    fireEvent.change(selector, { target: { value: 'STAMP-34' } });
    expect(selector).toHaveValue('STAMP-34');
  });

  it('submits the selected requirement without asking for a product or general checkbox', async () => {
    const onSubmit = vi.fn().mockResolvedValue({});
    render(
      <DisenoModal
        isOpen
        onClose={vi.fn()}
        onSubmit={onSubmit}
        isStaff={false}
        getPedidos={vi.fn().mockResolvedValue([pedido])}
        getRequerimientosDiseno={getRequirements}
      />,
    );

    fireEvent.change(await screen.findByLabelText(/pedido/i), {
      target: { value: '54' },
    });
    fireEvent.change(await screen.findByLabelText(/que diseno vas a registrar/i), {
      target: { value: 'STAMP-34' },
    });

    expect(screen.queryByLabelText(/producto del pedido/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/aplica para todo el pedido/i)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /registrar diseno/i }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      requirement: expect.objectContaining({
        idRequerimientoDiseno: 'STAMP-34',
        idEstampadoPedido: 34,
      }),
      idPedido: 54,
    })));
  });

  it('keeps a preset rejected requirement selected and shows its previous version', async () => {
    const rejectedRequirement = {
      ...stampRequirement,
      estadoCoberturaDiseno: 'DISENO_RECHAZADO',
      puedeCrearDiseno: false,
      puedeCargarCorreccion: true,
      disenoVigente: {
        idDiseno: 77,
        estado: 'RECHAZADO',
        archivoUrl: 'https://example.com/version-anterior.png',
        observacionesCliente: 'Cambiar el color.',
      },
      versiones: [{ idDiseno: 77, estado: 'RECHAZADO' }],
    };
    getRequirements.mockResolvedValue({
      requerimientos: [rejectedRequirement],
      resumen: {},
    });

    render(
      <DisenoModal
        isOpen
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        isStaff={false}
        presetPedido={pedido}
        presetRequirement={rejectedRequirement}
        presetRequirementId="STAMP-34"
        lockPedido
        getRequerimientosDiseno={getRequirements}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Cargar diseno corregido' })).toBeInTheDocument();
    expect(screen.getByLabelText(/que diseno vas a registrar/i)).toHaveValue('STAMP-34');
    expect(screen.getByRole('link', { name: 'Ver version anterior' })).toHaveAttribute(
      'href',
      'https://example.com/version-anterior.png',
    );
    expect(screen.getByText(/cambiar el color/i)).toBeInTheDocument();
  });

  it('cleans the previous requirement when the order changes', async () => {
    const secondOrder = { ...pedido, idPedido: 55 };
    getRequirements
      .mockResolvedValueOnce({ requerimientos: [stampRequirement], resumen: {} })
      .mockResolvedValueOnce({ requerimientos: [], resumen: {} });

    render(
      <DisenoModal
        isOpen
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        isStaff={false}
        getPedidos={vi.fn().mockResolvedValue([pedido, secondOrder])}
        getRequerimientosDiseno={getRequirements}
      />,
    );

    const orderSelector = await screen.findByLabelText(/pedido/i);
    fireEvent.change(orderSelector, { target: { value: '54' } });
    await waitFor(() => expect(screen.getByLabelText(/que diseno vas a registrar/i)).toHaveValue('STAMP-34'));

    fireEvent.change(orderSelector, { target: { value: '55' } });
    await waitFor(() => expect(screen.getByLabelText(/que diseno vas a registrar/i)).toHaveValue(''));
    expect(await screen.findByText(/no tiene disenos pendientes de creacion o correccion/i)).toBeInTheDocument();
  });
});
