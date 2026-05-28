// presentation/pages/ServicesPage.jsx
import React, { useState } from 'react';
import { useTecnicas } from '../tecnicas/application/useTecnicas';
import { ServiceFormModal } from '../tecnicas/presentation/ServiceFormModal';
import { ServiceDetailsModal } from '../tecnicas/presentation/ServiceDetailsModal';
import styles from '../tecnicas/presentation/services.module.css';

const ServicesPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const {
    tecnicas,
    loading,
    handleCreate,
    handleUpdate,
    handleHardDelete,
  } = useTecnicas({ search: searchTerm });

  const [isFormOpen, setIsFormOpen]           = useState(false);
  const [isDetailsOpen, setIsDetailsOpen]     = useState(false);
  const [selectedService, setSelectedService] = useState(null);

  const totalServices    = tecnicas.length;
  const activeServices   = tecnicas.filter(s => s.estado === true).length;
  const inactiveServices = tecnicas.filter(s => s.estado === false).length;

  const handleOpenCreate = () => {
    setSelectedService(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (service) => {
    setSelectedService(service);
    setIsFormOpen(true);
  };

  const handleOpenDetails = (service) => {
    setSelectedService(service);
    setIsDetailsOpen(true);
  };

  const onEliminarClick = (id, nombre) => {
    if (window.confirm(
      `¿Eliminar permanentemente el servicio "${nombre}"?\n\nEsta acción no se puede deshacer.`
    )) {
      handleHardDelete(id).catch(err => alert(err.message));
    }
  };

  return (
    <div className={styles.pageContainer}>

      {/* HEADER */}
      <div className={styles.headerWrapper}>
        <div>
          <span className={styles.breadcrumb}>Servicios / Gestión</span>
          <h1 className={styles.pageTitle}>Gestión de Servicios</h1>
          <p className={styles.pageSubtitle}>
            Administra los tipos de técnicas, estampados y procesos de producción.
          </p>
        </div>
        <button onClick={handleOpenCreate} className={styles.primaryButton}>
          Nuevo servicio
        </button>
      </div>

      {/* KPIs */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Registrados</span>
          <span className={styles.kpiValue}>{totalServices}</span>
        </div>
        <div className={`${styles.kpiCard} ${styles.kpiCardSuccess}`}>
          <span className={styles.kpiLabel}>Activos</span>
          <span className={`${styles.kpiValue} ${styles.kpiValueSuccess}`}>{activeServices}</span>
        </div>
        <div className={`${styles.kpiCard} ${styles.kpiCardDanger}`}>
          <span className={styles.kpiLabel}>Inactivos</span>
          <span className={`${styles.kpiValue} ${styles.kpiValueDanger}`}>{inactiveServices}</span>
        </div>
      </div>

      {/* BUSCADOR */}
      <div className={styles.filterSection}>
        <input
          type="text"
          placeholder="Buscar servicio por nombre o descripción..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      {/* TABLA */}
      <div className={styles.tableContainer}>
        {loading ? (
          <p className={styles.loadingText}>Cargando servicios de producción...</p>
        ) : tecnicas.length === 0 ? (
          <p className={styles.loadingText}>No se encontraron servicios registrados.</p>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr className={styles.tableHeadRow}>
                  <th className={styles.tableHeader}>ID</th>
                  <th className={styles.tableHeader}>Nombre del servicio</th>
                  <th className={styles.tableHeader}>Descripción</th>
                  <th className={styles.tableHeader}>Estado</th>
                  <th className={styles.tableHeader}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {tecnicas.map((service) => (
                  <tr key={service.id} className={styles.tableBodyRow}>
                    <td className={styles.tableCellId}>#{service.id}</td>
                    <td className={styles.tableCellBold}>{service.nombre}</td>
                    <td className={styles.tableCell}>
                      {service.descripcion || (
                        <span className={styles.tableCellMuted}>Sin descripción</span>
                      )}
                    </td>
                    <td className={styles.tableCell}>
                      <span className={`${styles.statusBadge} ${service.estado ? styles.statusActive : styles.statusInactive}`}>
                        {service.estado ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className={styles.actionsCell}>

                      <button
                        onClick={() => handleOpenDetails(service)}
                        className={`${styles.actionBtn} ${styles.actionBtnView}`}
                      >
                        Ver
                      </button>

                      <span className={styles.actionDivider} />

                      <button
                        onClick={() => handleOpenEdit(service)}
                        className={`${styles.actionBtn} ${styles.actionBtnEdit}`}
                      >
                        Editar
                      </button>

                      <span className={styles.actionDivider} />

                      <button
                        onClick={() => onEliminarClick(service.id, service.nombre)}
                        className={`${styles.actionBtn} ${styles.actionBtnDelete}`}
                      >
                        Eliminar
                      </button>

                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODALES */}
      <ServiceFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={selectedService ? handleUpdate : handleCreate}
        service={selectedService}
      />

      <ServiceDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        service={selectedService}
      />
    </div>
  );
};

export default ServicesPage;