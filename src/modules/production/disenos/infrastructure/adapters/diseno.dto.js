import { createDiseno } from '../../domain/diseno.model';
import { buildDesignTargetPayload } from '../../domain/designRequirement';

export const disenoDTO = {
  fromApi(apiData) {
    if (!apiData) return null;

    return createDiseno({
      idDiseno: apiData.idDiseno,
      idPedido: apiData.idPedido,
      idDetallePedido: apiData.idDetallePedido ?? null,
      idEstampadoPedido: apiData.idEstampadoPedido ?? apiData.idDetalleEstampadoPedido ?? null,
      grupoDisenoCompartido: apiData.grupoDisenoCompartido ?? null,
      tipoObjetivo: apiData.tipoObjetivo ?? null,
      esDisenoGeneral: apiData.esDisenoGeneral ?? false,
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
      detallePedido: apiData.detallePedido ?? null,
      pedido: apiData.pedido ?? null,
      disenador: apiData.disenador ?? null,
    });
  },

  fromApiList(apiDataList) {
    if (!Array.isArray(apiDataList)) return [];
    return apiDataList.map(item => this.fromApi(item)).filter(Boolean);
  },

  toApi(domainData) {
    if (domainData.requirement) {
      return buildDesignTargetPayload(domainData.requirement, domainData);
    }

    return {
      idPedido: Number(domainData.idPedido),
      ...(domainData.esDisenoGeneral && { esDisenoGeneral: true }),
      ...(!domainData.esDisenoGeneral && domainData.idDetallePedido && { idDetallePedido: Number(domainData.idDetallePedido) }),
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
