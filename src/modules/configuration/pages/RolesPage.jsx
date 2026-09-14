// presentation/pages/RolesPage.jsx
import { useState } from 'react';
import { Pagination } from '../../../core/components/Pagination';
import { useDebounce } from '../../../core/hooks/useDebounce';
import { notifications } from '../../../core/utils/notifications';
import { DEFAULT_PAGE_SIZE } from '../../../core/utils/serverPagination';
import { useConfirm } from '../../../shared/components/ConfirmDialog/ConfirmProvider';
import { SafeDeleteModal } from '../../../shared/components/SafeDeleteModal/SafeDeleteModal';
import { SAFE_DELETE_IMPACT_ENDPOINTS } from '../../../shared/components/SafeDeleteModal/safeDeleteEndpoints';
import { TableActions } from '../../../shared/components/TableActions/TableActions';
import { useAuth } from '../../../store/AuthContext';
import { useRoles } from '../roles/application/useRoles';
import { RolePermissionsModal } from '../roles/presentation/RolePermissionsModal';
import { RoleFormModal } from '../roles/presentation/RoleFormModal';
import styles from '../roles/presentation/roles.module.css';

const RolesPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const debouncedSearch = useDebounce(searchTerm, 350);
  const {
    roles,
    paginationMeta,
    loading,
    error,
    handleCreate,
    handleUpdate,
    handleDelete,
    handleHardDelete,
    refreshRoles,
  } = useRoles({
    page: currentPage,
    limit: DEFAULT_PAGE_SIZE,
    search: debouncedSearch,
    sortBy: 'nombre',
    order: 'asc',
  });
  const { hasPermission } = useAuth();
  const confirm = useConfirm();

  const [isModalOpen, setIsModalOpen]   = useState(false);
  const [isPermissionsOpen, setIsPermissionsOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [deletionRole, setDeletionRole] = useState(null);

  const totalRoles    = paginationMeta.total;
  const activeRoles   = roles.filter(r => r.estado === true).length;
  const inactiveRoles = roles.filter(r => r.estado === false).length;

  const handleOpenCreate = () => {
    setSelectedRole(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (role) => {
    setSelectedRole(role);
    setIsModalOpen(true);
  };

  const handleOpenPermissions = (role) => {
    setSelectedRole(role);
    setIsPermissionsOpen(true);
  };

  const onHardDeleteClick = (role) => {
    setDeletionRole(role);
  };

  const onToggleStatusClick = async (role) => {
    const action = role.estado ? 'Desactivar' : 'Activar';
    const accepted = await confirm({
      title: `${action} rol`,
      message: `¿Confirmas ${action.toLowerCase()} el rol "${role.nombre}"?`,
      confirmText: action,
      variant: role.estado ? 'warning' : 'success',
    });
    if (!accepted) return;

    try {
      await handleDelete(role.id);
      notifications.success(`Rol ${role.estado ? 'desactivado' : 'activado'} correctamente.`);
    } catch (error) {
      notifications.error(error.message || 'No se pudo cambiar el estado del rol.');
    }
  };

  return (
    <div className={styles.pageContainer}>

      {/* HEADER */}
      <div className={styles.headerWrapper}>
        <div>
          <span className={styles.breadcrumb}>Configuración / Acceso</span>
          <h1 className={styles.pageTitle}>Gestión de Roles</h1>
          <p className={styles.pageSubtitle}>
            Administra los niveles de acceso y permisos del personal en el sistema.
          </p>
        </div>
        {hasPermission('roles.crear') && (
          <button onClick={handleOpenCreate} className={styles.primaryButton}>
            Nuevo rol
          </button>
        )}
      </div>

      {/* KPIs */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Total roles</span>
          <span className={styles.kpiValue}>{totalRoles}</span>
        </div>
        <div className={`${styles.kpiCard} ${styles.kpiCardSuccess}`}>
          <span className={styles.kpiLabel}>Activos</span>
          <span className={`${styles.kpiValue} ${styles.kpiValueSuccess}`}>{activeRoles}</span>
        </div>
        <div className={`${styles.kpiCard} ${styles.kpiCardDanger}`}>
          <span className={styles.kpiLabel}>Inactivos</span>
          <span className={`${styles.kpiValue} ${styles.kpiValueDanger}`}>{inactiveRoles}</span>
        </div>
      </div>

      {/* BUSCADOR */}
      <div className={styles.filterSection}>
        <input
          type="text"
          placeholder="Buscar rol por nombre..."
          value={searchTerm}
          onChange={e => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          className={styles.searchInput}
        />
      </div>

      {/* TABLA */}
      <div className={styles.tableContainer}>
        {loading ? (
          <p className={styles.loadingText}>Sincronizando roles del sistema...</p>
        ) : error && roles.length === 0 ? (
          <div className={styles.loadingText}>
            <p>No fue posible cargar los roles.</p>
            <button type="button" className={styles.primaryButton} onClick={refreshRoles}>
              Reintentar
            </button>
          </div>
        ) : roles.length === 0 ? (
          <p className={styles.loadingText}>No se encontraron roles registrados.</p>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr className={styles.tableHeadRow}>
                  <th className={styles.tableHeader}>ID</th>
                  <th className={styles.tableHeader}>Nombre del rol</th>
                  <th className={styles.tableHeader}>Descripción de permisos</th>
                  <th className={styles.tableHeader}>Estado</th>
                  <th className={styles.tableHeader}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {roles.map((role) => (
                  <tr key={role.id} className={styles.tableBodyRow}>
                    <td className={styles.tableCellId}>#{role.id}</td>
                    <td className={styles.tableCellName}>{role.nombre}</td>
                    <td className={styles.tableCell}>
                      {role.descripcion || (
                        <span className={styles.tableCellMuted}>Sin descripción</span>
                      )}
                    </td>
                    <td className={styles.tableCell}>
                      <span className={`${styles.statusBadge} ${role.estado ? styles.statusActive : styles.statusInactive}`}>
                        {role.estado ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className={styles.actionsCell}>
                      <TableActions
                        actions={[
                          hasPermission('permisos.ver') && { label: 'Permisos', onClick: () => handleOpenPermissions(role), variant: 'info' },
                          hasPermission('roles.editar') && { label: 'Editar', onClick: () => handleOpenEdit(role), variant: 'warning' },
                          hasPermission('roles.desactivar') && role.nombre !== 'Admin' && { label: role.estado ? 'Desactivar' : 'Activar', onClick: () => onToggleStatusClick(role), variant: role.estado ? 'warning' : 'success' },
                          hasPermission('roles.eliminar') && role.nombre !== 'Admin' && { label: 'Eliminar', onClick: () => onHardDeleteClick(role), variant: 'danger' },
                        ]}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination
          classNames={styles}
          currentPage={currentPage}
          hasNextPage={paginationMeta.hasNextPage}
          hasPrevPage={paginationMeta.hasPrevPage}
          onPageChange={setCurrentPage}
          pageSize={paginationMeta.limit}
          totalItems={paginationMeta.total}
          totalPages={paginationMeta.totalPages}
        />
      </div>

      {/* MODAL */}
      <RoleFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={selectedRole ? handleUpdate : handleCreate}
        role={selectedRole}
      />

      <RolePermissionsModal
        isOpen={isPermissionsOpen}
        onClose={() => setIsPermissionsOpen(false)}
        role={selectedRole}
        canAssignPermissions={hasPermission('permisos.asignar')}
        canSyncPermissions={hasPermission('permisos.asignar')}
      />

      <SafeDeleteModal
        key={deletionRole?.id || 'role-delete'}
        isOpen={Boolean(deletionRole)}
        entityLabel="rol"
        entityName={deletionRole?.nombre || ''}
        impactEndpoint={deletionRole ? SAFE_DELETE_IMPACT_ENDPOINTS.role(deletionRole.id) : ''}
        deleteAction={() => handleHardDelete(deletionRole.id)}
        successMessage="Rol eliminado correctamente."
        indirectWarning="Algunas relaciones asociadas a estos usuarios también pueden eliminarse o quedar desvinculadas."
        onClose={() => setDeletionRole(null)}
      />
    </div>
  );
};

export default RolesPage;
