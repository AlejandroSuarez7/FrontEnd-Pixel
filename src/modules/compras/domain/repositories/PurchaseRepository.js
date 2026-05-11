export class PurchaseRepository {
  list(filters) {
    throw new Error('PurchaseRepository.list must be implemented');
  }

  getById(id) {
    throw new Error('PurchaseRepository.getById must be implemented');
  }

  create(purchase) {
    throw new Error('PurchaseRepository.create must be implemented');
  }

  update(id, purchase) {
    throw new Error('PurchaseRepository.update must be implemented');
  }

  cancel(id, reason) {
    throw new Error('PurchaseRepository.cancel must be implemented');
  }
}
