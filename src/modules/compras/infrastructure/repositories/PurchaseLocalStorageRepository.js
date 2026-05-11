import { storageService } from '../../../../core/services/storageService.js';
import { purchasesMock } from '../mocks/purchases.mock.js';
import { purchaseDTOAdapter } from '../adapters/purchaseDTOAdapter.js';
import { PURCHASE_STORAGE_KEY } from '../../constants/purchaseConstants.js';

const getInitialData = () => {
  const stored = storageService.getItem(PURCHASE_STORAGE_KEY, null);
  if (stored && Array.isArray(stored)) {
    return stored;
  }
  storageService.setItem(PURCHASE_STORAGE_KEY, purchasesMock);
  return purchasesMock;
};

let purchases = getInitialData();

const saveState = (items) => {
  purchases = items;
  storageService.setItem(PURCHASE_STORAGE_KEY, items);
};

const applyFilters = (items, filters = {}) => {
  const search = (filters.search || '').trim().toLowerCase();
  const status = filters.status || '';
  const dateRange = filters.dateRange || [];

  return items.filter((item) => {
    const matchesSearch =
      !search ||
      item.invoiceNumber.toLowerCase().includes(search) ||
      item.supplier.toLowerCase().includes(search);
    const matchesStatus = !status || item.status === status;
    const matchesDate = (() => {
      if (!dateRange.length) return true;
      const [start, end] = dateRange;
      const purchaseDate = new Date(item.purchaseDate).setHours(0, 0, 0, 0);
      return (
        purchaseDate >= new Date(start).setHours(0, 0, 0, 0) &&
        purchaseDate <= new Date(end).setHours(0, 0, 0, 0)
      );
    })();

    return matchesSearch && matchesStatus && matchesDate;
  });
};

export class PurchaseLocalStorageRepository {
  list(filters = {}) {
    const sorted = [...purchases].sort((a, b) => new Date(b.purchaseDate) - new Date(a.purchaseDate));
    return applyFilters(sorted, filters).map((item) => purchaseDTOAdapter.toEntity(item));
  }

  getById(id) {
    const purchase = purchases.find((item) => item.id === id);
    return purchase ? purchaseDTOAdapter.toEntity(purchase) : null;
  }

  create(purchaseData) {
    const entity = purchaseDTOAdapter.toEntity(purchaseData);
    purchases = [entity, ...purchases];
    saveState(purchases);
    return entity;
  }

  update(id, purchaseData) {
    const index = purchases.findIndex((item) => item.id === id);
    if (index < 0) throw new Error('Compra no encontrada');
    const entity = purchaseDTOAdapter.toEntity({ ...purchaseData, id });
    purchases[index] = entity;
    saveState(purchases);
    return entity;
  }

  cancel(id, reason) {
    const index = purchases.findIndex((item) => item.id === id);
    if (index < 0) throw new Error('Compra no encontrada');
    const entity = purchaseDTOAdapter.toEntity({
      ...purchases[index],
      status: 'Anulada',
      cancellationReason: reason,
      canceledAt: new Date().toISOString(),
    });
    purchases[index] = entity;
    saveState(purchases);
    return entity;
  }
}
