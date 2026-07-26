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
});
