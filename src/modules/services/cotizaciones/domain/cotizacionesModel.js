// domain/quotesModel.js
export const createQuote = ({
  id,
  idCliente,
  creadoPorId,
  tipoCotizacion = "NORMAL",
  estado = "SOLICITADA",
  subtotal = 0,
  costosAdicionales = 0,
  total = 0,
  observaciones = "",
  fechaCreacion,
  detalles = []
}) => {
  return {
    id,
    idCliente,
    creadoPorId,
    tipoCotizacion,
    estado,
    subtotal: Number(subtotal),
    costosAdicionales: Number(costosAdicionales),
    total: Number(total),
    observaciones: observaciones || "",
    fechaCreacion,
    detalles // Sub-arreglo con los ítems de producción
  };
};

export const createQuoteDetail = ({
  idDetalle,
  idCotizacion,
  idTecnica,
  descripcion,
  cantidad = 1,
  precioUnitario = 0,
  costoDiseno = 0,
  subtotal = 0,
  imagenReferencia = "",
  observaciones = ""
}) => {
  return {
    idDetalle,
    idCotizacion,
    idTecnica,
    descripcion,
    cantidad: parseInt(cantidad, 10),
    precioUnitario: Number(precioUnitario || 0),
    costoDiseno: Number(costoDiseno || 0),
    subtotal: Number(subtotal || 0),
    imagenReferencia: imagenReferencia || "",
    observaciones: observaciones || ""
  };
};