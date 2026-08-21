// infrastructure/roles.repository.js
import { apiClient } from '../../../../core/services/apiService.js';
import { buildPaginationParams, normalizePaginatedResponse } from '../../../../core/utils/serverPagination.js';
import { createRequestError } from '../../../../core/utils/requestError.js';
import { rolesDTO } from './adapters/rolesDTO.js';

const ENDPOINT = 'api/roles';

export class RolesApiRepository {

  async list(filters = {}, options = {}) {
    const params = buildPaginationParams({
      sortBy: 'nombre',
      order: 'asc',
      ...filters,
    });
    const { data } = await apiClient.get(ENDPOINT, { params, signal: options.signal });
    return normalizePaginatedResponse(data, rolesDTO.fromApiList.bind(rolesDTO));
  }

  async create(roleData) {
    try {
      const payload = rolesDTO.toApi(roleData);
      const { data } = await apiClient.post(ENDPOINT, payload);
      const item = data.data ? data.data : data;
      return rolesDTO.fromApi(item);
    } catch (error) {
      throw createRequestError(error, 'No se pudo crear el rol');
    }
  }

  async update(id, updatedData) {
    try {
      const payload = rolesDTO.toApi(updatedData);
      const { data } = await apiClient.patch(`${ENDPOINT}/${id}`, payload);
      const item = data.data ? data.data : data;
      return rolesDTO.fromApi(item);
    } catch (error) {
      throw createRequestError(error, 'No se pudo actualizar el rol');
    }
  }

  // Desactiva/activa lógicamente el rol: DELETE api/roles/:id
  async delete(id) {
    try {
      const { data } = await apiClient.delete(`${ENDPOINT}/${id}`);
      return data;
    } catch (error) {
      throw createRequestError(error, 'No se pudo cambiar el estado del rol');
    }
  }

  // Elimina físicamente el rol de la base de datos: DELETE api/roles/:id/eliminar
  async hardDelete(id) {
    try {
      const { data } = await apiClient.delete(`${ENDPOINT}/${id}/eliminar`);
      return data;
    } catch (error) {
      throw createRequestError(error, 'No se pudo eliminar el rol');
    }
  }

  async getDeletionImpact(id, options = {}) {
    try {
      const { data } = await apiClient.get(`${ENDPOINT}/${id}/impacto-eliminacion`, {
        signal: options.signal,
      });
      const impact = data?.data ?? data ?? {};
      return {
        puedeEliminar: impact.puedeEliminar === true,
        requiereConfirmacionReforzada: Boolean(impact.requiereConfirmacionReforzada),
        totalAfectados: Math.max(0, Number(impact.totalAfectados) || 0),
        limiteRegistrosPorTipo: Math.max(0, Number(impact.limiteRegistrosPorTipo) || 0),
        afectados: Array.isArray(impact.afectados) ? impact.afectados : [],
        explicacion: impact.explicacion || impact.motivo || impact.mensaje || '',
      };
    } catch (error) {
      throw createRequestError(error, 'No se pudo consultar el impacto de la eliminación');
    }
  }
}

export const rolesRepository = new RolesApiRepository();
