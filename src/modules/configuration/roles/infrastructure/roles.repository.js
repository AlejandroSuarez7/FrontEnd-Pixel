// infrastructure/roles.repository.js
import { apiClient } from '../../../../core/services/apiService.js';
import { rolesDTO } from './adapters/rolesDTO.js';

const ENDPOINT = 'api/roles';

export class RolesApiRepository {

  /**
   * Lista los roles o ejecuta la búsqueda parcial según el filtro 'search'.
   */
  async list(filters = {}) {
    try {
      let url = ENDPOINT;
      const params = {};

      // Tu controlador mapea el filtro por el query param: ?nombre=valor
      if (filters.search) {
        url = `${ENDPOINT}/buscar`;
        params.nombre = filters.search; // Mapeado exacto a req.query.nombre
      }

      const { data } = await apiClient.get(url, { params });
      const items = data.data || [];

      return rolesDTO.fromApiList(items);
    } catch (error) {
      console.error("Error al listar los roles desde el servidor", error);
      return [];
    }
  }

  /**
   * Registra un nuevo rol.
   */
  async create(roleData) {
    try {
      const payload = rolesDTO.toApi(roleData);
      const { data } = await apiClient.post(ENDPOINT, payload);
      const item = data.data ? data.data : data;
      return rolesDTO.fromApi(item);
    } catch (error) {
      throw new Error(error.response?.data?.message || "No se pudo crear el rol");
    }
  }

  /**
   * Actualiza el nombre o descripción del rol.
   */
  async update(id, updatedData) {
    try {
      const payload = rolesDTO.toApi(updatedData);
      const { data } = await apiClient.patch(`${ENDPOINT}/${id}`, payload);
      const item = data.data ? data.data : data;
      return rolesDTO.fromApi(item);
    } catch (error) {
      throw new Error(error.response?.data?.message || "No se pudo actualizar el rol");
    }
  }

  /**
   * Activa/Desactiva lógicamente el rol usando la ruta DELETE.
   */
  async delete(id) {
    try {
      // Consume: DELETE api/roles/:id
      const { data } = await apiClient.delete(`${ENDPOINT}/${id}`);
      return data;
    } catch (error) {
      console.error(`Error al desactivar el rol #${id} en el servidor:`, error.response?.data);
      throw new Error(error.response?.data?.message || "No se pudo cambiar el estado del rol");
    }
  }
}

export const rolesRepository = new RolesApiRepository();