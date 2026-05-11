export const createSaleUseCase = async (saleRepository, saleEntity) => {
  return saleRepository.saveSale(saleEntity);
};
