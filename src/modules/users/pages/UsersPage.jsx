// presentation/pages/UsersPage.jsx
import React, { useState } from 'react';
import { useUsers } from '../application/useUsers';
import { UserFormModal } from '../presentation/UserFormModal';
import styles from '../presentation/users.module.css';

export const UsersPage = () => {
  const [filters, setFilters] = useState({ search: '', idRol: '' });

  const {
    users,
    loading,
    handleCreate,
    handleUpdate,
    handleToggleStatus,
    handleHardDelete,
  } = useUsers(filters);

  const [isModalOpen, setIsModalOpen]   = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const totalUsers    = users.length;
  const activeUsers   = users.filter(u => u.estado === true).length;
  const inactiveUsers = users.filter(u => u.estado === false).length;

  const handleOpenCreate = () => {
    setSelectedUser(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  // onSubmit unificado: el modal no necesita saber el ID por separado
  const handleSubmitForm = async (payload) => {
    if (selectedUser) {
      await handleUpdate(selectedUser.id, payload);
    } else {
      await handleCreate(payload);
    }
    setIsModalOpen(false);
  };

  const onEliminarClick = (id, nombre) => {
    if (window.confirm(
      `¿Estás seguro de que deseas ELIMINAR permanentemente al usuario "${nombre}"?\n\nEsta acción no se puede deshacer.`
    )) {
      handleHardDelete(id).catch(err => alert(err.message));
    }
  };

  const isAdmin = (user) => user.nombreRol === 'Admin' || user.nombreRol === 'Administrador';

  return (
    <div className={styles.pageContainer}>

      {/* HEADER */}
      <div className={styles.headerWrapper}>
        <div>
          <span className={styles.breadcrumb}>Configuración / Acceso</span>
          <h1 className={styles.pageTitle}>Gestión de Usuarios</h1>
          <p className={styles.pageSubtitle}>
            Administra cuentas, roles y estados del personal y clientes del sistema.
          </p>
        </div>
        <button onClick={handleOpenCreate} className={styles.primaryButton}>
          Nuevo usuario
        </button>
      </div>

      {/* KPIs */}
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

      {/* FILTROS */}
      <div className={styles.filterSection}>
        <input
          type="text"
          placeholder="Buscar por nombre, correo o documento..."
          value={filters.search}
          onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
          className={styles.searchInput}
        />
        <select
          value={filters.idRol}
          onChange={e => setFilters(prev => ({ ...prev, idRol: e.target.value ? Number(e.target.value) : '' }))}
          className={styles.selectFilter}
        >
          <option value="">Todos los roles</option>
          <option value="1">Administrador</option>
          <option value="2">Secretaria</option>
          <option value="3">Cliente</option>
        </select>
      </div>

      {/* TABLA */}
      <div className={styles.tableContainer}>
        {loading ? (
          <p className={styles.loadingText}>Cargando usuarios del sistema...</p>
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
                      <td className={styles.tableCell}>{user.documento || '—'}</td>
                      <td className={styles.tableCell}>
                        <span className={styles.roleBadge}>{user.nombreRol}</span>
                      </td>
                      <td className={styles.tableCell}>
                        <span className={`${styles.statusBadge} ${user.estado ? styles.statusActive : styles.statusInactive}`}>
                          {user.estado ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className={styles.actionsCell}>

                        <button
                          onClick={() => handleOpenEdit(user)}
                          className={`${styles.actionBtn} ${styles.actionBtnEdit}`}
                        >
                          Editar
                        </button>

                        {!isAdmin(user) && (
                          <>
                            <span className={styles.actionDivider} />
                            <button
                              onClick={() => onEliminarClick(user.id, user.nombre)}
                              className={`${styles.actionBtn} ${styles.actionBtnDelete}`}
                            >
                              Eliminar
                            </button>
                          </>
                        )}

                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL */}
      <UserFormModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setSelectedUser(null); }}
        onSubmit={handleSubmitForm}
        user={selectedUser}
      />
    </div>
  );
};