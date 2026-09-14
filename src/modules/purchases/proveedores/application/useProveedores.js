import { createPaginationMeta } from '../../../../core/utils/serverPagination';
import { useLatestListRequest } from '../../../../core/hooks/useLatestListRequest';
import { proveedorRepository } from '../infrastructure/proveedor.repository';

export const useProveedores = (filters = {}) => {
  const queryKey = JSON.stringify(filters);
  const {
    data,
    loading,
    refreshing,
    error,
    refetch: fetchProveedores,
  } = useLatestListRequest({
    queryKey,
    load: (signal) => proveedorRepository.list(filters, { signal }),
    initialData: { items: [], meta: createPaginationMeta() },
  });

  const handleCreate = async (proveedorData) => {
    await proveedorRepository.create(proveedorData);
    await fetchProveedores();
  };

  const handleUpdate = async (idProveedor, proveedorData) => {
    await proveedorRepository.update(idProveedor, proveedorData);
    await fetchProveedores();
  };

  const handleDeactivate = async (idProveedor) => {
    await proveedorRepository.deactivate(idProveedor);
    await fetchProveedores();
  };

  const handleHardDelete = async (idProveedor) => {
    await proveedorRepository.hardDelete(idProveedor);
    await fetchProveedores();
  };

  return {
    proveedores: data.items,
    paginationMeta: data.meta,
    loading,
    refreshing,
    error,
    refetch: fetchProveedores,
    handleCreate,
    handleUpdate,
    handleDeactivate,
    handleHardDelete,
  };
};
