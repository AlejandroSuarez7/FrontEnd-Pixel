import { apiClient } from '../../../../core/services/apiService';
import { buildPaginationParams, normalizePaginatedResponse } from '../../../../core/utils/serverPagination';
import { toServiceTariffPayload } from '../domain/serviceTariffs';

const ENDPOINT = '/api/tarifas-tecnicas';

const normalizeTariff = (tariff = {}) => ({
  ...tariff,
  idTarifa: Number(tariff.idTarifa ?? tariff.idTarifaTecnica),
  idTecnica: Number(tariff.idTecnica),
  anchoHastaCm: tariff.anchoHastaCm == null ? null : Number(tariff.anchoHastaCm),
  altoHastaCm: tariff.altoHastaCm == null ? null : Number(tariff.altoHastaCm),
  esGeneral: tariff.esGeneral ?? (
    tariff.anchoHastaCm == null && tariff.altoHastaCm == null
  ),
  precioUnitario: tariff.precioUnitario == null ? null : Number(tariff.precioUnitario),
  estado: tariff.estado !== false,
  tecnica: tariff.tecnica || null,
});

const normalizeDiscount = (discount = {}) => ({
  ...discount,
  idDescuento: Number(discount.idDescuento),
  idTecnica: Number(discount.idTecnica),
  cantidadMinima: Number(discount.cantidadMinima),
  porcentaje: Number(discount.porcentaje),
  estado: discount.estado !== false,
});

export const tariffRepository = {
  async list(filters = {}, options = {}) {
    const params = buildPaginationParams({
      page: 1,
      limit: 10,
      sortBy: 'idTarifa',
      order: 'desc',
      ...filters,
    });
    const { data } = await apiClient.get(ENDPOINT, { params, signal: options.signal });
    return normalizePaginatedResponse(data, (items) => (
      Array.isArray(items) ? items.map(normalizeTariff) : []
    ));
  },

  async listTechniques(options = {}) {
    const { data } = await apiClient.get('/api/public/tecnicas', { signal: options.signal });
    return Array.isArray(data.data) ? data.data : [];
  },

  async create(payload) {
    const body = toServiceTariffPayload(
      payload,
      payload.idTecnica,
      payload.esGeneral !== true,
    );
    const { data } = await apiClient.post(ENDPOINT, body);
    return normalizeTariff(data.data);
  },

  async update(idTarifa, payload) {
    const body = toServiceTariffPayload(
      payload,
      payload.idTecnica,
      payload.esGeneral !== true,
    );
    delete body.idTecnica;
    const { data } = await apiClient.patch(`${ENDPOINT}/${idTarifa}`, body);
    return normalizeTariff(data.data);
  },

  async remove(idTarifa) {
    const { data } = await apiClient.delete(`${ENDPOINT}/${idTarifa}`);
    return data;
  },

  async listDiscounts(idTecnica, options = {}) {
    const { data } = await apiClient.get(`${ENDPOINT}/tecnicas/${idTecnica}/descuentos`, {
      signal: options.signal,
    });
    return Array.isArray(data.data) ? data.data.map(normalizeDiscount) : [];
  },

  async replaceDiscounts(idTecnica, discounts) {
    const { data } = await apiClient.patch(`${ENDPOINT}/tecnicas/${idTecnica}/descuentos`, {
      descuentos: discounts.map((discount) => ({
        cantidadMinima: Number(discount.cantidadMinima),
        porcentaje: String(discount.porcentaje).replace(',', '.'),
        estado: Boolean(discount.estado),
      })),
    });
    return Array.isArray(data.data) ? data.data.map(normalizeDiscount) : [];
  },
};
