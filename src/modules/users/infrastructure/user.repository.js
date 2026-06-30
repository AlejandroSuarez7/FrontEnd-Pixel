// infrastructure/users/user.repository.js
import { apiClient } from '../../../core/services/apiService.js';
import { buildPaginationParams, normalizePaginatedResponse } from '../../../core/utils/serverPagination.js';
import { userDTO } from './adapters/userDTO.js';

const ENDPOINT = 'api/usuarios';

export class UserApiRepository {

  async list(filters = {}) {
    try {
      const params = buildPaginationParams({
        sortBy: 'nombre',
        order: 'asc',
        ...filters,
      });
      const { data } = await apiClient.get(ENDPOINT, { params });
      return normalizePaginatedResponse(data, userDTO.fromApiList.bind(userDTO));
    } catch (error) {
      console.error('Error al listar usuarios:', error);
      return normalizePaginatedResponse({}, userDTO.fromApiList.bind(userDTO));
    }
  }

  // Crea un nuevo usuario: POST /api/usuarios
  async create(userData) {
    try {
      const { data } = await apiClient.post(ENDPOINT, userData);
      return userDTO.fromApi(data.data ?? data);
    } catch (error) {
      throw new Error(error.response?.data?.message || 'No se pudo crear el usuario');
    }
  }

  // Actualiza datos del usuario: PATCH /api/usuarios/:id
  async update(id, userData) {
    try {
      const { data } = await apiClient.patch(`${ENDPOINT}/${id}`, userData);
      return userDTO.fromApi(data.data ?? data);
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message || 'No se pudo actualizar el usuario');
    }
  }

  // Activa / desactiva lógicamente: DELETE /api/usuarios/:id
  async delete(id) {
    try {
      const { data } = await apiClient.delete(`${ENDPOINT}/${id}`);
      return data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al cambiar el estado del usuario');
    }
  }

  // Eliminación permanente: DELETE /api/usuarios/:id/eliminar
  async hardDelete(id) {
    try {
      const { data } = await apiClient.delete(`${ENDPOINT}/${id}/eliminar`);
      return data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'No se pudo eliminar el usuario');
    }
  }
}
