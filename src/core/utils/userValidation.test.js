import { describe, expect, it } from 'vitest';
import { getAuthFormValidationError, getUserValidationError } from './userValidation';

const validPassword = 'Seguro123!';

describe('user validation', () => {
  it('accepts valid email addresses in authentication and user forms', () => {
    expect(getAuthFormValidationError({
      correo: 'persona+ventas@pixel.com.co',
      contrasena: validPassword,
    })).toBeNull();
    expect(getUserValidationError({
      nombre: 'Persona Pixel',
      documento: '1234567890',
      correo: 'persona@pixel.com',
      telefono: '3001234567',
      idRol: 2,
      contrasena: validPassword,
    })).toBeNull();
  });

  it.each([
    'sin-arroba.example.com',
    '@example.com',
    'persona@',
    'persona@example',
    'persona@@example.com',
    'persona @example.com',
  ])('rejects an invalid email: %s', (correo) => {
    expect(getAuthFormValidationError({ correo, contrasena: validPassword }))
      .toBe('El correo debe tener un formato valido.');
  });

  it('keeps accepting surrounding whitespace after normalization', () => {
    expect(getAuthFormValidationError({
      correo: ' persona@example.com ',
      contrasena: validPassword,
    })).toBeNull();
  });

  it('handles long repetitive input in linear time without accepting it', () => {
    const correo = `${'a'.repeat(100_000)}@${'b'.repeat(100_000)}`;
    expect(getAuthFormValidationError({ correo, contrasena: validPassword }))
      .toBe('El correo debe tener un formato valido.');
  });
});
