import { createSale } from '../../domain/models/saleModel.js';

export const saleDTOAdapter = {
  // API → Entidad de dominio
  toEntity(dto) {
    return createSale({
      id: dto.idVenta,
      id_usuario: dto.usuarioId,
      id_pedido: dto.pedidoId,
      created_at: dto.createdAt,

      total: Number(dto.total),
      metodo_pago: dto.metodoPago,
      estado: dto.estado,

      // 👇 relaciones
      usuario: dto.usuario,
      pedido: dto.pedido,
    });
  },

  // Entidad de dominio → Payload para el API
  toDTO(entity) {
    return {
      usuarioId: entity.id_usuario,
      pedidoId: entity.id_pedido,
      total: entity.total,
      metodoPago: entity.metodo_pago,
      estado: entity.estado,
    };
  },
};