import { useEffect, useState } from 'react';
import { Pagination } from '../../../core/components/Pagination';
import { useDebounce } from '../../../core/hooks/useDebounce';
import { notifications } from '../../../core/utils/notifications';
import { DEFAULT_PAGE_SIZE } from '../../../core/utils/serverPagination';
import { useConfirm } from '../../../shared/components/ConfirmDialog/ConfirmProvider';
import { TableActions } from '../../../shared/components/TableActions/TableActions';
import { useAuth } from '../../../store/AuthContext';
import { rolesRepository } from '../../configuration/roles/infrastructure/roles.repository';
import { useUsers } from '../application/useUsers';
import { UserFormModal } from '../presentation/UserFormModal';
import styles from '../presentation/users.module.css';

export const UsersPage = () => {
  const [filters, setFilters] = useState({ search: '', idRol: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [availableRoles, setAvailableRoles] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const { hasPermission } = useAuth();
  const confirm = useConfirm();
  const debouncedSearch = useDebounce(filters.search, 350);

  const {
    users,
    loading,
    error,
    handleCreate,
    handleUpdate,
    handleHardDelete,
    findDuplicateFields,
    paginationMeta,
    refreshUsers,
  } = useUsers({
    ...filters,
    search: debouncedSearch,
    page: currentPage,
    limit: DEFAULT_PAGE_SIZE,
    sortBy: 'nombre',
    order: 'asc',
  });

  const totalUsers = paginationMeta.total;
  const activeUsers = users.filter(user => user.estado === true).length;
  const inactiveUsers = users.filter(user => user.estado === false).length;

  useEffect(() => {
    const controller = new AbortController();

    const loadRoles = async () => {
      setLoadingRoles(true);
      try {
        const collectedRoles = [];
        let page = 1;

        while (!controller.signal.aborted) {
          const response = await rolesRepository.list({
            page,
            limit: DEFAULT_PAGE_SIZE,
            sortBy: 'nombre',
            order: 'asc',
          }, { signal: controller.signal });
          collectedRoles.push(...response.items);
          const totalPages = response.meta.totalPages || 1;
          if (page >= totalPages) break;
          page += 1;
        }

        if (controller.signal.aborted) return;
        setAvailableRoles(
          collectedRoles.filter(
            role => role.nombre?.trim().toLocaleLowerCase('es') !== 'cliente',
          ),
        );
      } catch (error) {
        if (error?.code !== 'ERR_CANCELED') {
          setAvailableRoles([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoadingRoles(false);
        }
      }
    };

    loadRoles();
    return () => {
      controller.abort();
    };
  }, []);

  const handleOpenCreate = () => {
    setSelectedUser(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleSubmitForm = async (payload) => {
    const duplicatedFields = await findDuplicateFields(payload, selectedUser?.id);
    if (duplicatedFields.length > 0) {
      const fieldNames = {
        correo: 'correo',
        documento: 'documento',
        telefono: 'telefono',
      };
      const message = `Ya existe otro usuario con el mismo ${duplicatedFields.map(field => fieldNames[field]).join(', ')}.`;
      notifications.error(message);
      const duplicateError = new Error(message);
      duplicateError.silent = true;
      throw duplicateError;
    }

    if (selectedUser) {
      await handleUpdate(selectedUser.id, payload);
      notifications.success('Usuario actualizado correctamente.');
    } else {
      await handleCreate(payload);
      notifications.success('Usuario creado correctamente.');
    }
    setIsModalOpen(false);
  };

  const onEliminarClick = async (id, nombre) => {
    const accepted = await confirm({
      title: 'Eliminar usuario',
      message: `Eliminar permanentemente al usuario "${nombre}"? Esta accion no se puede deshacer.`,
      confirmText: 'Eliminar',
      variant: 'danger',
    });

    if (!accepted) return;

    try {
      await handleHardDelete(id);
      notifications.success('Usuario eliminado correctamente.');
    } catch (err) {
      notifications.error(err.message || 'No se pudo eliminar el usuario.');
    }
  };

  const isAdmin = (user) => user.nombreRol === 'Admin' || user.nombreRol === 'Administrador';

  return (
    <div className={styles.pageContainer}>
      <div className={styles.headerWrapper}>
        <div>
          <span className={styles.breadcrumb}>Configuracion / Acceso</span>
          <h1 className={styles.pageTitle}>Gestion de Usuarios</h1>
          <p className={styles.pageSubtitle}>
            Administra cuentas, roles y estados del personal y clientes del sistema.
          </p>
        </div>
        {hasPermission('usuarios.crear') && (
          <button onClick={handleOpenCreate} className={styles.primaryButton}>
            Nuevo usuario
          </button>
        )}
      </div>

      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Total usuarios</span>
          <span className={styles.kpiValue}>{totalUsers}</span>
        </div>
        <div className={`${styles.kpiCard} ${styles.kpiCardSuccess}`}>
          <span className={styles.kpiLabel}>Activos</span>
          <span className={`${styles.kpiValue} ${styles.kpiValueSuccess}`}>{activeUsers}</span>
        </div>
        <div className={`${styles.kpiCard} ${styles.kpiCardDanger}`}>
          <span className={styles.kpiLabel}>Inactivos</span>
          <span className={`${styles.kpiValue} ${styles.kpiValueDanger}`}>{inactiveUsers}</span>
        </div>
      </div>

      <div className={styles.filterSection}>
        <label className={`${styles.filterField} ${styles.filterSearch}`}>
          <span>Buscar usuarios</span>
          <input
            type="text"
            placeholder="Nombre, correo o documento..."
            value={filters.search}
            onChange={event => {
              setFilters(prev => ({ ...prev, search: event.target.value }));
              setCurrentPage(1);
            }}
            className={styles.searchInput}
          />
        </label>
        <label className={styles.filterField}>
          <span>Rol del sistema</span>
          <select
            value={filters.idRol}
            onChange={event => {
              setFilters(prev => ({ ...prev, idRol: event.target.value ? Number(event.target.value) : '' }));
              setCurrentPage(1);
            }}
            className={styles.selectFilter}
            disabled={loadingRoles}
          >
            <option value="">{loadingRoles ? 'Cargando roles...' : 'Todos los roles'}</option>
            {availableRoles.map(role => (
              <option value={role.id} key={role.id}>{role.nombre}</option>
            ))}
          </select>
        </label>
      </div>

      <div className={styles.tableContainer}>
        {loading ? (
          <p className={styles.loadingText}>Cargando usuarios del sistema...</p>
        ) : error && users.length === 0 ? (
          <div className={styles.loadingText}>
            <p>No fue posible cargar los usuarios.</p>
            <button type="button" className={styles.primaryButton} onClick={refreshUsers}>
              Reintentar
            </button>
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr className={styles.tableHeadRow}>
                  <th className={styles.tableHeader}>Nombre</th>
                  <th className={styles.tableHeader}>Correo</th>
                  <th className={styles.tableHeader}>Documento</th>
                  <th className={styles.tableHeader}>Rol</th>
                  <th className={styles.tableHeader}>Estado</th>
                  <th className={styles.tableHeader}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan="6" className={styles.loadingText}>
                      No se encontraron usuarios registrados.
                    </td>
                  </tr>
                ) : (
                  users.map(user => (
                    <tr key={user.id} className={styles.tableBodyRow}>
                      <td className={styles.tableCellName}>{user.nombre}</td>
                      <td className={styles.tableCellSecondary}>{user.correo}</td>
                      <td className={styles.tableCell}>{user.documento || '-'}</td>
                      <td className={styles.tableCell}>
                        <span className={styles.roleBadge}>{user.nombreRol}</span>
                      </td>
                      <td className={styles.tableCell}>
                        <span className={`${styles.statusBadge} ${user.estado ? styles.statusActive : styles.statusInactive}`}>
                          {user.estado ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className={styles.actionsCell}>
                        <TableActions
                          actions={[
                            hasPermission('usuarios.editar') && { label: 'Editar', onClick: () => handleOpenEdit(user), variant: 'warning' },
                            hasPermission('usuarios.eliminar') && !isAdmin(user) && { label: 'Eliminar', onClick: () => onEliminarClick(user.id, user.nombre), variant: 'danger' },
                          ]}
                        />
                      </td>
                    </tr>
                  ))
                )}
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

      {isModalOpen && (
        <UserFormModal
          isOpen
          onClose={() => { setIsModalOpen(false); setSelectedUser(null); }}
          onSubmit={handleSubmitForm}
          user={selectedUser}
          roles={availableRoles}
          loadingRoles={loadingRoles}
        />
      )}
    </div>
  );
};
