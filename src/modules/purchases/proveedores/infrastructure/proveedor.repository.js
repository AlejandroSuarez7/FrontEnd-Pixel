import { apiClient } from '../../../../core/services/apiService.js';
import { buildPaginationParams, normalizePaginatedResponse } from '../../../../core/utils/serverPagination.js';
import { proveedorDTO } from './adapters/proveedor.dto.js';

const ENDPOINT = 'api/proveedores';

export class ProveedorApiRepository {
  async list(filters = {}) {
    try {
      const params = buildPaginationParams({
        sortBy: 'nombre',
        order: 'asc',
        ...filters,
      });
      const { data } = await apiClient.get(ENDPOINT, { params });
      return normalizePaginatedResponse(data, proveedorDTO.fromApiList.bind(proveedorDTO));
    } catch (error) {
      console.error('Error al listar proveedores:', error);
      return normalizePaginatedResponse({}, proveedorDTO.fromApiList.bind(proveedorDTO));
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
