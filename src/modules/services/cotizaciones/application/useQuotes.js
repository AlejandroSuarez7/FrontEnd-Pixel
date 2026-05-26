// presentation/hooks/useQuotes.js
import { useState, useEffect, useCallback } from 'react';
import { QuoteApiRepository } from '../infrastructure/quote.repository';

// Instanciamos el repositorio una sola vez afuera para no recrearlo en cada render
const quoteRepository = new QuoteApiRepository();

export const useQuotes = (filters = {}) => {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(false);

  // Usamos useCallback para que la función sea estable y no genere bucles infinitos en el useEffect
  const fetchQuotes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await quoteRepository.list(filters);
      setQuotes(data);
    } catch (error) {
      console.error("Error en useQuotes al listar:", error);
      setQuotes([]);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]); // Se refresca de forma inteligente si cambian las propiedades del filtro

  const handleCreate = async (quoteData, isStaff = false) => {
    try {
      if (isStaff) {
        await quoteRepository.createAsStaff(quoteData);
      } else {
        await quoteRepository.createAsClient(quoteData);
      }
      await fetchQuotes();
    } catch (error) {
      console.error("Error al crear cotización:", error);
      throw error; // Lo relanzamos para que el Modal lo capture y muestre el alert
    }
  };

  const handleUpdate = async (id, quoteData, isStaff = false) => {
    try {
      if (isStaff) {
        // Empleado asignando precios → PATCH /:id/cotizar
        await quoteRepository.assignPrices(id, quoteData);
      } else {
        // Cliente editando su solicitud → PATCH /:id/cliente
        await quoteRepository.updateAsClient(id, quoteData);
      }
      await fetchQuotes();
    } catch (error) {
      console.error("Error al actualizar cotización:", error);
      throw error;
    }
  };

  const handleApprove = async (id) => {
    try {
      await quoteRepository.approve(id);
      await fetchQuotes();
    } catch (error) {
      console.error("Error al aprobar cotización:", error);
      throw error;
    }
  };

  const handleReject = async (id) => {
    try {
      await quoteRepository.reject(id);
      await fetchQuotes();
    } catch (error) {
      console.error("Error al rechazar cotización:", error);
      throw error;
    }
  };

  const handleCancel = async (id) => {
    try {
      await quoteRepository.cancel(id);
      await fetchQuotes();
    } catch (error) {
      console.error("Error al anular cotización:", error);
      throw error;
    }
  };

  // Se ejecuta automáticamente al montar el componente o cuando cambian los filtros
  useEffect(() => {
    fetchQuotes();
  }, [fetchQuotes]);

  return {
    quotes,
    loading,
    handleCreate,
    handleUpdate,
    handleApprove,
    handleReject,
    handleCancel,
    refreshQuotes: fetchQuotes
  };
};