import { apiClient } from '../../../../core/services/apiService.js';
import { createRequestError } from '../../../../core/utils/requestError.js';
import { disenoDTO } from './adapters/diseno.dto.js';
import { normalizeDesignRequirementsResponse } from '../domain/designRequirement.js';
import { appendDefinedFormFields } from '../../../../core/utils/designFile.js';

const ENDPOINT = 'api/disenos';

const withUploadMessage = (error, fallback) => {
  const status = error?.response?.status;
  let message = error?.response?.data?.message;

  if (status === 403) {
    message = 'No tienes permiso para cargar este diseno.';
  } else if (status === 502) {
    message = 'No pudimos almacenar el archivo. Intenta nuevamente.';
  } else if (status !== 400 || !message) {
    message = fallback;
  }

  return createRequestError({
    ...error,
    response: error?.response
      ? { ...error.response, data: { ...error.response.data, message } }
      : undefined,
    message,
  }, fallback);
};

const buildDesignFormData = (payload, file) => {
  const formData = new FormData();
  formData.append('archivo', file);
  appendDefinedFormFields(formData, payload);
  return formData;
};

export class DisenoApiRepository {
  async list(filters = {}, options = {}) {
    if (filters.idPedido) {
      const items = await this.listByPedido(filters.idPedido, options);
      return items.filter(item => !filters.estado || item.estado === filters.estado);
    }

    const params = {};
    if (filters.estado) params.estado = filters.estado;
    if (filters.idDisenador) params.idDisenador = Number(filters.idDisenador);

    const { data } = await apiClient.get(ENDPOINT, { params, signal: options.signal });
    return disenoDTO.fromApiList(data.data || []);
  }

  async listByPedido(idPedido, options = {}) {
    try {
      const { data } = await apiClient.get(`api/pedidos/${idPedido}/disenos`, { signal: options.signal });
      return disenoDTO.fromApiList(data.data || []);
    } catch (error) {
      throw createRequestError(error, 'No se pudieron consultar los disenos del pedido');
    }
  }

  async getRequerimientosDiseno(idPedido, options = {}) {
    try {
      const response = await apiClient.get(
        `api/pedidos/${idPedido}/requerimientos-diseno`,
        { signal: options.signal },
      );
      return normalizeDesignRequirementsResponse(response);
    } catch (error) {
      throw createRequestError(error, 'No pudimos cargar los disenos pendientes');
    }
  }

  async definirOrigenRequerimiento(idPedido, idRequerimientoDiseno, origenDiseno) {
    try {
      const requirementId = encodeURIComponent(String(idRequerimientoDiseno));
      const { data } = await apiClient.patch(
        `api/pedidos/${idPedido}/requerimientos-diseno/${requirementId}/origen`,
        { origenDiseno },
      );
      return data;
    } catch (error) {
      const status = error?.response?.status;
      let message = error?.response?.data?.message;

      if (status === 403) {
        message = 'No tienes permiso para definir el origen del diseno.';
      } else if (status === 409) {
        message = 'El origen de este diseno ya fue definido.';
      } else if (!error?.response) {
        message = 'No pudimos guardar el cambio. Intenta nuevamente.';
      }

      throw createRequestError({
        ...error,
        response: error?.response
          ? {
            ...error.response,
            data: { ...error.response.data, message },
          }
          : undefined,
        message,
      }, 'No pudimos guardar el cambio. Intenta nuevamente.');
    }
  }

  async listPendingProduction() {
    try {
      const { data } = await apiClient.get(`${ENDPOINT}/produccion/pendientes`);
      return disenoDTO.fromApiList(data.data || []);
    } catch (error) {
      throw createRequestError(error, 'No se pudo consultar la produccion pendiente');
    }
  }

  async listPedidos(filters = {}) {
    try {
      const params = {};
      if (filters.search) params.termino = filters.search;
      const url = filters.search ? 'api/pedidos/buscar' : 'api/pedidos';
      const { data } = await apiClient.get(url, { params });
      return data.data || [];
    } catch (error) {
      throw createRequestError(error, 'No se pudieron consultar los pedidos');
    }
  }

  async create(disenoData) {
    return this.createDesignWithFile(disenoData);
  }

  async createDesignWithFile(disenoData) {
    try {
      const payload = disenoDTO.toApi(disenoData);
      const formData = buildDesignFormData(payload, disenoData.archivo);
      const { data } = await apiClient.post(ENDPOINT, formData);
      return disenoDTO.fromApi(data.data);
    } catch (error) {
      const errorCode = error?.response?.data?.code;
      if (errorCode === 'ACTIVE_DESIGN_ALREADY_EXISTS') {
        throw createRequestError({
          response: {
            ...error.response,
            data: {
              ...error.response.data,
              message: 'Ya existe un diseno activo para este objetivo.',
            },
          },
        });
      }
      if (errorCode === 'DESIGN_TARGET_ALREADY_COVERED') {
        throw createRequestError({
          response: {
            ...error.response,
            data: {
              ...error.response.data,
              message: 'Este diseno ya esta cubierto por un diseno general.',
            },
          },
        });
      }
      throw withUploadMessage(error, 'No se pudo crear el diseno');
    }
  }

