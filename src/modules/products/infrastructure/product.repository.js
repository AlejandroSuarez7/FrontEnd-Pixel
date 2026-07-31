import { apiClient } from '../../../core/services/apiService';
import { buildPaginationParams, normalizePaginatedResponse } from '../../../core/utils/serverPagination';
import {
  normalizeDiscountRanges,
  toDiscountRangePayload,
} from '../domain/productDiscountRanges';

const ENDPOINT = 'api/productos';

const fromApi = (product) => ({
  idProducto: product.idProducto,
  idCategoriaProducto: product.idCategoriaProducto,
  nombre: product.nombre,
  descripcion: product.descripcion || '',
  precioBase: product.precioBase == null ? null : Number(product.precioBase),
  requiereDiseno: product.requiereDiseno ?? true,
  estado: Boolean(product.estado),
  fechaCreacion: product.fechaCreacion,
  categoriaProducto: product.categoriaProducto || null,
  rangos: normalizeDiscountRanges(product.rangosDescuento || product.rangos || []),
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
      requiereDiseno: Boolean(product.requiereDiseno),
      estado: Boolean(product.estado),
    });
    return fromApi(data.data);
  },

  async update(idProducto, product) {
    const { data } = await apiClient.patch(`${ENDPOINT}/${idProducto}`, {
      nombre: product.nombre.trim(),
      idCategoriaProducto: Number(product.idCategoriaProducto),
      descripcion: product.descripcion?.trim() || null,
      requiereDiseno: Boolean(product.requiereDiseno),
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

  async listRanges(idProducto, options = {}) {
    const { data } = await apiClient.get(`${ENDPOINT}/${idProducto}/rangos`, {
      signal: options.signal,
    });
    const ranges = data.data?.rangos ?? data.data ?? [];
    return normalizeDiscountRanges(ranges);
  },

  async replaceRanges(idProducto, rangos) {
    const { data } = await apiClient.patch(`${ENDPOINT}/${idProducto}/rangos`, {
      rangos: toDiscountRangePayload(rangos),
    });
    return data.data;
  },
};
