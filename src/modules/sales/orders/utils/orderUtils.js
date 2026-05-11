export const cloneOrder = (order) => JSON.parse(JSON.stringify(order));

export const calculateOrderTotals = (products) => {
  const quantity = products.reduce((sum, product) => sum + Number(product.cantidad || 0), 0);
  const total = products.reduce((sum, product) => sum + Number(product.subtotal || 0), 0);
  return { quantity, total };
};

export const getStatusBadgeProps = (status) => {
  switch (status) {
    case 'Pendiente':
      return { color: 'gold', label: 'Pendiente' };
    case 'En proceso':
      return { color: 'blue', label: 'En proceso' };
    case 'Completado':
      return { color: 'green', label: 'Completado' };
    case 'Anulada':
      return { color: 'red', label: 'Anulada' };
    default:
      return { color: 'default', label: status || 'Desconocido' };
  }
};

export const buildOrderFromForm = (values) => ({
  orderNumber: values.orderNumber,
  clientName: values.clientName,
  date: values.date,
  status: values.status,
  products: values.products?.map((item) => ({
    idProducto: item.idProducto,
    nombreProducto: item.nombreProducto,
    cantidad: Number(item.cantidad),
    precio: Number(item.precio),
    subtotal: Number(item.cantidad) * Number(item.precio),
  })) || [],
  notes: values.notes,
});
