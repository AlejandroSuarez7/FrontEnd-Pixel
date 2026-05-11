export const ORDER_STATUS = {
  PENDING: 'Pendiente',
  PROCESSING: 'En proceso',
  COMPLETED: 'Completado',
  CANCELED: 'Anulada',
};

export const ORDER_STATUS_OPTIONS = [
  ORDER_STATUS.PENDING,
  ORDER_STATUS.PROCESSING,
  ORDER_STATUS.COMPLETED,
  ORDER_STATUS.CANCELED,
];

export const ORDER_STATUS_TAG = {
  [ORDER_STATUS.PENDING]: { color: 'gold', label: 'Pendiente' },
  [ORDER_STATUS.PROCESSING]: { color: 'blue', label: 'En proceso' },
  [ORDER_STATUS.COMPLETED]: { color: 'green', label: 'Completado' },
  [ORDER_STATUS.CANCELED]: { color: 'red', label: 'Anulado' },
};
