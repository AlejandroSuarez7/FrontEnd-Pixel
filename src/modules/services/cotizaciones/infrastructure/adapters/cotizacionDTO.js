// infrastructure/dtos/quotesDTO.js
import { createQuote, createQuoteDetail } from "../../domain/cotizacionesModel";

export const quotesDTO = {
  fromApi(apiData) {
    if (!apiData) return null;

    // Mapear los detalles internos si existen
    const mappedDetails = Array.isArray(apiData.detalles)
      ? apiData.detalles.map(d => createQuoteDetail({
          idDetalle: d.idDetalleCotizacion,
          idCotizacion: d.idCotizacion,
          idTecnica: d.idTecnica,
          descripcion: d.descripcion,
          cantidad: d.cantidad,
          precioUnitario: d.precioUnitario,
          costoDiseno: d.costoDiseno,
          subtotal: d.subtotal,
          imagenReferencia: d.imagenReferencia,
          observaciones: d.observaciones
        }))
      : [];

    return createQuote({
      id: apiData.idCotizacion,
      idCliente: apiData.idCliente,
      creadoPorId: apiData.creadoPorId,
      tipoCotizacion: apiData.tipoCotizacion,
      estado: apiData.estado,
      subtotal: apiData.subtotal,
      costosAdicionales: apiData.costosAdicionales,
      total: apiData.total,
      observaciones: apiData.observaciones,
      fechaCreacion: apiData.fechaCreacion,
      detalles: mappedDetails
    });
  },

  fromApiList(apiDataList) {
    if (!Array.isArray(apiDataList)) return [];
    return apiDataList.map(item => this.fromApi(item));
  },

  // Estructura el payload para enviar al backend (tanto para Cliente como para Empleado)
  toApi(domainData) {
    if (!domainData) return null;
    
    return {
      idCliente: domainData.idCliente,
      observaciones: domainData.observaciones?.trim(),
      costosAdicionales: domainData.costosAdicionales,
      // Mapeamos los detalles listos para el createMany o updates del servicio
      detalles: domainData.detalles?.map(d => ({
        idTecnica: Number(d.idTecnica),
        descripcion: d.descripcion?.trim(),
        cantidad: Number(d.cantidad),
        precioUnitario: d.precioUnitario ? Number(d.precioUnitario) : undefined,
        costoDiseno: d.costoDiseno ? Number(d.costoDiseno) : undefined,
        imagenReferencia: d.imagenReferencia,
        observaciones: d.observaciones
      }))
    };
  }
};