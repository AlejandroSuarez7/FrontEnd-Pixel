export const getSalesUseCase = async (saleRepository) => {
  return saleRepository.getAllSales();
};
