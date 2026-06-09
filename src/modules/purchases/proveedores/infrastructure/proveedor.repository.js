import { apiClient } from '../../../../core/services/apiService.js';
import { proveedorDTO } from './adapters/proveedor.dto.js';

const ENDPOINT = 'api/proveedores';

const getItems = (data) => data.data || data.proveedores || data || [];

export class ProveedorApiRepository {
  async list(filters = {}) {
    try {
      if (filters.search) {
        const { data } = await apiClient.get(`${ENDPOINT}/buscar`, {
          params: { termino: filters.search },
        });
        return proveedorDTO.fromApiList(getItems(data));
      }

      const params = {};
      if (filters.estado !== '') params.estado = filters.estado;
      const { data } = await apiClient.get(ENDPOINT, { params });
      return proveedorDTO.fromApiList(getItems(data));
    } catch (error) {
      console.error('Error al listar proveedores:', error);
      return [];
    }
  }

  async getById(idProveedor) {
    try {
      const { data } = await apiClient.get(`${ENDPOINT}/${idProveedor}`);
      return proveedorDTO.fromApi(data.data);
    } catch (error) {
      throw new Error(error.message || 'No se pudo consultar el proveedor');
    }
  }

  async create(proveedorData) {
    try {
      const { data } = await apiClient.post(ENDPOINT, proveedorDTO.toApiCreate(proveedorData));
      return proveedorDTO.fromApi(data.data);
    } catch (error) {
      throw new Error(error.message || 'No se pudo crear el proveedor');
    }
  }

  async update(idProveedor, proveedorData) {
    try {
      const { data } = await apiClient.patch(`${ENDPOINT}/${idProveedor}`, proveedorDTO.toApi(proveedorData));
      return proveedorDTO.fromApi(data.data);
    } catch (error) {
      throw new Error(error.message || 'No se pudo actualizar el proveedor');
    }
  }

  async deactivate(idProveedor) {
    try {
      const { data } = await apiClient.delete(`${ENDPOINT}/${idProveedor}`);
      return data;
    } catch (error) {
      throw new Error(error.message || 'No se pudo desactivar el proveedor');
    }
  }

  async hardDelete(idProveedor) {
    try {
      const { data } = await apiClient.delete(`${ENDPOINT}/${idProveedor}/eliminar`);
      return data;
    } catch (error) {
      throw new Error(error.message || 'No se pudo eliminar el proveedor');
    }
  }
}

export const proveedorRepository = new ProveedorApiRepository();
