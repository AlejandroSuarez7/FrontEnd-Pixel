export const createProveedor = ({
  idProveedor,
  nombre = '',
  telefono = '',
  correo = '',
  direccion = '',
  estado = true,
} = {}) => ({
  idProveedor,
  nombre,
  telefono,
  correo,
  direccion,
  estado,
});
