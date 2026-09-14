import { createPaginationMeta } from '../../../../core/utils/serverPagination';
import { useLatestListRequest } from '../../../../core/hooks/useLatestListRequest';
import { rolesRepository } from '../infrastructure/roles.repository';

export const useRoles = (filters = {}) => {
  const queryKey = JSON.stringify(filters);
  const {
    data,
    loading,
    refreshing,
    error,
    refetch: fetchRoles,
  } = useLatestListRequest({
    queryKey,
    load: (signal) => rolesRepository.list(filters, { signal }),
    initialData: { items: [], meta: createPaginationMeta() },
  });

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

  const getDeletionImpact = (id, options) => rolesRepository.getDeletionImpact(id, options);

  return {
    roles: data.items,
    paginationMeta: data.meta,
    loading,
    refreshing,
    error,
    handleCreate,
    handleUpdate,
    handleDelete,
    handleHardDelete,
    getDeletionImpact,
    refreshRoles: fetchRoles,
  };
};
