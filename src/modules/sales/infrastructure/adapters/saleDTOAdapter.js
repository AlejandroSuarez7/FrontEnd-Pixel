import { createSale, createSaleItem } from '../../domain/models/saleModel.js';

export const saleDTOAdapter = {
  toEntity(raw) {
    if (!raw) return null;
    return createSale({
      id: raw.id,
      clientName: raw.clientName,
      saleDate: raw.saleDate,
      paymentMethod: raw.paymentMethod,
      status: raw.status,
      items: (raw.items || []).map((item) => createSaleItem(item)),
      observations: raw.observations,
      responsible: raw.responsible,
      history: raw.history || [],
    });
  },

  toDTO(entity) {
    if (!entity) return null;
    return {
      id: entity.id,
      clientName: entity.clientName,
      saleDate: entity.saleDate,
      paymentMethod: entity.paymentMethod,
      status: entity.status,
      items: (entity.items || []).map((item) => createSaleItem(item)),
      subtotal: entity.subtotal,
      tax: entity.tax,
      total: entity.total,
      observations: entity.observations,
      responsible: entity.responsible,
      history: entity.history || [],
    };
  },
};
