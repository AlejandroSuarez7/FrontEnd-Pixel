import { useCallback, useEffect, useState } from 'react';
import { proveedorRepository } from '../infrastructure/proveedor.repository';

export const useProveedores = (filters = {}) => {
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchProveedores = useCallback(async () => {
    setLoading(true);
    try {
      const data = await proveedorRepository.list(filters);
      setProveedores(data);
    } catch (error) {
      console.error('Error en useProveedores al listar:', error);
      setProveedores([]);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => {
    fetchProveedores();
  }, [fetchProveedores]);

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
    proveedores,
    loading,
    refetch: fetchProveedores,
    handleCreate,
    handleUpdate,
    handleDeactivate,
    handleHardDelete,
  };
};
