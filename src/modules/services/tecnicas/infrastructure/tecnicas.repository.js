import { apiClient } from '../../../../core/services/apiService.js';
import { buildPaginationParams, normalizePaginatedResponse } from '../../../../core/utils/serverPagination.js';
import { tecnicasDTO } from './adapters/tecnicasDTO.js';

const ENDPOINT = 'api/tecnicas';

export class TecnicasApiRepository {
  async list(filters = {}) {
    try {
      const params = buildPaginationParams({
        sortBy: 'nombre',
        order: 'asc',
        ...filters,
      });
      const { data } = await apiClient.get(ENDPOINT, { params });
      return normalizePaginatedResponse(data, tecnicasDTO.fromApiList.bind(tecnicasDTO));
    } catch (error) {
      console.error('Error al listar las tecnicas desde la API', error);
      return normalizePaginatedResponse({}, tecnicasDTO.fromApiList.bind(tecnicasDTO));
    }
  }

  async getById(id) {
    try {
      const { data } = await apiClient.get(`${ENDPOINT}/${id}`);
      return tecnicasDTO.fromApi(data.data ?? data);
    } catch (error) {
      throw new Error(error.response?.data?.message || `No se pudo encontrar la tecnica #${id}`);
    }
  }

  async create(tecnicaData) {
    try {
      const payload = tecnicasDTO.toApi(tecnicaData);
      const { data } = await apiClient.post(ENDPOINT, payload);
      return tecnicasDTO.fromApi(data.data ?? data);
    } catch (error) {
      throw new Error(error.response?.data?.message || 'No se pudo crear la tecnica');
    }
  }

  async update(id, updatedData) {
    try {
      const payload = tecnicasDTO.toApi(updatedData);
      const { data } = await apiClient.patch(`${ENDPOINT}/${id}`, payload);
      return tecnicasDTO.fromApi(data.data ?? data);
    } catch (error) {
      throw new Error(error.response?.data?.message || 'No se pudo actualizar la tecnica');
    }
  }

  async delete(id) {
    try {
      const { data } = await apiClient.delete(`${ENDPOINT}/${id}`);
      return data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'No se pudo desactivar la tecnica');
    }
  }

  async hardDelete(id) {
    try {
      const { data } = await apiClient.delete(`${ENDPOINT}/${id}/eliminar`);
      return data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'No se pudo eliminar la tecnica');
    }
  }
}

export const tecnicasRepository = new TecnicasApiRepository();
