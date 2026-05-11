import { buildPurchaseEntity } from '../../domain/models/PurchaseModel.js';

export const purchaseDTOAdapter = {
  toEntity(dto) {
    return buildPurchaseEntity({
      id: dto.id,
      invoiceNumber: dto.invoiceNumber,
      supplier: dto.supplier,
      purchaseDate: dto.purchaseDate,
      paymentMethod: dto.paymentMethod,
      status: dto.status,
      items: dto.items,
      notes: dto.notes,
      createdBy: dto.createdBy,
      createdAt: dto.createdAt,
      cancellationReason: dto.cancellationReason,
      canceledAt: dto.canceledAt,
    });
  },

  toDTO(entity) {
    return {
      id: entity.id,
      invoiceNumber: entity.invoiceNumber,
      supplier: entity.supplier,
      purchaseDate: entity.purchaseDate,
      paymentMethod: entity.paymentMethod,
      status: entity.status,
      items: entity.items,
      subtotal: entity.subtotal,
      tax: entity.tax,
      total: entity.total,
      notes: entity.notes,
      createdBy: entity.createdBy,
      createdAt: entity.createdAt,
      canceledAt: entity.canceledAt,
      cancellationReason: entity.cancellationReason,
    };
  },
};
