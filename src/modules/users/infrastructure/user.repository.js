// infrastructure/users/user.repository.js
import { apiClient } from '../../../core/services/apiService.js';
import { userDTO } from './adapters/userDTO.js';

const ENDPOINT = 'api/usuarios';

export class UserApiRepository {

  async list(filters = {}) {
    try {
      let url = ENDPOINT;
      const params = {};

      if (filters.search) {
        url = `${ENDPOINT}/buscar`;
        params.termino = filters.search;
      }

      if (filters.idRol) {
        params.idRol = filters.idRol;
      }

      const { data } = await apiClient.get(url, { params });
      return userDTO.fromApiList(data.data || []);
    } catch (error) {
      console.error('Error al listar usuarios:', error);
      return [];
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
      throw new Error(error.response?.data?.message || 'No se pudo actualizar el usuario');
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