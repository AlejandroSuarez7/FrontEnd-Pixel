import { createDiseno } from '../../domain/diseno.model';

export const disenoDTO = {
  fromApi(apiData) {
    if (!apiData) return null;

    return createDiseno({
      idDiseno: apiData.idDiseno,
      idPedido: apiData.idPedido,
      idDisenador: apiData.idDisenador,
      archivoUrl: apiData.archivoUrl,
      descripcion: apiData.descripcion,
      observaciones: apiData.observaciones,
      origenDiseno: apiData.origenDiseno,
      medioRecepcion: apiData.medioRecepcion,
      recibidoPorId: apiData.recibidoPorId,
      recibidoPor: apiData.recibidoPor ?? null,
      estado: apiData.estado,
      fechaCreacion: apiData.fechaCreacion ?? apiData.fecha_creacion,
      fechaActualizacion: apiData.fechaActualizacion,
      fechaEnvio: apiData.fechaEnvio,
      fechaRecepcion: apiData.fechaRecepcion,
      fechaAprobacion: apiData.fechaAprobacion,
      fechaRespuestaCliente: apiData.fechaRespuestaCliente,
      observacionesCliente: apiData.observacionesCliente,
      medioAprobacion: apiData.medioAprobacion,
      medioRespuesta: apiData.medioRespuesta,
      medioRespuestaCliente: apiData.medioRespuestaCliente,
      respuestaRegistradaPor: apiData.respuestaRegistradaPor ?? null,
      pedido: apiData.pedido ?? null,
      disenador: apiData.disenador ?? null,
    });
  },

  fromApiList(apiDataList) {
    if (!Array.isArray(apiDataList)) return [];
    return apiDataList.map(item => this.fromApi(item)).filter(Boolean);
  },

  toApi(domainData) {
    return {
      idPedido: Number(domainData.idPedido),
      ...(domainData.origenDiseno !== 'CLIENTE' && domainData.idDisenador && { idDisenador: Number(domainData.idDisenador) }),
      origenDiseno: domainData.origenDiseno || 'DISENADOR',
      ...(domainData.medioRecepcion && { medioRecepcion: domainData.medioRecepcion }),
      archivoUrl: domainData.archivoUrl?.trim() || null,
      descripcion: domainData.descripcion?.trim() || null,
      observaciones: domainData.observaciones?.trim() || null,
      observacionesCliente: domainData.observacionesCliente?.trim() || null,
      ...(domainData.estado && { estado: domainData.estado }),
    };
  },

  toApiUpdate(domainData) {
    const payload = {};
    if (domainData.archivoUrl !== undefined) payload.archivoUrl = domainData.archivoUrl?.trim() || null;
    if (domainData.descripcion !== undefined) payload.descripcion = domainData.descripcion?.trim() || null;
    if (domainData.observaciones !== undefined) payload.observaciones = domainData.observaciones?.trim() || null;
    return payload;
  },
};
