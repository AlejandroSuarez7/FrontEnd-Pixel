export const getSalesUseCase = async (saleRepository, filters = {}) => {
  return saleRepository.list(filters);
};