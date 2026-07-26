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
      fechaPago: apiData.fechaPago,
      comprobanteUrl: apiData.comprobanteUrl,
      comprobanteDisponible: apiData.comprobanteDisponible,
      nombreOriginalComprobante: apiData.nombreOriginalComprobante,
      comprobanteMimeType: apiData.comprobanteMimeType,
      comprobanteSizeBytes: apiData.comprobanteSizeBytes,
      comprobanteSubidoEn: apiData.comprobanteSubidoEn,
      montoDetectadoOcr: apiData.montoDetectadoOcr,
      referenciaDetectadaOcr: apiData.referenciaDetectadaOcr,
      fechaDetectadaOcr: apiData.fechaDetectadaOcr,
      bancoDetectadoOcr: apiData.bancoDetectadoOcr,
      confianzaOcr: apiData.confianzaOcr,
      requiereRevisionManual: apiData.requiereRevisionManual,
      origenRegistro: apiData.origenRegistro,
      observaciones: apiData.observaciones,
      estado: apiData.estado,
      fechaCreacion: apiData.fechaCreacion
        ?? apiData.fecha_creacion
        ?? apiData.createdAt
        ?? apiData.created_at,
      confirmadoPorId: apiData.confirmadoPorId,
      fechaConfirmacion: apiData.fechaConfirmacion
        ?? apiData.fecha_confirmacion
        ?? apiData.confirmedAt
        ?? apiData.confirmed_at,
      rechazadoPorId: apiData.rechazadoPorId,
      fechaRechazo: apiData.fechaRechazo
        ?? apiData.fecha_rechazo
        ?? apiData.rejectedAt
        ?? apiData.rejected_at,
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
      monto: domainData.monto === null || domainData.monto === undefined || domainData.monto === ''
        ? null
        : Number(domainData.monto),
      metodoPago: domainData.metodoPago,
      referencia: domainData.referencia?.trim() || null,
      comprobanteUrl: domainData.comprobanteUrl?.trim() || null,
      fechaPago: domainData.fechaPago || null,
      observaciones: domainData.observaciones?.trim() || null,
      ...(domainData.confirmar !== undefined && { confirmar: Boolean(domainData.confirmar) }),
    };
  },

  toApiUpdate(domainData) {
    const payload = {};
    if (domainData.monto !== undefined) {
      payload.monto = domainData.monto === null || domainData.monto === ''
        ? null
        : Number(domainData.monto);
    }
    if (domainData.metodoPago !== undefined) payload.metodoPago = domainData.metodoPago;
    if (domainData.referencia !== undefined) payload.referencia = domainData.referencia?.trim() || null;
    if (domainData.comprobanteUrl !== undefined) payload.comprobanteUrl = domainData.comprobanteUrl?.trim() || null;
    if (domainData.fechaPago !== undefined) payload.fechaPago = domainData.fechaPago || null;
    if (domainData.observaciones !== undefined) payload.observaciones = domainData.observaciones?.trim() || null;
    return payload;
  },
};
