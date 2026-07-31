// infrastructure/dtos/tecnicasDTO.js
import { createTecnicas } from "../../domain/tecnicasModel";

export const tecnicasDTO = {
  /**
   * Transforma una sola técnica (o servicio) que viene del backend/Prisma
   * al modelo que entiende nuestro dominio en el Frontend.
   */
  fromApi(apiData) {
    if (!apiData) return null;

    return createTecnicas({
      id: apiData.idTecnica, // Mapeamos idTecnica -> id
      nombre: apiData.nombre,
      descripcion: apiData.descripcion || '', // Fallback por si es null en la BD
      estado: apiData.estado ?? true, // Manejo del booleano por defecto
      requiereMedidas: apiData.requiereMedidas ?? true,
      fechaCreacion: apiData.fechaCreacion,
      fechaActualizacion: apiData.fechaActualizacion,
      detalles: apiData.detallesCotizacion || [] // Mapeamos detallesCotizacion -> detalles
    });
  },

  /**
   * Transforma una lista completa de técnicas que viene de la API.
   */
  fromApiList(apiDataList) {
    if (!Array.isArray(apiDataList)) return [];
    return apiDataList.map(item => this.fromApi(item));
  },

  /**
   * Si en el futuro necesitas enviar datos para crear o actualizar un servicio,
   * este método prepara el objeto según lo que espera recibir tu backend.
   */
  toApi(domainData) {
    if (!domainData) return null;

    return {
      nombre: domainData.nombre?.trim(),
      descripcion: domainData.descripcion?.trim(),
      estado: domainData.estado,
      requiereMedidas: domainData.requiereMedidas ?? true,
    };
  }
};
