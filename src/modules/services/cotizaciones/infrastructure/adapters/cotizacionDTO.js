// infrastructure/dtos/quotesDTO.js
import { createQuote, createQuoteDetail } from '../../domain/cotizacionesModel.js';

export const quotesDTO = {

  fromApi(apiData) {
    if (!apiData) return null;

    const detalles = (apiData.detalles || []).map(det => createQuoteDetail({
      idDetalleCotizacion: det.idDetalleCotizacion,
      idCotizacion:        det.idCotizacion,
      idTecnica:           det.idTecnica,
      descripcion:         det.descripcion,
      cantidad:            det.cantidad,
      precioBase:          det.precioBase ?? null,
      descuentoPorcentaje: det.descuentoPorcentaje ?? 0,
      precioUnitario:      det.precioUnitario ?? null,
      costoDiseno:         det.costoDiseno ?? 0,
      subtotal:            det.subtotal ?? null,
      imagenReferencia:    det.imagenReferencia ?? '',
      observaciones:       det.observaciones ?? '',
      tecnica:             det.tecnica ?? null,
    }));

    return createQuote({
      idCotizacion:      apiData.idCotizacion,
      idCliente:         apiData.idCliente,
      creadoPorId:       apiData.creadoPorId,
      tipoCotizacion:    apiData.tipoCotizacion,
      estado:            apiData.estado,
      subtotal:          apiData.subtotal ?? 0,
      costosAdicionales: apiData.costosAdicionales ?? 0,
      total:             apiData.total ?? 0,
      observaciones:     apiData.observaciones ?? '',
      fechaCreacion:     apiData.fechaCreacion
        ?? apiData.fecha_creacion
        ?? apiData.createdAt
        ?? apiData.created_at,
      cliente:           apiData.cliente ?? null,
      creadoPor:         apiData.creadoPor ?? null,
      detalles,
    });
  },

  fromApiList(apiList) {
    if (!Array.isArray(apiList)) return [];
    return apiList.map(item => quotesDTO.fromApi(item)).filter(Boolean);
  },

  toApi(domainData) {
    if (!domainData) return null;

    return {
      idCliente:    domainData.idCliente ? Number(domainData.idCliente) : undefined,
      ...(domainData.cliente && {
        cliente: {
          nombre: domainData.cliente.nombre?.trim() || '',
          correo: domainData.cliente.correo?.trim()?.toLowerCase() || null,
          telefono: domainData.cliente.telefono?.trim() || null,
        },
      }),
      observaciones: domainData.observaciones?.trim() || null,
      ...(domainData.costosAdicionales !== undefined && {
        costosAdicionales: Number(domainData.costosAdicionales),
      }),
      detalles: domainData.detalles?.map(d => ({
        idDetalleCotizacion: d.idDetalleCotizacion ? Number(d.idDetalleCotizacion) : undefined,
        idTecnica:   d.idTecnica && !isNaN(d.idTecnica) ? Number(d.idTecnica) : 0,
        descripcion: d.descripcion?.trim() || '',
        cantidad:    Number(d.cantidad || 1),
        observaciones: d.observaciones?.trim() || null,
      })),
    };
  },

};
