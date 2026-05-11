import { SALE_STATUSES } from '../../domain/models/saleModel.js';

export const annulSaleUseCase = async (saleRepository, saleId, userEmail) => {
  const sale = await saleRepository.getSaleById(saleId);
  if (!sale) {
    throw new Error('Venta no encontrada');
  }

  if (sale.status === SALE_STATUSES.CANCELED) {
    return sale;
  }

  const updatedSale = {
    ...sale,
    status: SALE_STATUSES.CANCELED,
    history: [
      ...sale.history,
      {
        when: new Date().toISOString(),
        action: 'Venta anulada',
        by: userEmail,
      },
    ],
  };

  return saleRepository.updateSale(updatedSale);
};
