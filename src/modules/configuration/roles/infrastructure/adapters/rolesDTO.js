// infrastructure/dtos/rolesDTO.js
import { createRole } from "../../domain/rolesModel";

export const rolesDTO = {
  /**
   * Transforma un rol que viene del Backend/Prisma al modelo de Dominio.
   */
  fromApi(apiData) {
    if (!apiData) return null;

    return createRole({
      id: apiData.idRol, // Mapeamos idRol -> id para estandarizar el frontend
      nombre: apiData.nombre,
      descripcion: apiData.descripcion || '', // Fallback por si en BD es null
      estado: apiData.estado ?? true
    });
  },

  /**
   * Transforma una lista de roles.
   */
  fromApiList(apiDataList) {
    if (!Array.isArray(apiDataList)) return [];
    return apiDataList.map(item => this.fromApi(item));
  },

  /**
   * Prepara los datos del formulario antes de mandarlos a la API.
   */
  toApi(domainData) {
    if (!domainData) return null;

    return {
      nombre: domainData.nombre?.trim(),
      descripcion: domainData.descripcion?.trim(),
      estado: domainData.estado
    };
  }
};