// infrastructure/tecnicas.repository.js
import { apiClient } from '../../../../core/services/apiService.js';
import { tecnicasDTO } from './adapters/tecnicasDTO.js';

const ENDPOINT = 'api/tecnicas';

export class TecnicasApiRepository {
  
  /**
   * Obtiene la lista completa de técnicas/servicios o aplica filtros de búsqueda parcial.
   */
  async list(filters = {}) {
    try {
      let url = ENDPOINT;
      const params = {};

      // Si el frontend envía un término de búsqueda, usamos la ruta secundaria /buscar
      if (filters.search) {
        url = `${ENDPOINT}/buscar`;
        params.termino = filters.search;
      }

      const { data } = await apiClient.get(url, { params });
      
      // Si la API responde con { data: [...] }, extraemos el array, si no, fallback vacío
      const items = data.data || [];
      
      return tecnicasDTO.fromApiList(items);
    } catch (error) {
      console.error("Error al listar las técnicas desde la API", error);
      return [];
    }
  }

  /**
   * Busca una técnica específica utilizando su ID.
   */
  async getById(id) {
    try {
      const { data } = await apiClient.get(`${ENDPOINT}/${id}`);
      const item = data.data ? data.data : data;
      return tecnicasDTO.fromApi(item);
    } catch (error) {
      throw new Error(error.response?.data?.message || `No se pudo encontrar la técnica #${id}`);
    }
  }

  /**
   * Envía los datos para registrar una nueva técnica.
   */
  async create(tecnicaData) {
    try {
      // Pasamos los datos del formulario por el DTO para limpiar strings y estructuras
      const payload = tecnicasDTO.toApi(tecnicaData);
      const { data } = await apiClient.post(ENDPOINT, payload);
      const item = data.data ? data.data : data;
      return tecnicasDTO.fromApi(item);
    } catch (error) {
      throw new Error(error.response?.data?.message || "No se pudo crear la técnica");
    }
  }

  /**
   * Actualiza parcialmente campos de una técnica existente (como nombre o descripción).
   */
  async update(id, updatedData) {
    try {
      // Si actualizas directamente desde un formulario estructurado, pasas los campos permitidos
      const payload = tecnicasDTO.toApi(updatedData);
      const { data } = await apiClient.patch(`${ENDPOINT}/${id}`, payload);
      const item = data.data ? data.data : data;
      return tecnicasDTO.fromApi(item);
    } catch (error) {
      throw new Error(error.response?.data?.message || "No se pudo actualizar la técnica");
    }
  }

  /**
   * Desactiva lógicamente una técnica usando el endpoint DELETE mapeado en el backend.
   */
  async delete(id) {
    try {
      // Como las rutas exigen verificación de sesión, el apiClient del core se encarga de los interceptores.
      // Golpeamos la ruta router.delete("/:id") de Express
      const { data } = await apiClient.delete(`${ENDPOINT}/${id}`);
      return data;
    } catch (error) {
      console.error(`Error al desactivar la técnica #${id} en el servidor:`, error.response?.data);
      throw new Error(error.response?.data?.message || "No se pudo desactivar la técnica");
    }
  }
}

export const tecnicasRepository = new TecnicasApiRepository();