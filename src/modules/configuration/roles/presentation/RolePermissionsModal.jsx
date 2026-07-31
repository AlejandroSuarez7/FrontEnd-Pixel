import { useEffect, useMemo, useState } from 'react';
import { useAsyncLock } from '../../../../core/hooks/useAsyncLock';
import { notifications } from '../../../../core/utils/notifications';
import {
  buildPermissionSearchText,
  formatModuleName,
  formatPermissionLabel,
  getPermissionDescription,
  getPermissionModuleKey,
  sortPermissionsByAction,
} from '../../../../core/utils/permissionLabels';
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
  const moduleName = getPermissionModuleKey(permission);
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
  const [searchTerm, setSearchTerm] = useState('');
  const [collapsedModules, setCollapsedModules] = useState({});
  const { isLocked: isSavingLocked, runLocked: runSaveLocked } = useAsyncLock();
  const { isLocked: isSyncingLocked, runLocked: runSyncLocked } = useAsyncLock();

  const filteredPermissions = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const visiblePermissions = sortPermissionsByAction(permissions);

    if (!normalizedSearch) return visiblePermissions;

    return visiblePermissions.filter((permission) =>
      buildPermissionSearchText(permission).includes(normalizedSearch)
    );
  }, [permissions, searchTerm]);

  const groupedPermissions = useMemo(() => groupPermissionsByModule(filteredPermissions), [filteredPermissions]);

  const sortedModuleEntries = useMemo(() => (
    Object.entries(groupedPermissions).sort(([moduleA], [moduleB]) =>
      formatModuleName(moduleA).localeCompare(formatModuleName(moduleB), 'es')
    )
  ), [groupedPermissions]);

  const allVisibleCodes = useMemo(() => permissions.map((permission) => permission.codigo), [permissions]);
  const selectedVisibleCount = selectedCodes.filter((code) => allVisibleCodes.includes(code)).length;
  const selectionText = `${selectedVisibleCount} ${selectedVisibleCount === 1 ? 'permiso seleccionado' : 'permisos seleccionados'}`;

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

  const setModuleSelection = (modulePermissions, shouldSelect) => {
    const moduleCodes = modulePermissions.map((permission) => permission.codigo);

    setSelectedCodes((current) => {
      if (shouldSelect) {
        return [...new Set([...current, ...moduleCodes])];
      }

      return current.filter((code) => !moduleCodes.includes(code));
    });
  };

  const selectAllPermissions = () => {
    setSelectedCodes([...new Set([...selectedCodes, ...allVisibleCodes])]);
  };

  const clearSelection = () => {
    setSelectedCodes([]);
  };

  const toggleModuleCollapse = (moduleName) => {
    setCollapsedModules((current) => ({
      ...current,
      [moduleName]: !current[moduleName],
    }));
  };

  const handleSave = async () => {
    await runSaveLocked(async () => {
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
    });
  };

  const handleSync = async () => {
    await runSyncLocked(async () => {
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
    });
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
              <div className={styles.permissionsSummary}>
                <strong>{selectionText}</strong>
                <small>Se guardan como códigos internos, pero aquí los ves en lenguaje claro.</small>
              </div>
              {canSyncPermissions && (
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={handleSync}
                  disabled={syncing || isSyncingLocked}
                  title="Actualiza la lista de permisos disponibles desde el backend."
                >
                  {syncing || isSyncingLocked ? 'Sincronizando...' : 'Sincronizar permisos'}
                </button>
              )}
            </div>

            <div className={styles.permissionsControls}>
              <input
                type="search"
                className={styles.permissionSearch}
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Buscar por permiso, módulo o código..."
              />
              <div className={styles.permissionsBulkActions}>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={selectAllPermissions}
                  disabled={!canAssignPermissions || saving || isSavingLocked || allVisibleCodes.length === 0}
                >
                  Seleccionar todos
                </button>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={clearSelection}
                  disabled={!canAssignPermissions || saving || isSavingLocked || selectedCodes.length === 0}
                >
                  Limpiar selección
                </button>
              </div>
            </div>

            <div className={styles.permissionsGroups}>
              {sortedModuleEntries.length === 0 && (
                <div className={styles.permissionEmptyState}>
                  No encontramos permisos que coincidan con tu búsqueda.
                </div>
              )}

              {sortedModuleEntries.map(([moduleName, modulePermissions]) => {
                const selectedInModule = modulePermissions.filter((permission) => selectedCodes.includes(permission.codigo)).length;
                const isCollapsed = collapsedModules[moduleName];

                return (
                <section className={styles.permissionGroup} key={moduleName}>
                  <div className={styles.permissionGroupHeader}>
                    <button
                      type="button"
                      className={styles.permissionModuleToggle}
                      onClick={() => toggleModuleCollapse(moduleName)}
                    >
                      <span>{isCollapsed ? '+' : '-'}</span>
                      <strong>{formatModuleName(moduleName)}</strong>
                      <small>{selectedInModule}/{modulePermissions.length} seleccionados</small>
                    </button>
                    <div className={styles.permissionModuleActions}>
                      <button
                        type="button"
                        onClick={() => setModuleSelection(modulePermissions, true)}
                        disabled={!canAssignPermissions || saving || isSavingLocked || selectedInModule === modulePermissions.length}
                      >
                        Seleccionar todo
                      </button>
                      <button
                        type="button"
                        onClick={() => setModuleSelection(modulePermissions, false)}
                        disabled={!canAssignPermissions || saving || isSavingLocked || selectedInModule === 0}
                      >
                        Quitar todo
                      </button>
                    </div>
                  </div>
                  {!isCollapsed && <div className={styles.permissionGrid}>
                    {modulePermissions.map((permission) => (
                      <label className={styles.permissionItem} key={permission.codigo}>
                        <input
                          type="checkbox"
                          checked={selectedCodes.includes(permission.codigo)}
                          onChange={() => togglePermission(permission.codigo)}
                          disabled={!canAssignPermissions || saving || isSavingLocked}
                        />
                        <span>
                          <strong>{formatPermissionLabel(permission.codigo, permission)}</strong>
                          <small>{getPermissionDescription(permission)}</small>
                          <code>{permission.codigo}</code>
                        </span>
                      </label>
                    ))}
                  </div>}
                </section>
              )})}
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
            disabled={!canAssignPermissions || loading || saving || isSavingLocked}
          >
            {saving || isSavingLocked ? 'Guardando...' : 'Guardar permisos'}
          </button>
        </div>
      </div>
    </div>
  );
};
