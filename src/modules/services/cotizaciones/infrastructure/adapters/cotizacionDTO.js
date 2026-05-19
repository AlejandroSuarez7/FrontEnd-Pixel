import { createCotizacion } from "../../domain/cotizacionesModel";

export const cotizacionDTO = {
  toEntity(dto) {
    const detallesMapeados = Array.isArray(dto.detalles) 
            ? dto.detalles.map(d => ({
                idDetalle: d.idDetalleCotizacion || d.id_detalle_cotizacion,
                idTecnica: d.idTecnica || d.id_tecnica,
                descripcion: d.descripcion || '',
                cantidad: d.cantidad || 0,
                precioUnitario: Number(d.precioUnitario || d.precio_unitario || 0),
                costoDiseno: Number(d.costoDiseno || d.costo_diseno || 0),
                subtotal: Number(d.subtotal || 0),
                observaciones: d.observaciones || ''
            }))
            : [];

    return createCotizacion({
      // Mapeamos idCotizacion (del backend) al 'id' genérico que usa el Front
      id: dto.idCotizacion || dto.id, 
      costoDiseno: dto.costoDiseno || 0,
      costosAdicionales: dto.costosAdicionales || 0,
      creadoPorId: dto.creadoPorId,
      estado: dto.estado || 'PENDIENTE',
      fechaActualizacion: dto.fechaActualizacion,
      fechaCreacion: dto.fechaCreacion,
      id_cliente: dto.id_cliente || dto.idCliente, // Previene inconsistencias
      observaciones: dto.observaciones || '',
      subtotal: dto.subtotal || 0,
      tipo_cotizacion: dto.tipo_cotizacion || dto.tipoCotizacion || 'NORMAL',
      total: dto.total || 0,

      cliente: dto.cliente,
      creadoPor: dto.creadoPor,
      detalles: detallesMapeados
    });
  },

  toDTO(entity) {
        // Enviar con las claves exactas que tu servicio de TS desestructura y valida
        return {
            idCliente: Number(entity.idCliente),
            observaciones: entity.observaciones || '',
            costosAdicionales: Number(entity.costosAdicionales || 0),
            
            // Mapeamos los detalles al formato camelCase que espera tu Map del backend
            detalles: Array.isArray(entity.detalles) 
                ? entity.detalles.map(d => ({
                    idTecnica: Number(d.idTecnica),
                    descripcion: d.descripcion.trim(),
                    cantidad: Number(d.cantidad),
                    precioUnitario: Number(d.precioUnitario),
                    costoDiseno: Number(d.costoDiseno || 0),
                    observaciones: d.observaciones?.trim() || ''
                }))
                : []
        };
    }
};