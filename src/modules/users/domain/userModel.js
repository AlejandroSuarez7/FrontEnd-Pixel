// frontend/src/core/models/user.model.js
export class User {
  constructor({ id, idRol, nombreRol, nombre, documento, telefono, direccion, correo, estado }) {
    this.id = id;
    this.idRol = idRol;
    this.nombreRol = nombreRol;
    this.nombre = nombre;
    this.documento = documento || 'Sin documento';
    this.telefono = telefono || 'Sin teléfono';
    this.direccion = direccion || 'Sin dirección';
    this.correo = correo;
    this.estado = estado; 
  }
}