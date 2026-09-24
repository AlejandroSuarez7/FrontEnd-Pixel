const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TEN_DIGITS_REGEX = /^\d{10}$/;

export const PASSWORD_RULES = [
  { id: 'length', label: 'Mínimo 8 caracteres', test: (value) => value.length >= 8 },
  { id: 'upper', label: 'Al menos una mayúscula', test: (value) => /[A-Z]/.test(value) },
  { id: 'lower', label: 'Al menos una minúscula', test: (value) => /[a-z]/.test(value) },
  { id: 'number', label: 'Al menos un número', test: (value) => /[0-9]/.test(value) },
  { id: 'special', label: 'Al menos un carácter especial', test: (value) => /[^A-Za-z0-9]/.test(value) },
];

export const onlyDigits = (value = '', maxLength = 10) =>
  String(value).replace(/\D/g, '').slice(0, maxLength);

export const getPasswordRulesStatus = (password = '') =>
  PASSWORD_RULES.map((rule) => ({
    ...rule,
    passed: rule.test(password),
  }));

export const getPasswordValidationError = (password = '') => {
  if (!password.trim()) return 'La contraseña no puede estar vacía.';
  if (!getPasswordRulesStatus(password).every((rule) => rule.passed)) {
    return 'La contraseña no cumple todos los requisitos.';
  }
  return null;
};

export const getAuthFormValidationError = ({ telefono, correo, contrasena, confirmarContrasena } = {}) => {
  if (telefono !== undefined && !TEN_DIGITS_REGEX.test(telefono)) {
    return 'El telefono debe tener exactamente 10 digitos.';
  }

  if (correo !== undefined && !EMAIL_REGEX.test(String(correo).trim())) {
    return 'El correo debe tener un formato valido.';
  }

  const passwordError = getPasswordValidationError(contrasena || '');
  if (passwordError) return passwordError;

  if (confirmarContrasena !== undefined && contrasena !== confirmarContrasena) {
    return 'Las contraseñas no coinciden.';
  }

  return null;
};

export const getUserValidationError = ({
  nombre,
  documento,
  correo,
  telefono,
  idRol,
  contrasena,
  isEditing = false,
} = {}) => {
  if (!String(nombre || '').trim()) return 'El nombre no puede estar vacio.';
  if (!EMAIL_REGEX.test(String(correo || '').trim())) return 'El correo debe tener un formato valido.';
  if (!idRol) return 'El rol es obligatorio.';

  if (!TEN_DIGITS_REGEX.test(String(documento || ''))) {
    return 'El documento debe tener exactamente 10 digitos.';
  }

  if (!TEN_DIGITS_REGEX.test(String(telefono || ''))) {
    return 'El telefono debe tener exactamente 10 digitos.';
  }

  if (!isEditing || String(contrasena || '').trim()) {
    return getPasswordValidationError(contrasena || '');
  }

  return null;
};
