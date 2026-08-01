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
      tipoProducto:        det.tipoProducto ?? (det.idProducto ? 'CATALOGO' : 'OTRO'),
      nombrePersonalizado: det.nombrePersonalizado ?? null,
      descripcionPersonalizada: det.descripcionPersonalizada ?? '',
      materialReferencia:  det.materialReferencia ?? '',
      suministradoPor:     det.suministradoPor ?? 'PIXEL',
      estampados:          Array.isArray(det.estampados) ? det.estampados.map((stamp) => ({
        ...stamp,
        idTecnica: stamp.idTecnica == null ? null : Number(stamp.idTecnica),
        idTarifaTecnica: stamp.idTarifaTecnica == null ? null : Number(stamp.idTarifaTecnica),
        anchoCm: stamp.anchoCm == null ? null : Number(stamp.anchoCm),
        altoCm: stamp.altoCm == null ? null : Number(stamp.altoCm),
        precioUnitarioSugerido: stamp.precioUnitarioSugerido == null ? null : Number(stamp.precioUnitarioSugerido),
        subtotalSugerido: stamp.subtotalSugerido == null ? null : Number(stamp.subtotalSugerido),
        requiereRevisionPrecio: Boolean(stamp.requiereRevisionPrecio),
      })) : [],
      requiereRevisionPrecio: det.requiereRevisionPrecio ?? false,
      calculoCompleto: det.calculoCompleto ?? null,
      estadoMedidas: det.estadoMedidas ?? null,
      motivosRevision: Array.isArray(det.motivosRevision) ? det.motivosRevision : [],
      rangoProductoAplicado: det.rangoProductoAplicado ?? det.rangoDescuentoAplicado ?? null,
      precioSugeridoInterno: det.precioSugeridoInterno ?? null,
      subtotalSugeridoInterno: det.subtotalSugeridoInterno ?? null,
      subtotalServiciosOficial: det.subtotalServiciosOficial ?? null,
      costoProducto: det.costoProducto ?? 0,
      otrosCostosItem: det.otrosCostosItem ?? 0,
      subtotalOficial: det.subtotalOficial ?? null,
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
      observacionesInternas: apiData.observacionesInternas ?? '',
      precioSugeridoInterno: apiData.precioSugeridoInterno ?? null,
      precioSugeridoSistema: apiData.precioSugeridoSistema ?? null,
      calculoCompleto: apiData.calculoCompleto ?? null,
      requiereRevisionPrecio: apiData.requiereRevisionPrecio ?? false,
      advertenciasInternas: apiData.advertenciasInternas ?? [],
      disenosPropuesta: apiData.disenosPropuesta ?? apiData.disenosCotizables ?? apiData.disenos ?? [],
      conceptosAdicionales: apiData.conceptosAdicionales ?? [],
      estadoPrecio: apiData.estadoPrecio ?? null,
      propuesta: apiData.propuesta ?? null,
      versiones: apiData.versiones ?? [],
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

    const sourceItems = domainData.items ?? domainData.detalles ?? [];
    const items = sourceItems.map((item) => {
      const tipoProducto = String(
        item.tipoProducto ?? (item.idProducto ? 'CATALOGO' : 'OTRO')
      ).toUpperCase();
      const sourceStamps = Array.isArray(item.estampados) && item.estampados.length > 0
        ? item.estampados
        : item.idTecnica
          ? [{
              idTecnica: item.idTecnica,
              idTarifaTecnica: item.idTarifaTecnica,
              ubicacion: item.ubicacion || 'FRENTE',
              anchoCm: item.anchoCm,
              altoCm: item.altoCm,
              origenDiseno: item.origenDiseno,
              grupoDisenoCompartido: item.grupoDisenoCompartido,
            }]
          : [];

      return {
        ...(item.idDetalleCotizacion && {
          idDetalleCotizacion: Number(item.idDetalleCotizacion),
        }),
        tipoProducto,
        ...(tipoProducto === 'CATALOGO' && item.idProducto
          ? { idProducto: Number(item.idProducto) }
          : {}),
        ...(tipoProducto === 'OTRO'
          ? {
              nombrePersonalizado: item.nombrePersonalizado?.trim()
                || item.descripcion?.trim()
                || '',
              descripcionPersonalizada: item.descripcionPersonalizada?.trim() || null,
              materialReferencia: item.materialReferencia?.trim() || null,
            }
          : {}),
        cantidad: Number(item.cantidad || 1),
        suministradoPor: String(item.suministradoPor || 'PIXEL').toUpperCase(),
        estampados: sourceStamps.map((stamp) => ({
          idTecnica: stamp.idTecnica ? Number(stamp.idTecnica) : null,
          idTarifaTecnica: stamp.idTarifaTecnica ? Number(stamp.idTarifaTecnica) : null,
          ubicacion: stamp.ubicacion?.trim() || 'FRENTE',
          anchoCm: stamp.anchoCm !== '' && stamp.anchoCm != null ? Number(stamp.anchoCm) : null,
          altoCm: stamp.altoCm !== '' && stamp.altoCm != null ? Number(stamp.altoCm) : null,
          origenDiseno: String(stamp.origenDiseno || 'PENDIENTE_DEFINIR').toUpperCase(),
          ...(stamp.grupoDisenoCompartido?.trim()
            ? { grupoDisenoCompartido: stamp.grupoDisenoCompartido.trim() }
            : {}),
          ...(stamp.descripcion?.trim() ? { descripcion: stamp.descripcion.trim() } : {}),
          ...(stamp.observaciones?.trim() ? { observaciones: stamp.observaciones.trim() } : {}),
        })),
        observaciones: item.observaciones?.trim() || null,
      };
    });

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
      items,
    };
  },

};
