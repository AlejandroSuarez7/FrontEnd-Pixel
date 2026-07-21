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
});
