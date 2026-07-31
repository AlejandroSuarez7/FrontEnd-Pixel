import { apiClient } from '../../../../core/services/apiService.js';
import { normalizePermissionCodes } from '../../../../core/utils/permissions.js';

const ENDPOINT = 'api/permisos';

const normalizePermission = (item) => ({
  idPermiso: item.idPermiso ?? item.id ?? item.id_permiso,
  codigo: item.codigo,
  modulo: item.modulo || 'general',
  accion: item.accion || item.codigo?.split('.')?.[1] || '',
  descripcion: item.descripcion || item.codigo,
  estado: item.estado ?? true,
});

export class PermissionsApiRepository {
  async list() {
    const { data } = await apiClient.get(ENDPOINT);
    const items = data.data || data || [];
    return Array.isArray(items) ? items.map(normalizePermission) : [];
  }

  async listByRole(idRol) {
    const { data } = await apiClient.get(`${ENDPOINT}/roles/${idRol}`);
    const payload = data.data || data || [];
    const items = Array.isArray(payload)
      ? payload
      : payload.permisos || payload.codigos || [];

    return normalizePermissionCodes(items);
  }

  async assignToRole(idRol, selectedCodes) {
    const payload = { permisos: normalizePermissionCodes(selectedCodes) };
    const { data } = await apiClient.patch(`${ENDPOINT}/roles/${idRol}`, payload);
    return data;
  }

  async syncCatalog() {
    const { data } = await apiClient.post(`${ENDPOINT}/sincronizar`);
    return data;
  }
}

export const permissionsRepository = new PermissionsApiRepository();
