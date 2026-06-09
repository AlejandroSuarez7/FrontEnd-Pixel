import { createAbono } from '../../domain/abono.model';

export const abonoDTO = {
  fromApi(apiData) {
    if (!apiData) return null;

    return createAbono({
      idAbono: apiData.idAbono,
      idPedido: apiData.idPedido,
      monto: apiData.monto,
      metodoPago: apiData.metodoPago,
      referencia: apiData.referencia,
      comprobanteUrl: apiData.comprobanteUrl,
      estado: apiData.estado,
      fechaCreacion: apiData.fechaCreacion ?? apiData.fecha_creacion,
      confirmadoPorId: apiData.confirmadoPorId,
      fechaConfirmacion: apiData.fechaConfirmacion,
      rechazadoPorId: apiData.rechazadoPorId,
      fechaRechazo: apiData.fechaRechazo,
      motivoRechazo: apiData.motivoRechazo,
      pedido: apiData.pedido ?? null,
      confirmadoPor: apiData.confirmadoPor ?? null,
      rechazadoPor: apiData.rechazadoPor ?? null,
    });
  },

  fromApiList(apiDataList) {
    if (!Array.isArray(apiDataList)) return [];
    return apiDataList.map(item => this.fromApi(item)).filter(Boolean);
  },

  toApi(domainData) {
    return {
      idPedido: Number(domainData.idPedido),
      monto: Number(domainData.monto),
      metodoPago: domainData.metodoPago,
      referencia: domainData.referencia?.trim() || null,
      comprobanteUrl: domainData.comprobanteUrl?.trim() || null,
      ...(domainData.confirmar !== undefined && { confirmar: Boolean(domainData.confirmar) }),
    };
  },

  toApiUpdate(domainData) {
    const payload = {};
    if (domainData.monto !== undefined) payload.monto = Number(domainData.monto);
    if (domainData.metodoPago !== undefined) payload.metodoPago = domainData.metodoPago;
    if (domainData.referencia !== undefined) payload.referencia = domainData.referencia?.trim() || null;
    if (domainData.comprobanteUrl !== undefined) payload.comprobanteUrl = domainData.comprobanteUrl?.trim() || null;
    return payload;
  },
};
