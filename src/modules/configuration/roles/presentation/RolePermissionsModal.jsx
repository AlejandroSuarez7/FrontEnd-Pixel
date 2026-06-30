import { useEffect, useMemo, useState } from 'react';
import { notifications } from '../../../../core/utils/notifications';
import { permissionsRepository } from '../infrastructure/permissions.repository';
import styles from './roles.module.css';

const HIDDEN_ROLE_PERMISSION_CODES = new Set([
  'pedidos.crear',
  'roles.desactivar',
  'usuarios.desactivar',
  'tecnicas.desactivar',
]);

const isVisibleRolePermission = (permissionOrCode) => {
  const code = typeof permissionOrCode === 'string'
    ? permissionOrCode
    : permissionOrCode?.codigo;

  return !HIDDEN_ROLE_PERMISSION_CODES.has(code);
};

const groupPermissionsByModule = (permissions) => permissions.reduce((groups, permission) => {
  const moduleName = permission.modulo || 'general';
  return {
    ...groups,
    [moduleName]: [...(groups[moduleName] || []), permission],
  };
}, {});

export const RolePermissionsModal = ({ isOpen, onClose, role, canAssignPermissions, canSyncPermissions }) => {
  const [permissions, setPermissions] = useState([]);
  const [selectedCodes, setSelectedCodes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');

  const groupedPermissions = useMemo(() => groupPermissionsByModule(permissions), [permissions]);

  useEffect(() => {
    if (!isOpen || !role?.id) return;

    let isMounted = true;

    const loadPermissions = async () => {
      setLoading(true);
      setError('');

      try {
        const [allPermissions, rolePermissions] = await Promise.all([
          permissionsRepository.list(),
          permissionsRepository.listByRole(role.id),
        ]);

        if (isMounted) {
          setPermissions(
            allPermissions.filter((permission) => (
              permission.estado !== false && isVisibleRolePermission(permission)
            ))
          );
          setSelectedCodes(rolePermissions.filter(isVisibleRolePermission));
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError.message || 'No se pudieron cargar los permisos.');
          notifications.error(loadError.message || 'No se pudieron cargar los permisos.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadPermissions();
    return () => {
      isMounted = false;
    };
  }, [isOpen, role]);

  if (!isOpen || !role) return null;

  const togglePermission = (code) => {
    setSelectedCodes((current) => (
      current.includes(code)
        ? current.filter((item) => item !== code)
        : [...current, code]
    ));
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');

    try {
      await permissionsRepository.assignToRole(role.id, selectedCodes);
      notifications.success('Permisos actualizados correctamente.');
    } catch (saveError) {
      notifications.error(saveError.message || 'No se pudieron guardar los permisos.');
    } finally {
      setSaving(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setError('');

    try {
      await permissionsRepository.syncCatalog();
      const allPermissions = await permissionsRepository.list();
      setPermissions(
        allPermissions.filter((permission) => (
          permission.estado !== false && isVisibleRolePermission(permission)
        ))
      );
      notifications.success('Catalogo de permisos sincronizado.');
    } catch (syncError) {
      notifications.error(syncError.message || 'No se pudo sincronizar el catalogo.');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={`${styles.modalContainer} ${styles.permissionsModal}`}>
        <div className={styles.modalHeader}>
          <div>
            <h3 className={styles.modalTitle}>Permisos de {role.nombre}</h3>
            <p className={styles.modalSubtitle}>
              Selecciona los accesos habilitados para este rol.
            </p>
          </div>
          <button type="button" onClick={onClose} className={styles.modalCloseBtn}>x</button>
        </div>

        {loading ? (
          <p className={styles.loadingText}>Cargando permisos...</p>
        ) : error ? (
          <p className={styles.errorText}>{error}</p>
        ) : (
          <div className={styles.permissionsContent}>
            <div className={styles.permissionsToolbar}>
              <span>{selectedCodes.length} seleccionados</span>
              {canSyncPermissions && (
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={handleSync}
                  disabled={syncing}
                >
                  {syncing ? 'Sincronizando...' : 'Sincronizar catalogo'}
                </button>
              )}
            </div>

            <div className={styles.permissionsGroups}>
              {Object.entries(groupedPermissions).map(([moduleName, modulePermissions]) => (
                <section className={styles.permissionGroup} key={moduleName}>
                  <h4>{moduleName}</h4>
                  <div className={styles.permissionGrid}>
                    {modulePermissions.map((permission) => (
                      <label className={styles.permissionItem} key={permission.codigo}>
                        <input
                          type="checkbox"
                          checked={selectedCodes.includes(permission.codigo)}
                          onChange={() => togglePermission(permission.codigo)}
                          disabled={!canAssignPermissions || saving}
                        />
                        <span>
                          <strong>{permission.codigo}</strong>
                          <small>{permission.descripcion}</small>
                        </span>
                      </label>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
        )}

        <div className={styles.modalFooter}>
          <button type="button" onClick={onClose} className={styles.btnSecondary}>
            Cerrar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className={styles.btnPrimary}
            disabled={!canAssignPermissions || loading || saving}
          >
            {saving ? 'Guardando...' : 'Guardar permisos'}
          </button>
        </div>
      </div>
    </div>
  );
};
