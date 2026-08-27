import { createAbono } from '../../domain/abono.model';

export const abonoDTO = {
  fromApi(apiData) {
    if (!apiData) return null;

    const datosDetectados = apiData.datosDetectados || {};
    const datosDefinitivos = apiData.datosDefinitivos || {};
    const pedidoApi = apiData.pedido || null;
    const totalPedido = apiData.totalPedido ?? pedidoApi?.total ?? pedidoApi?.totalPedido;
    const totalConfirmado = apiData.totalConfirmado
      ?? pedidoApi?.totalPagadoConfirmado
      ?? pedidoApi?.totalPagado;
    const saldoPendiente = apiData.saldoPendiente ?? pedidoApi?.saldoPendiente;
    const estadoPago = apiData.estadoPago ?? pedidoApi?.estadoPago;
    const pedido = pedidoApi
      ? {
          ...pedidoApi,
          total: totalPedido ?? pedidoApi.total,
          totalPedido: totalPedido ?? pedidoApi.totalPedido,
          totalPagado: totalConfirmado ?? pedidoApi.totalPagado,
          totalPagadoConfirmado: totalConfirmado ?? pedidoApi.totalPagadoConfirmado,
          saldoPendiente: saldoPendiente ?? pedidoApi.saldoPendiente,
          estadoPago: estadoPago ?? pedidoApi.estadoPago,
        }
      : null;

    return createAbono({
      idAbono: apiData.idAbono,
      idPedido: apiData.idPedido,
      monto: datosDefinitivos.monto ?? apiData.monto,
      metodoPago: apiData.metodoPago,
      referencia: datosDefinitivos.referencia ?? apiData.referencia,
      fechaPago: datosDefinitivos.fecha ?? apiData.fechaPago,
      comprobanteUrl: apiData.comprobanteUrl,
      comprobanteDisponible: apiData.comprobanteDisponible,
      nombreOriginalComprobante: apiData.nombreOriginalComprobante,
      comprobanteMimeType: apiData.comprobanteMimeType,
      comprobanteSizeBytes: apiData.comprobanteSizeBytes,
      comprobanteSubidoEn: apiData.comprobanteSubidoEn,
      montoDetectadoOcr: datosDetectados.monto ?? apiData.montoDetectadoOcr ?? apiData.montoDetectado,
      referenciaDetectadaOcr: datosDetectados.referencia ?? apiData.referenciaDetectadaOcr ?? apiData.referenciaDetectada,
      fechaDetectadaOcr: datosDetectados.fecha ?? apiData.fechaDetectadaOcr ?? apiData.fechaDetectada,
      bancoDetectadoOcr: datosDetectados.banco ?? apiData.bancoDetectadoOcr ?? apiData.bancoDetectado,
      confianzaOcr: datosDetectados.calidadLectura ?? apiData.confianzaOcr ?? apiData.calidadLectura,
      calidadLectura: datosDetectados.calidadLectura ?? apiData.calidadLectura ?? apiData.confianzaOcr,
      requiereRevisionManual: datosDetectados.requiereRevisionManual ?? apiData.requiereRevisionManual,
      origenAnalisis: apiData.origenAnalisis,
      origenRegistro: apiData.origenRegistroCodigo ?? apiData.origenRegistro,
      origenRegistroCodigo: apiData.origenRegistroCodigo ?? apiData.origenRegistro,
      origenRegistroLabel: apiData.origenRegistroLabel,
      datosDetectados,
      datosDefinitivos,
      totalPedido,
      totalConfirmado,
      saldoPendiente,
      estadoPago,
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
      pedido,
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
