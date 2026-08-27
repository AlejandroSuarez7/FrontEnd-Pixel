import { apiClient } from '../../../core/services/apiService';
import { buildPaginationParams, normalizePaginatedResponse } from '../../../core/utils/serverPagination';

const ENDPOINT = 'api/categorias-producto';
const PUBLIC_ENDPOINT = '/api/public/categorias-producto';

const fromApi = (category) => ({
  idCategoriaProducto: category.idCategoriaProducto,
  nombre: category.nombre,
  descripcion: category.descripcion || '',
  estado: category.estado ?? true,
  fechaCreacion: category.fechaCreacion,
});

const fromApiList = (categories) => (Array.isArray(categories) ? categories.map(fromApi) : []);

export const categoryRepository = {
  async list(filters = {}, options = {}) {
    const params = buildPaginationParams({
      page: 1,
      limit: 10,
      sortBy: 'idCategoriaProducto',
      order: 'desc',
      ...filters,
    });
    const { data } = await apiClient.get(ENDPOINT, { params, signal: options.signal });
    return normalizePaginatedResponse(data, fromApiList);
  },

  async listPublic(options = {}) {
    const { data } = await apiClient.get(PUBLIC_ENDPOINT, {
      signal: options.signal,
    });
    return fromApiList(data.data || []);
  },

  async create(category) {
    const { data } = await apiClient.post(ENDPOINT, {
      nombre: category.nombre.trim(),
      descripcion: category.descripcion?.trim() || null,
      estado: Boolean(category.estado),
    });
    return fromApi(data.data);
  },

  async update(idCategoriaProducto, category) {
    const { data } = await apiClient.patch(`${ENDPOINT}/${idCategoriaProducto}`, {
      nombre: category.nombre.trim(),
      descripcion: category.descripcion?.trim() || null,
      estado: Boolean(category.estado),
    });
    return fromApi(data.data);
  },

  async deactivate(idCategoriaProducto) {
    const { data } = await apiClient.patch(`${ENDPOINT}/${idCategoriaProducto}/desactivar`);
    return data;
  },

  async hardDelete(idCategoriaProducto) {
    const { data } = await apiClient.delete(`${ENDPOINT}/${idCategoriaProducto}`);
    return data;
  },
};
