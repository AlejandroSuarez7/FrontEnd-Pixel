export const createTecnicas = ({
    id,
    nombre,
    descripcion,
    estado,
    requiereMedidas,
    fechaActualizacion,
    fechaCreacion,
    detalles
}) => {
    return {
        id,
        nombre,
        descripcion,
        estado,
        requiereMedidas: requiereMedidas ?? true,
        fechaActualizacion,
        fechaCreacion,
        detalles

    }
}
