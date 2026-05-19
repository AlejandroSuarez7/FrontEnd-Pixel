export const createCotizacion = ({
    id,
    costoDiseno,
    costosAdicionales,
    creadoPorId,
    estado,
    fechaActualizacion,
    fechaCreacion,
    id_cliente,
    observaciones,
    subtotal,
    tipo_cotizacion,
    total,

    cliente,
    creadoPor,
    detalles
}) => {
    return {
        id,
        costoDiseno,
        costosAdicionales,
        creadoPorId,
        estado,
        fechaActualizacion,
        fechaCreacion,
        id_cliente,
        observaciones,
        subtotal,
        tipo_cotizacion,
        total,
        cliente,
        creadoPor,
        detalles

    }
}