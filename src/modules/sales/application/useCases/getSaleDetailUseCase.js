export const getSaleDetailUseCase = async (saleRepository, saleId) => {
  return saleRepository.getSaleById(saleId);
};
