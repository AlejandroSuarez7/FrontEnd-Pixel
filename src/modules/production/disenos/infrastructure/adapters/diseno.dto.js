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
      estado: apiData.estado,
      fechaCreacion: apiData.fechaCreacion ?? apiData.fecha_creacion,
      fechaActualizacion: apiData.fechaActualizacion,
      fechaEnvio: apiData.fechaEnvio,
      fechaAprobacion: apiData.fechaAprobacion,
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
      ...(domainData.idDisenador && { idDisenador: Number(domainData.idDisenador) }),
      archivoUrl: domainData.archivoUrl?.trim() || null,
      descripcion: domainData.descripcion?.trim() || null,
      observaciones: domainData.observaciones?.trim() || null,
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
