import { useState, useEffect } from 'react';
import { quoteRepository } from '../infrastructure/quote.repository';

export const useQuotes = (filters = {}) => {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchQuotes = async () => {
    setLoading(true);
    try {
      const data = await quoteRepository.list(filters);
      setQuotes(data); 
    } catch (error) {
      console.error("Error al cargar cotizaciones desde la API", error);
      setQuotes([]); 
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (quoteData) => {
    try {
      await quoteRepository.create(quoteData);
      await fetchQuotes(); 
    } catch (error) {
      console.error("Error al crear cotización", error);
    }
  };

  const handleUpdate = async (id, updatedData) => {
    try {
      await quoteRepository.update(id, updatedData);
      await fetchQuotes(); 
    } catch (error) {
      console.error(`Error al actualizar la cotización #${id}`, error);
    }
  };

  const handleReject = async (id) => {
    try {
      await quoteRepository.reject(id);
      // Recargamos la lista para ver el cambio de estado a "RECHAZADA" en tiempo real
      await fetchQuotes(); 
    } catch (error) {
      console.error(`Error al rechazar la cotización #${id}`, error);
    }
  };

  useEffect(() => {
    fetchQuotes();
  }, [filters.search, filters.status]); 

  return { 
    quotes, 
    loading, 
    handleCreate, 
    handleUpdate, 
    handleReject,
    refreshQuotes: fetchQuotes 
  };
};