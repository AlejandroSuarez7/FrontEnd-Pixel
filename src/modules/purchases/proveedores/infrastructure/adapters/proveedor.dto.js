import { createProveedor } from '../../domain/proveedor.model';

export const proveedorDTO = {
  fromApi(apiData) {
    if (!apiData) return null;
    return createProveedor({
      idProveedor: apiData.idProveedor,
      nombre: apiData.nombre,
      telefono: apiData.telefono,
      correo: apiData.correo,
      direccion: apiData.direccion,
      estado: apiData.estado,
    });
  },

  fromApiList(apiDataList) {
    if (!Array.isArray(apiDataList)) return [];
    return apiDataList.map(item => this.fromApi(item)).filter(Boolean);
  },

  toApi(domainData) {
    return {
      nombre: domainData.nombre?.trim(),
      telefono: domainData.telefono?.trim() || null,
      correo: domainData.correo?.trim() || null,
      direccion: domainData.direccion?.trim() || null,
      ...(domainData.estado !== undefined && { estado: Boolean(domainData.estado) }),
    };
  },

  toApiCreate(domainData) {
    return {
      nombre: domainData.nombre?.trim(),
      telefono: domainData.telefono?.trim() || null,
      correo: domainData.correo?.trim() || null,
      direccion: domainData.direccion?.trim() || null,
    };
  },
};
