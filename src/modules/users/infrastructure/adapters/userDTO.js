// frontend/src/infrastructure/users/adapters/userDTO.js
import { User } from '../../domain/userModel';

export const userDTO = {
  fromApi(apiUser) {
    if (!apiUser) return null;
    return new User({
      id: apiUser.idUsuario,
      idRol: apiUser.rol?.idRol || apiUser.idRol,
      nombreRol: apiUser.rol?.nombre || 'Sin Rol',
      nombre: apiUser.nombre,
      documento: apiUser.documento,
      telefono: apiUser.telefono,
      direccion: apiUser.direccion,
      correo: apiUser.correo,
      estado: apiUser.estado
    });
  },

  fromApiList(apiUsers) {
    if (!Array.isArray(apiUsers)) return [];
    return apiUsers.map(this.fromApi);
  }
};