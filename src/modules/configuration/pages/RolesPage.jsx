// presentation/pages/RolesPage.jsx
import React, { useState } from 'react';
import { useRoles } from '../roles/application/useRoles';
import { RoleFormModal } from '../roles/presentation/RoleFormModal';
import styles from '../roles/presentation/roles.module.css';

const RolesPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { roles, loading, handleCreate, handleUpdate, handleDelete } = useRoles({ search: searchTerm });

  const [isModalOpen, setIsModalOpen]   = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);

  const totalRoles    = roles.length;
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

  const onToggleEstadoClick = (id, nombre) => {
    if (window.confirm(`¿Estás seguro de que deseas alternar el estado del rol "${nombre}"?`)) {
      handleDelete(id);
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
        <button onClick={handleOpenCreate} className={styles.primaryButton}>
          Nuevo rol
        </button>
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
          onChange={e => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      {/* TABLA */}
      <div className={styles.tableContainer}>
        {loading ? (
          <p className={styles.loadingText}>Sincronizando roles del sistema...</p>
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
                      <button
                        onClick={() => handleOpenEdit(role)}
                        className={`${styles.actionBtn} ${styles.actionBtnEdit}`}
                      >
                        Editar
                      </button>

                      <span className={styles.actionDivider} />

                      <button
                        onClick={() => onToggleEstadoClick(role.id, role.nombre)}
                        className={`${styles.actionBtn} ${role.estado ? styles.actionBtnDeactivate : styles.actionBtnActivate}`}
                      >
                        {role.estado ? 'Desactivar' : 'Activar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL */}
      <RoleFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={selectedRole ? handleUpdate : handleCreate}
        role={selectedRole}
      />
    </div>
  );
};

export default RolesPage;