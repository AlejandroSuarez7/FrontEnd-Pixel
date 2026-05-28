// domain/quotesModel.js
export const createQuote = ({
  idCotizacion,
  idCliente,
  creadoPorId,
  tipoCotizacion = "NORMAL",
  estado = "PENDIENTE", // Actualizado al nuevo enum del backend
  subtotal = 0,
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
  idTecnica,
  descripcion,
  cantidad = 1,
  precioUnitario = null, // Puede ser null inicialmente en el backend
  costoDiseno = 0,
  subtotal = null,
  imagenReferencia = "",
  observaciones = "",
  tecnica
}) => {
  return {
    idDetalleCotizacion, // Exactamente como Prisma select
    idCotizacion,
    idTecnica,
    descripcion,
    cantidad: parseInt(cantidad, 10),
    precioUnitario: precioUnitario !== null ? Number(precioUnitario) : null,
    costoDiseno: Number(costoDiseno || 0),
    subtotal: subtotal !== null ? Number(subtotal) : null,
    imagenReferencia: imagenReferencia || "",
    observaciones: observaciones || "",
    tecnica
  };
};