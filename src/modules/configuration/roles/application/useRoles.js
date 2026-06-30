// presentation/hooks/useRoles.js
import { useState, useEffect } from 'react';
import { createPaginationMeta } from '../../../../core/utils/serverPagination';
import { rolesRepository } from '../infrastructure/roles.repository';

export const useRoles = (filters = {}) => {
  const [roles, setRoles] = useState([]);
  const [paginationMeta, setPaginationMeta] = useState(createPaginationMeta());
  const [loading, setLoading] = useState(false);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const response = await rolesRepository.list(filters);
      setRoles(response.items);
      setPaginationMeta(response.meta);
    } catch (error) {
      console.error("Error en useRoles al cargar data:", error);
      setRoles([]);
      setPaginationMeta(createPaginationMeta());
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (roleData) => {
    try {
      const createdRole = await rolesRepository.create(roleData);
      await fetchRoles();
      return createdRole;
    } catch (error) {
      console.error("Error en useRoles al crear:", error);
      throw error;
    }
  };

  const handleUpdate = async (id, updatedData) => {
    try {
      const updatedRole = await rolesRepository.update(id, updatedData);
      await fetchRoles();
      return updatedRole;
    } catch (error) {
      console.error(`Error en useRoles al actualizar #${id}:`, error);
      throw error;
    }
  };

  // Desactiva/activa lógicamente el rol
  const handleDelete = async (id) => {
    try {
      await rolesRepository.delete(id);
      await fetchRoles();
    } catch (error) {
      console.error(`Error en useRoles al alternar estado #${id}:`, error);
      throw error;
    }
  };

  // Elimina físicamente el rol de la base de datos
  const handleHardDelete = async (id) => {
    try {
      await rolesRepository.hardDelete(id);
      await fetchRoles();
    } catch (error) {
      console.error(`Error en useRoles al eliminar #${id}:`, error);
      throw error;
    }
  };

  useEffect(() => {
    fetchRoles();
  }, [filters.search, filters.page, filters.limit, filters.sortBy, filters.order]);

  return {
    roles,
    paginationMeta,
    loading,
    handleCreate,
    handleUpdate,
    handleDelete,
    handleHardDelete,
    refreshRoles: fetchRoles,
  };
};
