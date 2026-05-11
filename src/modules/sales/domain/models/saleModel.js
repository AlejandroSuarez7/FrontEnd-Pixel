export const PAYMENT_METHODS = ['Efectivo', 'Transferencia', 'Nequi', 'Daviplata'];

export const SALE_STATUSES = {
  PENDING: 'Pendiente',
  PAID: 'Pagada',
  CANCELED: 'Anulada',
};

export const TECHNIQUE_OPTIONS = ['Sublimado', 'Vinilo', 'Serigrafía', 'Tinta UV'];

export const createSaleItem = ({ idProducto, nombreProducto, tecnica, quantity, unitPrice }) => {
  const quantityNumber = Number(quantity) || 0;
  const unitPriceNumber = Number(unitPrice) || 0;
  return {
    idProducto: idProducto?.trim() || `PRD-${Math.floor(Math.random() * 9000 + 1000)}`,
    nombreProducto: nombreProducto?.trim() || 'Producto sin nombre',
    tecnica: tecnica || TECHNIQUE_OPTIONS[0],
    quantity: quantityNumber,
    unitPrice: unitPriceNumber,
    subtotal: Number((quantityNumber * unitPriceNumber).toFixed(2)),
  };
};

export const createSale = ({
  id,
  clientName,
  saleDate,
  paymentMethod,
  status,
  items,
  observations,
  responsible,
  history = [],
}) => {
  const normalizedItems = (items || []).map((item) => createSaleItem(item));
  const subtotal = normalizedItems.reduce((sum, item) => sum + item.subtotal, 0);
  const tax = Number((subtotal * 0.19).toFixed(2));
  const total = Number((subtotal + tax).toFixed(2));

  return {
    id,
    clientName: clientName?.trim() || 'Cliente sin definir',
    saleDate,
    paymentMethod,
    status,
    items: normalizedItems,
    subtotal,
    tax,
    total,
    observations: observations?.trim() || '',
    responsible,
    history,
  };
};
