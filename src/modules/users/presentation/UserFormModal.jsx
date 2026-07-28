// presentation/UserFormModal.jsx
import { useState } from 'react';
import { useAsyncLock } from '../../../core/hooks/useAsyncLock';
import { notifications } from '../../../core/utils/notifications';
import {
  getPasswordRulesStatus,
  getUserValidationError,
  onlyDigits,
} from '../../../core/utils/userValidation';
import styles from './users.module.css';

export const UserFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  user,
  roles = [],
  loadingRoles = false,
}) => {
  const [nombre, setNombre]         = useState(user?.nombre || '');
  const [documento, setDocumento]   = useState(user?.documento || '');
  const [correo, setCorreo]         = useState(user?.correo || '');
  const [telefono, setTelefono]     = useState(user?.telefono || '');
  const [direccion, setDireccion]   = useState(user?.direccion || '');
  const [idRol, setIdRol]           = useState(user?.idRol || '');
  const [contrasena, setContrasena] = useState('');
  const [estado, setEstado]         = useState(user?.estado ?? true);

  const { isLocked: isSubmitting, runLocked } = useAsyncLock();

  const isEditing = !!user;
  const passwordRulesStatus = getPasswordRulesStatus(contrasena);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    await runLocked(async () => {
    try {
      const validationError = getUserValidationError({
        nombre,
        documento,
        correo,
        telefono,
        idRol,
        contrasena,
        isEditing,
      });

      if (validationError) {
        notifications.warning(validationError);
        return;
      }

      const payload = {
        nombre:    nombre.trim(),
        documento: documento.trim() || null,
        correo:    correo.trim().toLowerCase(),
        telefono:  telefono.trim() || null,
        direccion: direccion.trim() || null,
        idRol:     Number(idRol),
        estado:    Boolean(estado),
      };

      // Solo incluir contraseña si se escribió algo
      if (contrasena.trim()) {
        payload.contrasena = contrasena;
      }

      // onSubmit es la función unificada de la página (handleSubmitForm)
      // que ya maneja internamente si es create o update
      await onSubmit(payload);
    } catch (error) {
      if (!error.silent) {
        notifications.error(error.message || 'Error al procesar el usuario.');
      }
    }
    });
  };

  return (
    <div className={styles.overlay}>
      <div className={`${styles.modalContainer} ${styles.modalMd}`}>

        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>
            {isEditing ? `Editar usuario · ${user.nombre}` : 'Registrar nuevo usuario'}
          </h3>
          <button type="button" onClick={onClose} className={styles.modalCloseBtn} disabled={isSubmitting}>X</button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>

          {/* Nombre */}
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>Nombre completo *</label>
            <input
              type="text"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              className={styles.inputField}
              placeholder="Ej: Juan Carlos Pérez"
              required
            />
          </div>

          {/* Correo + Documento */}
          <div className={styles.formRow}>
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Correo electrónico *</label>
              <input
                type="email"
                value={correo}
                onChange={e => setCorreo(e.target.value)}
                className={styles.inputField}
                placeholder="correo@ejemplo.com"
                required
              />
            </div>
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Documento (ID)</label>
              <input
                type="text"
                value={documento}
                onChange={e => setDocumento(onlyDigits(e.target.value))}
                className={styles.inputField}
                placeholder="Ej: 1234567890"
                maxLength={10}
              />
            </div>
          </div>

          {/* Teléfono + Rol */}
          <div className={styles.formRow}>
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Teléfono</label>
              <input
                type="text"
                value={telefono}
                onChange={e => setTelefono(onlyDigits(e.target.value))}
                className={styles.inputField}
                placeholder="Ej: 3001234567"
                maxLength={10}
              />
            </div>
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Rol del sistema *</label>
              <select
                value={idRol}
                onChange={e => setIdRol(e.target.value)}
                className={styles.selectField}
                required
                disabled={loadingRoles}
              >
                <option value="">
                  {loadingRoles ? 'Cargando roles...' : '— Selecciona un rol —'}
                </option>
                {roles.map(rol => (
                  <option key={rol.idRol ?? rol.id} value={rol.idRol ?? rol.id}>
                    {rol.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Dirección */}
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>Dirección de residencia</label>
            <input
              type="text"
              value={direccion}
              onChange={e => setDireccion(e.target.value)}
              className={styles.inputField}
              placeholder="Ej: Calle 123 # 45-67"
            />
          </div>

          {/* Contraseña + Estado (estado solo en edición) */}
          <div className={styles.formRow}>
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>
                {isEditing ? 'Nueva contraseña (opcional)' : 'Contraseña *'}
              </label>
              <input
                type="password"
                value={contrasena}
                onChange={e => setContrasena(e.target.value)}
                className={styles.inputField}
                required={!isEditing}
                placeholder={isEditing ? 'Dejar vacío para no cambiar' : 'Mínimo 6 caracteres'}
              />
            </div>
            {isEditing && (
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>Estado de cuenta</label>
                <select
                  value={String(estado)}
                  onChange={e => setEstado(e.target.value === 'true')}
                  className={styles.selectField}
                >
                  <option value="true">Activo</option>
                  <option value="false">Inactivo</option>
                </select>
              </div>
            )}
          </div>

          {contrasena.length > 0 && (
            <div className={styles.passwordRules}>
              {passwordRulesStatus.map((rule) => (
                <span
                  key={rule.id}
                  className={`${styles.passwordRule} ${rule.passed ? styles.passwordRuleOk : styles.passwordRuleError}`}
                >
                  {rule.passed ? 'OK' : 'X'} {rule.label}
                </span>
              ))}
            </div>
          )}

          <div className={styles.modalFooter}>
            <button type="button" onClick={onClose} className={styles.btnSecondary} disabled={isSubmitting}>
              Cancelar
            </button>
            <button type="submit" className={styles.btnPrimary} disabled={isSubmitting}>
              {isSubmitting ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Crear usuario'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
