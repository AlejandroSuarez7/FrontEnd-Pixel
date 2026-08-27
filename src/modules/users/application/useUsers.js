// application/useUsers.js
import { createPaginationMeta } from '../../../core/utils/serverPagination';
import { useLatestListRequest } from '../../../core/hooks/useLatestListRequest';
import { UserApiRepository } from '../infrastructure/user.repository';

const userRepository = new UserApiRepository();

export const useUsers = (filters = {}) => {
  const queryKey = JSON.stringify(filters);
  const {
    data,
    loading,
    refreshing,
    error,
    refetch: fetchUsers,
  } = useLatestListRequest({
    queryKey,
    load: (signal) => userRepository.list(filters, { signal }),
    initialData: { items: [], meta: createPaginationMeta() },
  });

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

  const findDuplicateFields = (userData, excludeId = null) =>
    userRepository.findDuplicateFields(userData, excludeId);

  return {
    users: data.items,
    paginationMeta: data.meta,
    loading,
    refreshing,
    error,
    handleCreate,
    handleUpdate,
    handleToggleStatus,
    handleHardDelete,
    findDuplicateFields,
    refreshUsers: fetchUsers,
  };
};
