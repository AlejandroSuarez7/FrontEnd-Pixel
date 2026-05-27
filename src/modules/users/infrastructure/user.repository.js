// frontend/src/infrastructure/users/user.repository.js
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
      console.error("Error al listar usuarios:", error);
      return [];
    }
  }

  async delete(id) {
    try {
      const { data } = await apiClient.delete(`${ENDPOINT}/${id}`);
      return data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Error al cambiar el estado del usuario");
    }
  }
}