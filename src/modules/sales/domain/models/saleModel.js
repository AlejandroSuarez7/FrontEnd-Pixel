export const PAYMENT_METHODS = ['Efectivo', 'Transferencia', 'Nequi', 'Daviplata'];

export const SALE_STATUSES = {
  PENDING: 'Pendiente',
  PAID: 'Pagada',
  CANCELED: 'Anulada',
};

export const TECHNIQUE_OPTIONS = ['Sublimado', 'Vinilo', 'Serigrafía', 'Tinta UV'];

export const createSale = ({
  id,
  id_usuario,
  id_pedido,
  created_at,
  total,
  metodo_pago,
  estado,
}) => {
  return {
    id,
    id_usuario,
    id_pedido,
    created_at,
    total,
    metodo_pago,
    estado,
  };
};