  async update(idDiseno, disenoData) {
    if (disenoData.archivo) {
      return this.attachDesignFile(idDiseno, disenoData.archivo, disenoData);
    }

    try {
      const payload = disenoDTO.toApiUpdate(disenoData);
      const { data } = await apiClient.patch(`${ENDPOINT}/${idDiseno}`, payload);
      return disenoDTO.fromApi(data.data);
    } catch (error) {
      throw createRequestError(error, 'No se pudo actualizar el diseno');
    }
  }

  async attachDesignFile(idDiseno, file, data = {}) {
    try {
      const formData = buildDesignFormData(disenoDTO.toApiUpdate(data), file);
      const { data: response } = await apiClient.patch(`${ENDPOINT}/${idDiseno}`, formData);
      return disenoDTO.fromApi(response.data);
    } catch (error) {
      throw withUploadMessage(error, 'No se pudo adjuntar el archivo del diseno');
    }
  }

  async uploadClientDesign(idPedido, idRequerimientoDiseno, file, payload = {}) {
    try {
      const requirementId = encodeURIComponent(String(idRequerimientoDiseno));
      const formData = buildDesignFormData({
        observacionesCliente: payload.observacionesCliente?.trim() || null,
      }, file);
      const { data } = await apiClient.patch(
        `api/cliente/pedidos/${idPedido}/requerimientos-diseno/${requirementId}/diseno`,
        formData,
      );
      return data.data ?? data;
    } catch (error) {
      throw withUploadMessage(error, 'No se pudo cargar el diseno');
    }
  }

  async approve(idDiseno, payload = {}) {
    try {
      const { data } = await apiClient.patch(`${ENDPOINT}/${idDiseno}/aprobar`, {
        observaciones: payload.observaciones?.trim() || undefined,
      });
      return data;
    } catch (error) {
      throw createRequestError(error, 'No se pudo aprobar el diseno');
    }
  }

  async approveByClientAdmin(idDiseno, payload = {}) {
    try {
      const { data } = await apiClient.patch(`${ENDPOINT}/${idDiseno}/aprobar-cliente`, {
        medioAprobacion: payload.medioAprobacion,
        observaciones: payload.observaciones?.trim() || undefined,
      });
      return data;
    } catch (error) {
      throw createRequestError(error, 'No se pudo registrar la aprobacion del cliente');
    }
  }

  async rejectByClientAdmin(idDiseno, payload = {}) {
    try {
      const { data } = await apiClient.patch(`${ENDPOINT}/${idDiseno}/rechazar-cliente`, {
        medioRespuesta: payload.medioRespuesta,
        observacionesCliente: payload.observacionesCliente?.trim(),
      });
      return data;
    } catch (error) {
      throw createRequestError(error, 'No se pudo registrar el rechazo del cliente');
    }
  }

  async listClientDesigns(options = {}) {
    try {
      const { data } = await apiClient.get('api/cliente/disenos', {
        signal: options.signal,
      });
      return disenoDTO.fromApiList(data.data || []);
    } catch (error) {
      throw createRequestError(error, 'No se pudieron consultar tus disenos');
    }
  }

  async getClientDesign(idDiseno, options = {}) {
    try {
      const { data } = await apiClient.get(`api/cliente/disenos/${idDiseno}`, {
        signal: options.signal,
      });
      return disenoDTO.fromApi(data.data);
    } catch (error) {
      throw createRequestError(error, 'No se pudo consultar el diseno');
    }
  }

  async approveClientDesign(idDiseno) {
    try {
      const { data } = await apiClient.patch(`api/cliente/disenos/${idDiseno}/aprobar`);
      return data;
    } catch (error) {
      throw createRequestError(error, 'No se pudo aprobar el diseno');
    }
  }

  async rejectClientDesign(idDiseno, payload = {}) {
    try {
      const { data } = await apiClient.patch(`api/cliente/disenos/${idDiseno}/rechazar`, {
        observacionesCliente: payload.observacionesCliente?.trim(),
      });
      return data;
    } catch (error) {
      throw createRequestError(error, 'No se pudo rechazar el diseno');
    }
  }

  async remove(idDiseno) {
    try {
      const { data } = await apiClient.delete(`${ENDPOINT}/${idDiseno}`);
      return data;
    } catch (error) {
      throw createRequestError(error, 'No se pudo eliminar el diseno');
    }
  }
}

export const disenoRepository = new DisenoApiRepository();
