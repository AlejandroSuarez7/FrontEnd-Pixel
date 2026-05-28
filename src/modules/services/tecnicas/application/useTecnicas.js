// tecnicas/application/useTecnicas.js
import { useState, useEffect } from 'react';
import { tecnicasRepository } from '../infrastructure/tecnicas.repository';

export const useTecnicas = (filters = {}) => {
  const [tecnicas, setTecnicas] = useState([]);
  const [loading, setLoading]   = useState(false);

  const fetchTecnicas = async () => {
    setLoading(true);
    try {
      const data = await tecnicasRepository.list(filters);
      setTecnicas(data);
    } catch (error) {
      console.error('Error en el hook al cargar las técnicas:', error);
      setTecnicas([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (tecnicaData) => {
    try {
      await tecnicasRepository.create(tecnicaData);
      await fetchTecnicas();
    } catch (error) {
      console.error('Error en el hook al crear la técnica:', error);
      throw error;
    }
  };

  const handleUpdate = async (id, updatedData) => {
    try {
      await tecnicasRepository.update(id, updatedData);
      await fetchTecnicas();
    } catch (error) {
      console.error(`Error en el hook al actualizar la técnica #${id}:`, error);
      throw error;
    }
  };

  // Desactivación lógica: DELETE /:id
  const handleDelete = async (id) => {
    try {
      await tecnicasRepository.delete(id);
      await fetchTecnicas();
    } catch (error) {
      console.error(`Error en el hook al desactivar la técnica #${id}:`, error);
      throw error;
    }
  };

  // Eliminación permanente: DELETE /:id/eliminar
  const handleHardDelete = async (id) => {
    try {
      await tecnicasRepository.hardDelete(id);
      await fetchTecnicas();
    } catch (error) {
      console.error(`Error en el hook al eliminar la técnica #${id}:`, error);
      throw error;
    }
  };

  useEffect(() => {
    fetchTecnicas();
  }, [filters.search]);

  return {
    tecnicas,
    loading,
    handleCreate,
    handleUpdate,
    handleDelete,
    handleHardDelete,
    refreshTecnicas: fetchTecnicas,
  };
};