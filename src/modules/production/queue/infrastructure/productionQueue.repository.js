import { pedidoRepository } from '../../../sales/pedidos/infrastructure/pedido.repository';

const ISO_DATE_IN_BRACKETS = /\[(\d{4}-\d{2}-\d{2}T[^\]]+)]\s*([^[\]]*)/g;
const QUEUE_ORDER_MARKER = /\n?\[\[PIXEL_QUEUE_ORDER:(\d+)\]\]/;
const QUEUE_ORDER_MARKER_GLOBAL = /\n?\[\[PIXEL_QUEUE_ORDER:\d+\]\]/g;

const toValidTime = (value) => {
  if (!value) return Number.MAX_SAFE_INTEGER;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? Number.MAX_SAFE_INTEGER : time;
};

const getProductionDate = (pedido) => {
  const observaciones = pedido.observaciones || '';
  const matches = [...observaciones.matchAll(ISO_DATE_IN_BRACKETS)];
  const productionAudit = matches.find(match => {
    const text = (match[2] || '').toLowerCase();
    return text.includes('produccion') || text.includes('producci') || text.includes('en_proceso');
  });

  return productionAudit?.[1]
    || pedido.fechaIngresoProduccion
    || pedido.fechaEnProceso
    || pedido.fecha_en_proceso
    || pedido.fechaActualizacion
    || pedido.fechaCreacion
    || null;
};

const getQueuePosition = (observaciones) => {
  const match = observaciones?.match(QUEUE_ORDER_MARKER);
  return match ? Number(match[1]) : null;
};

const removeQueueOrderMarker = (observaciones) => (
  observaciones || ''
).replace(QUEUE_ORDER_MARKER_GLOBAL, '').trim();

const withQueueOrderMarker = (observaciones, position) => {
  const cleanObservaciones = removeQueueOrderMarker(observaciones);
  const marker = `[[PIXEL_QUEUE_ORDER:${position}]]`;
  return cleanObservaciones ? `${cleanObservaciones}\n${marker}` : marker;
};

export class ProductionQueueRepository {
  async list() {
    const firstPage = await pedidoRepository.list({
      page: 1,
      limit: 10,
      search: 'EN_PROCESO',
      sortBy: 'fechaCreacion',
      order: 'asc',
    });
    const pedidos = [...(firstPage.items || [])];
    const totalPages = Number(firstPage.meta?.totalPages || 1);

    for (let page = 2; page <= totalPages; page += 1) {
      const response = await pedidoRepository.list({
        page,
        limit: 10,
        search: 'EN_PROCESO',
        sortBy: 'fechaCreacion',
        order: 'asc',
      });
      pedidos.push(...(response.items || []));
    }

    return pedidos
      .filter(pedido => pedido.estadoPedido === 'EN_PROCESO')
      .map(pedido => ({
        ...pedido,
        fechaIngresoProduccion: getProductionDate(pedido),
        posicionColaProduccion: getQueuePosition(pedido.observaciones),
      }))
      .sort((a, b) => {
        const positionA = a.posicionColaProduccion;
        const positionB = b.posicionColaProduccion;
        if (positionA !== null && positionB !== null && positionA !== positionB) {
          return positionA - positionB;
        }
        if (positionA !== null && positionB === null) return -1;
        if (positionA === null && positionB !== null) return 1;

        const dateA = toValidTime(a.fechaIngresoProduccion);
        const dateB = toValidTime(b.fechaIngresoProduccion);
        return (dateA - dateB) || (Number(a.idPedido) - Number(b.idPedido));
      });
  }

  async saveOrder(pedidos) {
    await Promise.all(
      pedidos.map((pedido, index) => pedidoRepository.update(pedido.idPedido, {
        observaciones: withQueueOrderMarker(pedido.observaciones, index + 1),
      }))
    );
  }
}

export const productionQueueRepository = new ProductionQueueRepository();
