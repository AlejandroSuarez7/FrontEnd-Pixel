// infrastructure/dtos/quotesDTO.js
import { createQuote, createQuoteDetail } from '../../domain/cotizacionesModel.js';

export const quotesDTO = {

  fromApi(apiData) {
    if (!apiData) return null;

    const detalles = (apiData.detalles || []).map(det => createQuoteDetail({
      idDetalleCotizacion: det.idDetalleCotizacion,
      idCotizacion:        det.idCotizacion,
      idProducto:          det.idProducto,
      idTecnica:           det.idTecnica,
      descripcion:         det.descripcion,
      cantidad:            det.cantidad,
      precioBase:          det.precioBase ?? null,
      descuentoPorcentaje: det.descuentoPorcentaje ?? det.descuento ?? det.porcentajeDescuento ?? null,
      descuentoValorUnitario: det.descuentoValorUnitario ?? null,
      descuentoTotal:      det.descuentoTotal ?? det.descuentoAplicado ?? null,
      precioUnitario:      det.precioUnitario ?? null,
      costoDiseno:         det.costoDiseno ?? 0,
      requiereDiseno:      det.requiereDiseno !== false,
      origenDiseno:        det.origenDiseno ?? 'PIXEL',
      esDisenoGeneral:     Boolean(det.esDisenoGeneral),
      archivoDisenoInicialUrl: det.archivoDisenoInicialUrl ?? '',
      subtotal:            det.subtotal ?? null,
      subtotalBruto:       det.subtotalBruto ?? det.subtotal ?? null,
      subtotalConDescuento: det.subtotalConDescuento ?? null,
      subtotalFinal:       det.subtotalFinal ?? null,
      imagenReferencia:    det.imagenReferencia ?? '',
      observaciones:       det.observaciones ?? '',
      producto:            det.producto ?? null,
      tecnica:             det.tecnica ?? null,
    }));

    return createQuote({
      idCotizacion:      apiData.idCotizacion,
      idCliente:         apiData.idCliente,
      creadoPorId:       apiData.creadoPorId,
      tipoCotizacion:    apiData.tipoCotizacion,
      estado:            apiData.estado,
      subtotal:          apiData.subtotal ?? 0,
      subtotalBruto:     apiData.subtotalBruto ?? apiData.subtotal ?? null,
      descuentoTotal:    apiData.descuentoTotal ?? null,
      subtotalConDescuento: apiData.subtotalConDescuento ?? null,
      subtotalFinal:     apiData.subtotalFinal ?? null,
      costoDiseno:       apiData.costoDiseno ?? 0,
      costosAdicionales: apiData.costosAdicionales ?? 0,
      total:             apiData.total ?? 0,
      cantidadItems:     apiData.cantidadItems ?? detalles.length,
      productosResumen:  apiData.productosResumen ?? '',
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
        idProducto:  d.idProducto && !isNaN(d.idProducto) ? Number(d.idProducto) : undefined,
        idTecnica:   d.idTecnica && !isNaN(d.idTecnica) ? Number(d.idTecnica) : 0,
        descripcion: d.descripcion?.trim() || '',
        cantidad:    Number(d.cantidad || 1),
        observaciones: d.observaciones?.trim() || null,
        requiereDiseno: d.requiereDiseno !== false,
        origenDiseno: d.origenDiseno === 'CLIENTE' ? 'CLIENTE' : 'PIXEL',
        esDisenoGeneral: Boolean(d.esDisenoGeneral),
        archivoDisenoInicialUrl: d.archivoDisenoInicialUrl?.trim() || null,
      })),
    };
  },

};
