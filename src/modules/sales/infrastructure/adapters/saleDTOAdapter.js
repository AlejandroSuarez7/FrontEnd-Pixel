import { createSale } from '../../domain/models/saleModel.js';

export const saleDTOAdapter = {
  // API → Entidad de dominio
  toEntity(dto) {
    return createSale({
      id:          dto.idVenta,       // API: idVenta
      id_usuario:  dto.usuarioId,     // API: usuarioId
      id_pedido:   dto.pedidoId,      // API: pedidoId
      created_at:  dto.createdAt,     // API: createdAt
      total:       Number(dto.total),
      metodo_pago: dto.metodoPago,    // API: metodoPago
      estado:      dto.estado,
    });
  },

  // Entidad de dominio → Payload para el API
  toDTO(entity) {
    return {
      usuarioId:  entity.id_usuario,
      pedidoId:   entity.id_pedido,
      total:      entity.total,
      metodoPago: entity.metodo_pago,
      estado:     entity.estado,
    };
  },
};