// infrastructure/tecnicas.repository.js
import { apiClient } from '../../../../core/services/apiService.js';
import { tecnicasDTO } from './adapters/tecnicasDTO.js';

const ENDPOINT = 'api/tecnicas';

export class TecnicasApiRepository {

  async list(filters = {}) {
    try {
      let url = ENDPOINT;
      const params = {};

      if (filters.search) {
        url = `${ENDPOINT}/buscar`;
        params.termino = filters.search;
      }

      const { data } = await apiClient.get(url, { params });
      return tecnicasDTO.fromApiList(data.data || []);
    } catch (error) {
      console.error('Error al listar las técnicas desde la API', error);
      return [];
    }
  }

  async getById(id) {
    try {
      const { data } = await apiClient.get(`${ENDPOINT}/${id}`);
      return tecnicasDTO.fromApi(data.data ?? data);
    } catch (error) {
      throw new Error(error.response?.data?.message || `No se pudo encontrar la técnica #${id}`);
    }
  }

  async create(tecnicaData) {
    try {
      const payload = tecnicasDTO.toApi(tecnicaData);
      const { data } = await apiClient.post(ENDPOINT, payload);
      return tecnicasDTO.fromApi(data.data ?? data);
    } catch (error) {
      throw new Error(error.response?.data?.message || 'No se pudo crear la técnica');
    }
  }

  async update(id, updatedData) {
    try {
      const payload = tecnicasDTO.toApi(updatedData);
      const { data } = await apiClient.patch(`${ENDPOINT}/${id}`, payload);
      return tecnicasDTO.fromApi(data.data ?? data);
    } catch (error) {
      throw new Error(error.response?.data?.message || 'No se pudo actualizar la técnica');
    }
  }

  // Desactiva lógicamente: DELETE /:id
  async delete(id) {
    try {
      const { data } = await apiClient.delete(`${ENDPOINT}/${id}`);
      return data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'No se pudo desactivar la técnica');
    }
  }

  // Elimina permanentemente: DELETE /:id/eliminar
  async hardDelete(id) {
    try {
      const { data } = await apiClient.delete(`${ENDPOINT}/${id}/eliminar`);
      return data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'No se pudo eliminar la técnica');
    }
  }
}

export const tecnicasRepository = new TecnicasApiRepository();