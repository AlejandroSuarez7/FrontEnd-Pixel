import { beforeEach, describe, expect, it, vi } from 'vitest';
import { pedidoRepository } from '../../../sales/pedidos/infrastructure/pedido.repository';
import { ProductionQueueRepository } from './productionQueue.repository';

vi.mock('../../../sales/pedidos/infrastructure/pedido.repository', () => ({
  pedidoRepository: { list: vi.fn(), update: vi.fn() },
}));

describe('ProductionQueueRepository', () => {
  beforeEach(() => vi.clearAllMocks());

  it('loads every page, filters production orders and sorts markers before dates', async () => {
    pedidoRepository.list
      .mockResolvedValueOnce({
        items: [
          { idPedido: 3, estadoPedido: 'EN_PROCESO', observaciones: 'Nota\n[[PIXEL_QUEUE_ORDER:2]]', fechaCreacion: '2026-01-03' },
          { idPedido: 99, estadoPedido: 'ENTREGADO', fechaCreacion: '2026-01-01' },
          { idPedido: 2, estadoPedido: 'EN_PROCESO', observaciones: '[2026-01-02T08:00:00Z] pasó a PRODUCCION' },
        ],
        meta: { totalPages: 2 },
      })
      .mockResolvedValueOnce({
        items: [
          { idPedido: 1, estadoPedido: 'EN_PROCESO', observaciones: '[[PIXEL_QUEUE_ORDER:1]]', fechaCreacion: 'bad' },
          { idPedido: 4, estadoPedido: 'EN_PROCESO', fechaIngresoProduccion: '2026-01-01' },
        ],
      });

    const result = await new ProductionQueueRepository().list({ signal: 'signal' });

    expect(pedidoRepository.list).toHaveBeenCalledTimes(2);
    expect(pedidoRepository.list).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 }), { signal: 'signal' });
    expect(result.map((item) => item.idPedido)).toEqual([1, 3, 4, 2]);
    expect(result.at(-1).fechaIngresoProduccion).toBe('2026-01-02T08:00:00Z');
  });

  it('uses date and id fallbacks when orders do not have explicit positions', async () => {
    pedidoRepository.list.mockResolvedValue({ items: [
      { idPedido: 5, estadoPedido: 'EN_PROCESO', fechaCreacion: 'invalid' },
      { idPedido: 4, estadoPedido: 'EN_PROCESO', fechaCreacion: 'invalid' },
      { idPedido: 6, estadoPedido: 'EN_PROCESO', fecha_en_proceso: '2026-01-01' },
    ] });

    const result = await new ProductionQueueRepository().list();
    expect(result.map((item) => item.idPedido)).toEqual([6, 4, 5]);
  });

  it('persists a clean sequential marker while preserving observations', async () => {
    pedidoRepository.update.mockResolvedValue({});
    await new ProductionQueueRepository().saveOrder([
      { idPedido: 8, observaciones: 'Nota\n[[PIXEL_QUEUE_ORDER:9]]' },
      { idPedido: 9, observaciones: '' },
    ]);

    expect(pedidoRepository.update).toHaveBeenNthCalledWith(1, 8, {
      observaciones: 'Nota\n[[PIXEL_QUEUE_ORDER:1]]',
    });
    expect(pedidoRepository.update).toHaveBeenNthCalledWith(2, 9, {
      observaciones: '[[PIXEL_QUEUE_ORDER:2]]',
    });
  });
});
