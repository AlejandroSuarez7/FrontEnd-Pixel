import { createVenta } from '../../domain/venta.model';

export const ventaDTO = {
  fromApi(apiData) {
    if (!apiData) return null;
    return createVenta({
      idPedido: apiData.idPedido,
      idVenta: apiData.idVenta,
      idCliente: apiData.idCliente,
      nombreCliente: apiData.nombreCliente,
      correoCliente: apiData.correoCliente,
      telefonoCliente: apiData.telefonoCliente,
      total: apiData.total,
      totalPagado: apiData.totalPagado,
      saldoPendiente: apiData.saldoPendiente,
      estado: apiData.estado,
      fechaPrimerPago: apiData.fechaPrimerPago,
      fechaCreacion: apiData.fechaCreacion,
      fechaFinalizado: apiData.fechaFinalizado,
      fechaEntregado: apiData.fechaEntregado,
      estadoPago: apiData.estadoPago,
      tecnicas: apiData.tecnicas || [],
      cantidadTotalProductos: apiData.cantidadTotalProductos || 0,
    });
  },

  fromApiList(apiDataList) {
    if (!Array.isArray(apiDataList)) return [];
    return apiDataList.map(item => this.fromApi(item)).filter(Boolean);
  },
};
