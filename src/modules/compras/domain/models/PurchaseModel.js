import { PURCHASE_STATES } from '../../constants/purchaseConstants.js';

export const calculatePurchaseTotals = (items = []) => {
  const subtotal = items.reduce((sum, item) => sum + Number(item.subtotal || 0), 0);
  const tax = Number((subtotal * 0.19).toFixed(0));
  const total = subtotal + tax;
  return { subtotal, tax, total };
};

export const buildPurchaseEntity = ({
  id,
  invoiceNumber,
  supplier,
  purchaseDate,
  paymentMethod,
  status,
  items = [],
  notes,
  createdBy,
  createdAt,
  cancellationReason,
  canceledAt,
}) => {
  const normalizedItems = (items || []).map((item, index) => ({
    idInsumo: item.idInsumo || `INS-${Date.now()}-${index}`,
    nombreInsumo: item.nombreInsumo?.trim() || '',
    categoria: item.categoria || '',
    cantidad: Number(item.cantidad || 0),
    unidadMedida: item.unidadMedida || 'unidad',
    precioUnitario: Number(item.precioUnitario || 0),
    subtotal: Number(item.subtotal || item.cantidad * item.precioUnitario || 0),
  }));

  const totals = calculatePurchaseTotals(normalizedItems);

  return {
    id: id || `CMP-${Date.now()}`,
    invoiceNumber: invoiceNumber?.trim() || '',
    supplier: supplier?.trim() || '',
    purchaseDate: purchaseDate || new Date().toISOString().split('T')[0],
    paymentMethod: paymentMethod || 'Efectivo',
    status: status || PURCHASE_STATES.PENDING,
    items: normalizedItems,
    subtotal: totals.subtotal,
    tax: totals.tax,
    total: totals.total,
    notes: notes?.trim() || '',
    createdBy: createdBy || 'admin@pixel.com',
    createdAt: createdAt || new Date().toISOString(),
    canceledAt: canceledAt || null,
    cancellationReason: cancellationReason || null,
  };
};
