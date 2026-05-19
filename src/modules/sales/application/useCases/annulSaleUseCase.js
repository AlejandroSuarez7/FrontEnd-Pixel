export const annulSaleUseCase = async (saleRepository, saleId, motivo) => {
  // Simplemente llamamos al repositorio pasando el ID y el objeto con el motivo
  return await saleRepository.cancel(saleId, motivo);
};