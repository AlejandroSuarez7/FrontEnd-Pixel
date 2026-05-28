// application/useUsers.js
import { useState, useEffect, useCallback } from 'react';
import { UserApiRepository } from '../infrastructure/user.repository';

const userRepository = new UserApiRepository();

export const useUsers = (filters = {}) => {
  const [users, setUsers]   = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await userRepository.list(filters);
      setUsers(data);
    } catch (error) {
      console.error('Error en useUsers hook:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Crear usuario nuevo
  const handleCreate = async (userData) => {
    try {
      await userRepository.create(userData);
      await fetchUsers();
    } catch (error) {
      console.error('Error al crear usuario:', error);
      throw error;
    }
  };

  // Editar usuario existente
  const handleUpdate = async (id, userData) => {
    try {
      await userRepository.update(id, userData);
      await fetchUsers();
    } catch (error) {
      console.error(`Error al actualizar usuario #${id}:`, error);
      throw error;
    }
  };

  // Activar / desactivar lógicamente
  const handleToggleStatus = async (id) => {
    try {
      await userRepository.delete(id);
      await fetchUsers();
    } catch (error) {
      console.error('Error al cambiar estado del usuario:', error);
      throw error;
    }
  };

  // Eliminación permanente
  const handleHardDelete = async (id) => {
    try {
      await userRepository.hardDelete(id);
      await fetchUsers();
    } catch (error) {
      console.error(`Error al eliminar usuario #${id}:`, error);
      throw error;
    }
  };

  return {
    users,
    loading,
    handleCreate,
    handleUpdate,
    handleToggleStatus,
    handleHardDelete,
    refreshUsers: fetchUsers,
  };
};