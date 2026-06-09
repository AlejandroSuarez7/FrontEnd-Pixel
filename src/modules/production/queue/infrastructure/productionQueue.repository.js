import { pedidoRepository } from '../../../sales/pedidos/infrastructure/pedido.repository';

const ISO_DATE_IN_BRACKETS = /\[(\d{4}-\d{2}-\d{2}T[^\]]+)\]\s*([^\[]*)/g;

const getProductionDate = (pedido) => {
  const observaciones = pedido.observaciones || '';
  const matches = [...observaciones.matchAll(ISO_DATE_IN_BRACKETS)];
  const productionAudit = matches.find(match => {
    const text = (match[2] || '').toLowerCase();
    return text.includes('produccion') || text.includes('producción') || text.includes('en_proceso');
  });

  return productionAudit?.[1] || pedido.fechaActualizacion || pedido.fechaCreacion || null;
};

export class ProductionQueueRepository {
  async list() {
    const pedidos = await pedidoRepository.list();
    return pedidos
      .filter(pedido => pedido.estadoPedido === 'EN_PROCESO')
      .map(pedido => ({
        ...pedido,
        fechaIngresoProduccion: getProductionDate(pedido),
      }))
      .sort((a, b) => {
        const dateA = new Date(a.fechaIngresoProduccion || 0).getTime();
        const dateB = new Date(b.fechaIngresoProduccion || 0).getTime();
        return dateA - dateB;
      });
  }
}

export const productionQueueRepository = new ProductionQueueRepository();
