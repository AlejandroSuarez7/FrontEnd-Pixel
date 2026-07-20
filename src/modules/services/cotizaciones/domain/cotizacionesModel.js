// domain/quotesModel.js
export const createQuote = ({
  idCotizacion,
  idCliente,
  creadoPorId,
  tipoCotizacion = "NORMAL",
  estado = "PENDIENTE", // Actualizado al nuevo enum del backend
  subtotal = 0,
  subtotalBruto = null,
  descuentoTotal = null,
  subtotalConDescuento = null,
  subtotalFinal = null,
  costosAdicionales = 0,
  total = 0,
  observaciones = "",
  fechaCreacion,
  cliente,
  creadoPor,
  detalles = []
}) => {
  return {
    idCotizacion, // Usamos la propiedad exacta del backend
    idCliente,
    creadoPorId,
    tipoCotizacion,
    estado,
    subtotal: Number(subtotal),
    subtotalBruto: subtotalBruto !== null && subtotalBruto !== undefined ? Number(subtotalBruto) : null,
    descuentoTotal: descuentoTotal !== null && descuentoTotal !== undefined ? Number(descuentoTotal) : null,
    subtotalConDescuento: subtotalConDescuento !== null && subtotalConDescuento !== undefined ? Number(subtotalConDescuento) : null,
    subtotalFinal: subtotalFinal !== null && subtotalFinal !== undefined ? Number(subtotalFinal) : null,
    costosAdicionales: Number(costosAdicionales),
    total: Number(total),
    observaciones: observaciones || "",
    fechaCreacion,
    cliente,
    creadoPor,
    detalles
  };
};

export const createQuoteDetail = ({
  idDetalleCotizacion,
  idCotizacion,
  idProducto,
  idTecnica,
  descripcion,
  cantidad = 1,
  precioBase = null,
  descuentoPorcentaje = null,
  descuentoValorUnitario = null,
  descuentoTotal = null,
  precioUnitario = null, // Puede ser null inicialmente en el backend
  costoDiseno = 0,
  subtotal = null,
  subtotalBruto = null,
  subtotalConDescuento = null,
  subtotalFinal = null,
  imagenReferencia = "",
  observaciones = "",
  producto,
  tecnica
}) => {
  return {
    idDetalleCotizacion, // Exactamente como Prisma select
    idCotizacion,
    idProducto,
    idTecnica,
    descripcion,
    cantidad: parseInt(cantidad, 10),
    precioBase: precioBase !== null ? Number(precioBase) : null,
    descuentoPorcentaje: descuentoPorcentaje !== null && descuentoPorcentaje !== undefined && descuentoPorcentaje !== ''
      ? Number(String(descuentoPorcentaje).replace(',', '.'))
      : null,
    descuentoValorUnitario: descuentoValorUnitario !== null && descuentoValorUnitario !== undefined && descuentoValorUnitario !== ''
      ? Number(descuentoValorUnitario)
      : null,
    descuentoTotal: descuentoTotal !== null && descuentoTotal !== undefined && descuentoTotal !== ''
      ? Number(descuentoTotal)
      : null,
    precioUnitario: precioUnitario !== null ? Number(precioUnitario) : null,
    costoDiseno: Number(costoDiseno || 0),
    subtotal: subtotal !== null ? Number(subtotal) : null,
    subtotalBruto: subtotalBruto !== null && subtotalBruto !== undefined ? Number(subtotalBruto) : null,
    subtotalConDescuento: subtotalConDescuento !== null && subtotalConDescuento !== undefined ? Number(subtotalConDescuento) : null,
    subtotalFinal: subtotalFinal !== null && subtotalFinal !== undefined ? Number(subtotalFinal) : null,
    imagenReferencia: imagenReferencia || "",
    observaciones: observaciones || "",
    producto,
    tecnica
  };
};
