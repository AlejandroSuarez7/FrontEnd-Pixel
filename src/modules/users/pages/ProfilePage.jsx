import { useEffect, useState } from 'react';
import { useAsyncLock } from '../../../core/hooks/useAsyncLock';
import { notifications } from '../../../core/utils/notifications';
import { useAuth } from '../../../store/AuthContext';
import { UserApiRepository } from '../infrastructure/user.repository';
import styles from '../presentation/users.module.css';

const userRepository = new UserApiRepository();

const getSessionUserId = (session) => session?.idUsuario || session?.id;

const ProfilePage = () => {
  const { user, updateSession } = useAuth();
  const [form, setForm] = useState({
    nombre: '',
    correo: '',
    telefono: '',
    contrasena: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const { isLocked: isSubmitting, runLocked } = useAsyncLock();

  useEffect(() => {
    setForm({
      nombre: user?.nombre || '',
      correo: user?.correo || '',
      telefono: user?.telefono || '',
      contrasena: '',
    });
  }, [user]);

  const handleChange = (field) => (event) => {
    setForm(prev => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    await runLocked(async () => {
      setMessage('');
      setError('');

      const idUsuario = getSessionUserId(user);
      if (!idUsuario) {
        const errorMessage = 'No se pudo identificar tu usuario.';
        setError(errorMessage);
        notifications.error(errorMessage);
        return;
      }

      const payload = {
        nombre: form.nombre.trim(),
        correo: form.correo.trim().toLowerCase(),
        telefono: form.telefono.trim() || null,
        idRol: user?.rol?.idRol || user?.idRol || 3,
        estado: user?.estado ?? true,
      };

      if (form.contrasena.trim()) {
        payload.contrasena = form.contrasena;
      }

      setLoading(true);
      try {
        const updatedUser = await userRepository.update(idUsuario, payload);
        updateSession({
          ...user,
          idUsuario,
          nombre: updatedUser.nombre,
          correo: updatedUser.correo,
          telefono: updatedUser.telefono,
          documento: updatedUser.documento,
          direccion: updatedUser.direccion,
          estado: updatedUser.estado,
        });
        setForm(prev => ({ ...prev, contrasena: '' }));
        setMessage('Perfil actualizado correctamente.');
        notifications.success('Perfil actualizado correctamente.');
      } catch (err) {
        const errorMessage = err.message || 'No se pudo actualizar el perfil.';
        setError(errorMessage);
        notifications.error(errorMessage);
      } finally {
        setLoading(false);
      }
    });
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.headerWrapper}>
        <div>
          <span className={styles.breadcrumb}>Cuenta / Perfil</span>
          <h1 className={styles.pageTitle}>Mi Perfil</h1>
          <p className={styles.pageSubtitle}>
            Consulta y actualiza tus datos de contacto.
          </p>
        </div>
      </div>

      <div className={styles.tableContainer}>
        <form onSubmit={handleSubmit} className={styles.form} style={{ padding: 28, maxWidth: 720 }}>
          {message && <p className={styles.roleBadge}>{message}</p>}
          {error && <p className={styles.statusBadge + ' ' + styles.statusInactive}>{error}</p>}

          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>Nombre completo *</label>
            <input
              type="text"
              value={form.nombre}
              onChange={handleChange('nombre')}
              className={styles.inputField}
              required
            />
          </div>

          <div className={styles.formRow}>
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Correo electronico *</label>
              <input
                type="email"
                value={form.correo}
                onChange={handleChange('correo')}
                className={styles.inputField}
                required
              />
            </div>
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Telefono</label>
              <input
                type="text"
                value={form.telefono}
                onChange={handleChange('telefono')}
                className={styles.inputField}
                placeholder="Ej: 3001234567"
              />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>Nueva contrasena (opcional)</label>
            <input
              type="password"
              value={form.contrasena}
              onChange={handleChange('contrasena')}
              className={styles.inputField}
              placeholder="Dejar vacio para no cambiar"
            />
          </div>

          <div className={styles.modalFooter}>
            <button type="submit" className={styles.btnPrimary} disabled={loading || isSubmitting}>
              {loading || isSubmitting ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;
