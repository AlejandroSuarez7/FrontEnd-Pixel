// cotizaciones/application/useQuotes.js
import { useState, useEffect, useCallback } from 'react';
import { QuoteApiRepository } from '../infrastructure/quote.repository';

const quoteRepository = new QuoteApiRepository();

export const useQuotes = (filters = {}) => {
  const [quotes, setQuotes]   = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchQuotes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await quoteRepository.list(filters);
      setQuotes(data);
    } catch (error) {
      console.error('Error en useQuotes al listar:', error);
      setQuotes([]);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => {
    fetchQuotes();
  }, [fetchQuotes]);

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
    quotes,
    loading,
    refetch:         fetchQuotes,
    handleCreate,
    handleUpdate,
    handleApprove,
    handleReject,
    handleCancel,
    handleHardDelete,
  };
};