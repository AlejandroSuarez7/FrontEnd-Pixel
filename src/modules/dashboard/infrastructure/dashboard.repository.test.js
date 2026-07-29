import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '../../../core/services/apiService';
import { dashboardRepository } from './dashboard.repository';

vi.mock('../../../core/services/apiService', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

describe('dashboardRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiClient.get.mockResolvedValue({ data: { data: {} } });
  });

  it('loads admin dashboard for administrative users', async () => {
    await dashboardRepository.getDashboardData(
      { rol: { nombre: 'Admin' } },
      ['dashboard.admin', 'usuarios.ver']
    );

    expect(apiClient.get).toHaveBeenCalledWith('api/dashboard/admin', {
      params: expect.objectContaining({ ultimos: 5 }),
    });
    expect(apiClient.get).not.toHaveBeenCalledWith(
      'api/cliente/dashboard',
      expect.anything()
    );
  });

  it('loads client dashboard for client users', async () => {
    await dashboardRepository.getDashboardData(
      { rol: { nombre: 'Cliente' } },
      ['dashboard.cliente', 'pedidos.cliente.ver']
    );

    expect(apiClient.get).toHaveBeenCalledWith('api/cliente/dashboard', {
      params: { limite: 5 },
    });
  });

  it('builds selectable client orders including delivered orders from available dashboard payload fields', async () => {
    apiClient.get.mockResolvedValueOnce({
      data: {
        data: {
          kpis: {},
          pedidoActivo: {
            idPedido: 22,
            estadoPedido: 'PENDIENTE',
            fechaCreacion: '2026-07-18',
          },
          historialPedidos: [
            {
              idPedido: 22,
              estadoPedido: 'PENDIENTE',
              fechaCreacion: '2026-07-18',
            },
            {
              idPedido: 21,
              estadoPedido: 'EN_PROCESO',
              fechaCreacion: '2026-07-17',
            },
            {
              idPedido: 20,
              estadoPedido: 'ENTREGADO',
              fechaCreacion: '2026-07-16',
            },
          ],
        },
      },
    });

    const result = await dashboardRepository.getDashboardData(
      { rol: { nombre: 'Cliente' } },
      ['dashboard.cliente', 'pedidos.cliente.ver']
    );

    expect(result.client.activeOrders.map((order) => order.number)).toEqual(['PX-22', 'PX-21', 'PX-20']);
  });

  it('maps dashboard request failures to rejected errors', async () => {
    apiClient.get.mockRejectedValueOnce(new Error('No se pudo cargar'));

    await expect(dashboardRepository.getDashboardData(
      { rol: { nombre: 'Cliente' } },
      ['dashboard.cliente']
    )).rejects.toThrow('No se pudo cargar');
  });

  it('omits the final-balance step when the order is already fully paid', async () => {
    apiClient.get.mockResolvedValueOnce({
      data: {
        data: {
          kpis: {},
          pedidosActivos: [{
            idPedido: 40,
            estadoPedido: 'EN_PROCESO',
            estadoPago: 'COMPLETO',
            saldoPendiente: 0,
            detalles: [],
            disenos: [],
          }],
        },
      },
    });

    const result = await dashboardRepository.getDashboardData(
      { rol: { nombre: 'Cliente' } },
      ['dashboard.cliente']
    );

    expect(result.client.activeOrders[0].tracking.map(step => step.label))
      .not.toContain('Pendiente de saldo final');
  });

  it('does not add design steps when every product is marked as not requiring design', async () => {
    apiClient.get.mockResolvedValueOnce({
      data: {
        data: {
          kpis: {},
          pedidosActivos: [{
            idPedido: 41,
            estadoPedido: 'PENDIENTE',
            estadoPago: 'PARCIAL',
            detalles: [{
              idDetallePedido: 1,
              requiereDiseno: false,
              estadoCoberturaDiseno: 'NO_REQUIERE_DISENO',
              cubiertoPorDiseno: true,
            }],
          }],
        },
      },
    });

    const result = await dashboardRepository.getDashboardData(
      { rol: { nombre: 'Cliente' } },
      ['dashboard.cliente']
    );
    const labels = result.client.activeOrders[0].tracking.map(step => step.label);

    expect(labels.some(label => label.toLowerCase().includes('diseno'))).toBe(false);
  });

  it('shows client design review without assuming that the order entered production', async () => {
    apiClient.get.mockResolvedValueOnce({
      data: {
        data: {
          kpis: {},
          pedidosActivos: [{
            idPedido: 42,
            estadoPedido: 'PENDIENTE',
            estadoPago: 'PARCIAL',
            detalles: [{
              idDetallePedido: 2,
              requiereDiseno: true,
              origenDiseno: 'CLIENTE',
              estadoCoberturaDiseno: 'DISENO_ENTREGADO_POR_CLIENTE',
              cubiertoPorDiseno: false,
            }],
          }],
        },
      },
    });

    const result = await dashboardRepository.getDashboardData(
      { rol: { nombre: 'Cliente' } },
      ['dashboard.cliente']
    );
    const tracking = result.client.activeOrders[0].tracking;

    expect(tracking.find(step => step.label === 'Diseno pendiente de revision')?.state)
      .toBe('current');
    expect(tracking.find(step => step.label === 'En produccion')?.state)
      .toBe('pending');
  });

  it('uses centralized backend design totals instead of counting raw design records', async () => {
    apiClient.get.mockResolvedValueOnce({
      data: {
        data: {
          kpis: {},
          pedidosActivos: [{
            idPedido: 43,
            estadoPedido: 'PENDIENTE',
            estadoPago: 'PARCIAL',
            totalDisenosRequeridos: 2,
            totalDisenosAprobados: 1,
            totalDisenosPendientes: 1,
            detalles: [{
              idDetallePedido: 3,
              requiereDiseno: true,
              estadoCoberturaDiseno: 'DISENO_APROBADO',
              cubiertoPorDiseno: true,
            }, {
              idDetallePedido: 4,
              requiereDiseno: true,
              estadoCoberturaDiseno: 'DISENO_ENVIADO',
              cubiertoPorDiseno: false,
            }],
            disenos: [
              { idDiseno: 10, estado: 'APROBADO' },
              { idDiseno: 11, estado: 'APROBADO' },
              { idDiseno: 12, estado: 'RECHAZADO' },
            ],
          }],
        },
      },
    });

    const result = await dashboardRepository.getDashboardData(
      { rol: { nombre: 'Cliente' } },
      ['dashboard.cliente'],
    );
    const approvedStep = result.client.activeOrders[0].tracking
      .find(step => step.label === 'Diseno aprobado');

    expect(approvedStep.detail).toBe('1 de 2 disenos aprobados');
    expect(approvedStep.state).not.toBe('completed');
  });

  it('reflects backend coverage totals when one general design covers all products', async () => {
    apiClient.get.mockResolvedValueOnce({
      data: {
        data: {
          kpis: {},
          pedidosActivos: [{
            idPedido: 44,
            estadoPedido: 'PENDIENTE',
            estadoPago: 'PARCIAL',
            totalDisenosRequeridos: 2,
            totalDisenosAprobados: 2,
            totalDisenosPendientes: 0,
            detalles: [{
              idDetallePedido: 5,
              requiereDiseno: true,
              estadoCoberturaDiseno: 'CUBIERTO_POR_DISENO_GENERAL',
              cubiertoPorDiseno: true,
            }, {
              idDetallePedido: 6,
              requiereDiseno: true,
              estadoCoberturaDiseno: 'CUBIERTO_POR_DISENO_GENERAL',
              cubiertoPorDiseno: true,
            }],
            disenos: [{ idDiseno: 20, estado: 'APROBADO', esDisenoGeneral: true }],
          }],
        },
      },
    });

    const result = await dashboardRepository.getDashboardData(
      { rol: { nombre: 'Cliente' } },
      ['dashboard.cliente'],
    );
    const approvedStep = result.client.activeOrders[0].tracking
      .find(step => step.label === 'Diseno aprobado');

    expect(approvedStep.detail).toBe('2 de 2 disenos aprobados');
    expect(approvedStep.state).toBe('completed');
  });

  it('uses the backend final-balance step without inferring a pending payment', async () => {
    apiClient.get.mockResolvedValueOnce({
      data: {
        data: {
          kpis: {},
          pedidosActivos: [{
            idPedido: 45,
            estadoPedido: 'EN_PROCESO',
            estadoPago: 'PARCIAL',
            saldoPendiente: 100000,
            estadoPasoSaldoFinal: 'NO_APLICA',
            puedeSolicitarSaldoFinal: false,
            puedeFinalizar: false,
            motivoBloqueoFinalizacion: 'El pedido sigue en produccion.',
            totalDisenosRequeridos: 0,
            totalDisenosAprobados: 0,
            totalDisenosPendientes: 0,
          }],
        },
      },
    });

    const result = await dashboardRepository.getDashboardData(
      { rol: { nombre: 'Cliente' } },
      ['dashboard.cliente'],
    );
    const order = result.client.activeOrders[0];

    expect(order.finalBalanceStep).toBe('NO_APLICA');
    expect(order.canRequestFinalBalance).toBe(false);
    expect(order.canFinalize).toBe(false);
    expect(order.finalizationBlockReason).toBe('El pedido sigue en produccion.');
    expect(order.tracking.map(step => step.label)).toContain('Pago completo / No aplica');
    expect(order.tracking.map(step => step.label)).not.toContain('Pendiente de saldo final');
  });

  it('marks the backend requested final balance as the current step', async () => {
    apiClient.get.mockResolvedValueOnce({
      data: {
        data: {
          kpis: {},
          pedidosActivos: [{
            idPedido: 46,
            estadoPedido: 'PENDIENTE_SALDO_FINAL',
            estadoPago: 'PARCIAL',
            saldoPendiente: 50000,
            estadoPasoSaldoFinal: 'SOLICITADO',
            puedeSolicitarSaldoFinal: false,
            puedeFinalizar: false,
            totalDisenosRequeridos: 1,
            totalDisenosAprobados: 1,
            totalDisenosPendientes: 0,
          }],
        },
      },
    });

    const result = await dashboardRepository.getDashboardData(
      { rol: { nombre: 'Cliente' } },
      ['dashboard.cliente'],
    );
    const step = result.client.activeOrders[0].tracking
      .find(item => item.label === 'Pendiente de saldo final');

    expect(step.state).toBe('current');
    expect(step.detail).toBe('Saldo final solicitado');
  });
});
