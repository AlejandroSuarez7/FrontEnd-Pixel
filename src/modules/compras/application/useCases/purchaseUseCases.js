import { PurchasePdfService } from '../services/PurchasePdfService.js';

const pdfService = new PurchasePdfService();

export const listPurchasesUseCase = async (repository, filters) => repository.list(filters);
export const getPurchaseByIdUseCase = async (repository, id) => repository.getById(id);
export const createPurchaseUseCase = async (repository, purchase) => repository.create(purchase);
export const updatePurchaseUseCase = async (repository, id, purchase) => repository.update(id, purchase);
export const cancelPurchaseUseCase = async (repository, id, reason) => repository.cancel(id, reason);
export const exportPurchasePdfUseCase = async (purchase) => ({
  blob: pdfService.createPurchasePdf(purchase),
  fileName: `compra_${purchase.id}.pdf`,
});
