// infrastructure/adapters/pedidoDTO.js
import { createPedido, createDetallePedido } from '../../domain/pedidoModel';

export const pedidoDTO = {

  fromApi(apiData) {
    if (!apiData) return null;
    const fechaCreacion = apiData.fechaCreacion ?? apiData.fecha_creacion ?? apiData.createdAt ?? apiData.created_at;
    const fechaActualizacion = apiData.fechaActualizacion
      ?? apiData.fecha_actualizacion
      ?? apiData.updatedAt
      ?? apiData.updated_at;
    const fechaEntregaEstimada = apiData.fechaEntregaEstimada
      ?? apiData.fecha_entrega_estimada
      ?? apiData.fechaEstimadaEntrega
      ?? apiData.fecha_estimada_entrega
      ?? apiData.fechaEntrega
      ?? apiData.fecha_entrega;
    const fechaFinalizado = apiData.fechaFinalizado
      ?? apiData.fecha_finalizado
      ?? apiData.finalizadoAt
      ?? apiData.finalizado_at;
    const fechaEntregado = apiData.fechaEntregado
      ?? apiData.fecha_entregado
      ?? apiData.entregadoAt
      ?? apiData.entregado_at;

    const detalles = Array.isArray(apiData.detalles)
      ? apiData.detalles.map(d => createDetallePedido({
          idDetallePedido: d.idDetallePedido,
          idPedido:        d.idPedido,
          idTecnica:       d.idTecnica,
          descripcion:     d.descripcion,
          cantidad:        d.cantidad,
          precioBase:      d.precioBase ?? null,
          descuentoPorcentaje: d.descuentoPorcentaje ?? d.descuento ?? null,
          descuentoTotal:  d.descuentoTotal ?? d.descuentoAplicado ?? null,
          precioUnitario:  d.precioUnitario,
          subtotal:        d.subtotal,
          subtotalBruto:   d.subtotalBruto ?? d.subtotal ?? null,
          subtotalConDescuento: d.subtotalConDescuento ?? null,
          subtotalFinal:   d.subtotalFinal ?? null,
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
      subtotal:             apiData.subtotalBruto ?? apiData.subtotal ?? apiData.cotizacion?.subtotalBruto ?? apiData.cotizacion?.subtotal,
      descuentoTotal:       apiData.descuentoTotal ?? apiData.cotizacion?.descuentoTotal,
      costosAdicionales:    apiData.costosAdicionales ?? apiData.cotizacion?.costosAdicionales,
      totalPagado:          apiData.totalPagado,
      saldoPendiente:       apiData.saldoPendiente,
      fechaCreacion,
      fechaActualizacion,
      fechaEntregaEstimada,
      fechaFinalizado,
      fechaEntregado,
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
