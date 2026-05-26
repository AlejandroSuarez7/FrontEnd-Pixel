// presentation/hooks/useRoles.js
import { useState, useEffect } from 'react';
import { rolesRepository } from '../infrastructure/roles.repository';

export const useRoles = (filters = {}) => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const data = await rolesRepository.list(filters);
      setRoles(data);
    } catch (error) {
      console.error("Error en useRoles al cargar data:", error);
      setRoles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (roleData) => {
    try {
      await rolesRepository.create(roleData);
      await fetchRoles();
    } catch (error) {
      console.error("Error en useRoles al crear:", error);
      throw error;
    }
  };

  const handleUpdate = async (id, updatedData) => {
    try {
      await rolesRepository.update(id, updatedData);
      await fetchRoles();
    } catch (error) {
      console.error(`Error en useRoles al actualizar #${id}:`, error);
      throw error;
    }
  };

  const handleDelete = async (id) => {
    try {
      await rolesRepository.delete(id);
      await fetchRoles();
    } catch (error) {
      console.error(`Error en useRoles al alternar estado #${id}:`, error);
      throw error;
    }
  };

  // Reacciona automáticamente cada que el buscador cambie su texto
  useEffect(() => {
    fetchRoles();
  }, [filters.search]);

  return {
    roles,
    loading,
    handleCreate,
    handleUpdate,
    handleDelete,
    refreshRoles: fetchRoles
  };
};