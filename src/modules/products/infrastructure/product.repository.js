import { apiClient } from '../../../core/services/apiService';
import { buildPaginationParams, normalizePaginatedResponse } from '../../../core/utils/serverPagination';

const ENDPOINT = 'api/productos';

const fromApi = (product) => ({
  idProducto: product.idProducto,
  idCategoriaProducto: product.idCategoriaProducto,
  nombre: product.nombre,
  descripcion: product.descripcion || '',
  precioBase: Number(product.precioBase || 0),
  estado: Boolean(product.estado),
  fechaCreacion: product.fechaCreacion,
  categoriaProducto: product.categoriaProducto || null,
  rangos: product.rangos || [],
});

const fromApiList = (products) => (Array.isArray(products) ? products.map(fromApi) : []);

export const productRepository = {
  async list(filters = {}, options = {}) {
    const params = buildPaginationParams({
      page: 1,
      limit: 10,
      sortBy: 'idProducto',
      order: 'desc',
      ...filters,
    });
    const { data } = await apiClient.get(ENDPOINT, { params, signal: options.signal });
    return normalizePaginatedResponse(data, fromApiList);
  },

  async create(product) {
    const { data } = await apiClient.post(ENDPOINT, {
      nombre: product.nombre.trim(),
      idCategoriaProducto: Number(product.idCategoriaProducto),
      descripcion: product.descripcion?.trim() || null,
      precioBase: Number(product.precioBase),
      estado: Boolean(product.estado),
    });
    return fromApi(data.data);
  },

  async update(idProducto, product) {
    const { data } = await apiClient.patch(`${ENDPOINT}/${idProducto}`, {
      nombre: product.nombre.trim(),
      idCategoriaProducto: Number(product.idCategoriaProducto),
      descripcion: product.descripcion?.trim() || null,
      precioBase: Number(product.precioBase),
      estado: Boolean(product.estado),
    });
    return fromApi(data.data);
  },

  async deactivate(idProducto) {
    const { data } = await apiClient.delete(`${ENDPOINT}/${idProducto}`);
    return data;
  },

  async hardDelete(idProducto) {
    const { data } = await apiClient.delete(`${ENDPOINT}/${idProducto}/eliminar`);
    return data;
  },

  async listRanges(idProducto) {
    const { data } = await apiClient.get(`${ENDPOINT}/${idProducto}/rangos`);
    return data.data || [];
  },

  async replaceRanges(idProducto, rangos) {
    const { data } = await apiClient.patch(`${ENDPOINT}/${idProducto}/rangos`, {
      rangos: rangos.map(rango => ({
        cantidadMin: Number(rango.cantidadMin),
        descuentoPorcentaje: Number(rango.descuentoPorcentaje),
        estado: Boolean(rango.estado),
      })),
    });
    return fromApi(data.data);
  },
};
