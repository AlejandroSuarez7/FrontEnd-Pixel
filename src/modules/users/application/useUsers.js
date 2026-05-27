// frontend/src/presentation/hooks/useUsers.js
import { useState, useEffect, useCallback } from 'react';
import { UserApiRepository } from '../infrastructure/user.repository';

const userRepository = new UserApiRepository();

export const useUsers = (filters = {}) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await userRepository.list(filters);
      setUsers(data);
    } catch (error) {
      console.error("Error en useUsers hook:", error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]);

  const handleToggleStatus = async (id) => {
    try {
      await userRepository.delete(id);
      await fetchUsers();
    } catch (error) {
      console.error("Error al mutar estado de usuario:", error);
      throw error;
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return {
    users,
    loading,
    handleToggleStatus,
    refreshUsers: fetchUsers
  };
};