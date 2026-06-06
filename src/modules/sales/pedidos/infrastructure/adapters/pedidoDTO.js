// infrastructure/adapters/pedidoDTO.js
import { createPedido, createDetallePedido } from '../../domain/pedidoModel';

export const pedidoDTO = {

  fromApi(apiData) {
    if (!apiData) return null;
    const fechaCreacion = apiData.fechaCreacion ?? apiData.fecha_creacion ?? apiData.createdAt ?? apiData.created_at;

    const detalles = Array.isArray(apiData.detalles)
      ? apiData.detalles.map(d => createDetallePedido({
          idDetallePedido: d.idDetallePedido,
          idPedido:        d.idPedido,
          idTecnica:       d.idTecnica,
          descripcion:     d.descripcion,
          cantidad:        d.cantidad,
          precioUnitario:  d.precioUnitario,
          subtotal:        d.subtotal,
          observaciones:   d.observaciones,
          tecnica:         d.tecnica,
        }))
      : [];

    return createPedido({
      idPedido:             apiData.idPedido,
      idCotizacion:         apiData.idCotizacion,
      idCliente:            apiData.idCliente,
      estadoPedido:         apiData.estadoPedido,
      estadoPago:           apiData.estadoPago,
      total:                apiData.total,
      totalPagado:          apiData.totalPagado,
      saldoPendiente:       apiData.saldoPendiente,
      fechaCreacion,
      fechaEntregaEstimada: apiData.fechaEntregaEstimada,
      fechaFinalizado:      apiData.fechaFinalizado,
      fechaEntregado:       apiData.fechaEntregado,
      observaciones:        apiData.observaciones,
      cliente:              apiData.cliente,
      cotizacion:           apiData.cotizacion,
      detalles,
      abonos: apiData.abonos || [],
    });
  },

  fromApiList(apiDataList) {
    if (!Array.isArray(apiDataList)) return [];
    return apiDataList.map(item => this.fromApi(item));
  },

  // Para crear pedido: solo necesita idCotizacion (el backend saca todo de la cotización aprobada)
  toApiCreate(domainData) {
    return {
      idCotizacion:  Number(domainData.idCotizacion),
      observaciones: domainData.observaciones?.trim() || null,
    };
  },

  // Para actualizar pedido: observaciones y/o fechaEntregaEstimada
  toApiUpdate(domainData) {
    const payload = {};
    if (domainData.observaciones !== undefined) {
      payload.observaciones = domainData.observaciones?.trim() || null;
    }
    if (domainData.fechaEntregaEstimada !== undefined) {
      payload.fechaEntregaEstimada = domainData.fechaEntregaEstimada || null;
    }
    return payload;
  },
};
