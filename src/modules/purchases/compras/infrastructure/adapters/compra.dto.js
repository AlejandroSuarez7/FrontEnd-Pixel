import { createCompra, createDetalleCompra } from '../../domain/compra.model';

const mapDetalles = (detalles = []) => detalles.map(detalle => createDetalleCompra({
  idDetalleCompra: detalle.idDetalleCompra,
  descripcionInsumo: detalle.descripcionInsumo,
  cantidad: detalle.cantidad,
  costoUnitario: detalle.costoUnitario,
  subtotal: detalle.subtotal,
}));

export const compraDTO = {
  fromApi(apiData) {
    if (!apiData) return null;
    return createCompra({
      idCompra: apiData.idCompra,
      idPedido: apiData.idPedido,
      idProveedor: apiData.idProveedor,
      compradoPorId: apiData.compradoPorId,
      estado: apiData.estado,
      total: apiData.total,
      fechaCompra: apiData.fechaCompra ?? apiData.fecha_creacion ?? apiData.fechaCreacion,
      observaciones: apiData.observaciones,
      proveedor: apiData.proveedor ?? null,
      compradoPor: apiData.compradoPor ?? null,
      detalles: mapDetalles(apiData.detalles || []),
      pedido: apiData.pedido ?? null,
    });
  },

  fromApiList(apiDataList) {
    if (!Array.isArray(apiDataList)) return [];
    return apiDataList.map(item => this.fromApi(item)).filter(Boolean);
  },

  toApi(domainData) {
    return {
      idPedido: Number(domainData.idPedido),
      idProveedor: Number(domainData.idProveedor),
      observaciones: domainData.observaciones?.trim() || null,
      ...(domainData.confirmar !== undefined && { confirmar: Boolean(domainData.confirmar) }),
      detalles: (domainData.detalles || []).map(detalle => ({
        descripcionInsumo: detalle.descripcionInsumo?.trim(),
        cantidad: Number(detalle.cantidad),
        costoUnitario: Number(detalle.costoUnitario),
      })),
    };
  },

  toApiUpdate(domainData) {
    const payload = {};
    if (domainData.idProveedor !== undefined) payload.idProveedor = Number(domainData.idProveedor);
    if (domainData.observaciones !== undefined) payload.observaciones = domainData.observaciones?.trim() || null;
    if (domainData.detalles !== undefined) {
      payload.detalles = (domainData.detalles || []).map(detalle => ({
        descripcionInsumo: detalle.descripcionInsumo?.trim(),
        cantidad: Number(detalle.cantidad),
        costoUnitario: Number(detalle.costoUnitario),
      }));
    }
    return payload;
  },
};
