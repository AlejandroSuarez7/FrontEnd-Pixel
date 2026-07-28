import { createPaginationMeta } from '../../../../core/utils/serverPagination';
import { useLatestListRequest } from '../../../../core/hooks/useLatestListRequest';
import { QuoteApiRepository } from '../infrastructure/quote.repository';

const quoteRepository = new QuoteApiRepository();

export const useQuotes = (filters = {}) => {
  const queryKey = JSON.stringify(filters);
  const {
    data,
    loading,
    refreshing,
    error,
    refetch: fetchQuotes,
  } = useLatestListRequest({
    queryKey,
    load: (signal) => quoteRepository.list(filters, { signal }),
    initialData: { items: [], meta: createPaginationMeta() },
  });

  // Crea una cotización nueva (cliente o staff)
  const handleCreate = async (quoteData, isStaff = false) => {
    try {
      if (isStaff) {
        await quoteRepository.createAsStaff(quoteData);
      } else {
        await quoteRepository.createAsClient(quoteData);
      }
      await fetchQuotes();
    } catch (error) {
      console.error('Error al crear cotización:', error);
      throw error;
    }
  };

  // Edita (cliente) o asigna precios (staff) a una cotización existente
  const handleUpdate = async (idCotizacion, quoteData, isStaff = false) => {
    try {
      if (isStaff) {
        await quoteRepository.assignPrices(idCotizacion, quoteData);
      } else {
        await quoteRepository.updateAsClient(idCotizacion, quoteData);
      }
      await fetchQuotes();
    } catch (error) {
      console.error('Error al actualizar cotización:', error);
      throw error;
    }
  };

  const handleApprove = async (idCotizacion) => {
    try {
      await quoteRepository.approve(idCotizacion);
      await fetchQuotes();
    } catch (error) {
      console.error('Error al aprobar cotización:', error);
      throw error; // Relanzamos para que la página muestre el mensaje
    }
  };

  const handleReject = async (idCotizacion) => {
    try {
      await quoteRepository.cancel(idCotizacion);
      await fetchQuotes();
    } catch (error) {
      console.error('Error al rechazar cotización:', error);
      throw error;
    }
  };

  const handleCancel = async (idCotizacion) => {
    try {
      await quoteRepository.cancel(idCotizacion);
      await fetchQuotes();
    } catch (error) {
      console.error('Error al anular cotización:', error);
      throw error;
    }
  };

  const handleHardDelete = async (idCotizacion) => {
    try {
      await quoteRepository.hardDelete(idCotizacion);
      await fetchQuotes();
    } catch (error) {
      console.error('Error al eliminar cotización:', error);
      throw error;
    }
  };

  return {
    quotes: data.items,
    paginationMeta: data.meta,
    loading,
    refreshing,
    error,
    refetch:         fetchQuotes,
    handleCreate,
    handleUpdate,
    handleApprove,
    handleReject,
    handleCancel,
    handleHardDelete,
  };
};
