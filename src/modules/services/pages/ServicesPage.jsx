// presentation/pages/ServicesPage.jsx
import { useState } from 'react';
import { Pagination } from '../../../core/components/Pagination';
import { useDebounce } from '../../../core/hooks/useDebounce';
import { DEFAULT_PAGE_SIZE } from '../../../core/utils/serverPagination';
import { SafeDeleteModal } from '../../../shared/components/SafeDeleteModal/SafeDeleteModal';
import { SAFE_DELETE_IMPACT_ENDPOINTS } from '../../../shared/components/SafeDeleteModal/safeDeleteEndpoints';
import { TableActions } from '../../../shared/components/TableActions/TableActions';
import { useAuth } from '../../../store/AuthContext';
import { useTecnicas } from '../tecnicas/application/useTecnicas';
import { ServiceFormModal } from '../tecnicas/presentation/ServiceFormModal';
import { ServiceDetailsModal } from '../tecnicas/presentation/ServiceDetailsModal';
import styles from '../tecnicas/presentation/services.module.css';

const ServicesPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const { hasAnyPermission, hasPermission } = useAuth();
  const debouncedSearch = useDebounce(searchTerm, 350);
  const {
    tecnicas,
    loading,
    error,
    handleCreate,
    handleUpdate,
    handleHardDelete,
    paginationMeta,
    refreshTecnicas,
  } = useTecnicas({
    page: currentPage,
    limit: DEFAULT_PAGE_SIZE,
    search: debouncedSearch,
    sortBy: 'nombre',
    order: 'asc',
  });

  const [isFormOpen, setIsFormOpen]           = useState(false);
  const [isDetailsOpen, setIsDetailsOpen]     = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [deletionService, setDeletionService] = useState(null);

  const totalServices    = paginationMeta.total;
  const activeServices   = tecnicas.filter(s => s.estado === true).length;
  const inactiveServices = tecnicas.filter(s => s.estado === false).length;
  const tariffPermissions = {
    canView: hasAnyPermission([
      'tarifas.tecnicas.ver',
      'tarifas.tecnicas.crear',
      'tarifas.tecnicas.editar',
      'tarifas.tecnicas.eliminar',
    ]),
    canCreate: hasPermission('tarifas.tecnicas.crear'),
    canEdit: hasPermission('tarifas.tecnicas.editar'),
    canDelete: hasPermission('tarifas.tecnicas.eliminar'),
  };

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
        {hasPermission('tecnicas.crear') && (
          <button onClick={handleOpenCreate} className={styles.primaryButton}>
            Nuevo servicio
          </button>
        )}
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
          <p className={styles.loadingText}>Cargando servicios de producción...</p>
        ) : error && tecnicas.length === 0 ? (
          <div className={styles.loadingText}>
            <p>No fue posible cargar las tecnicas.</p>
            <button type="button" className={styles.primaryButton} onClick={refreshTecnicas}>
              Reintentar
            </button>
          </div>
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
                      <TableActions
                        primaryAction={{ label: 'Ver', onClick: () => handleOpenDetails(service), variant: 'accent' }}
                        actions={[
                          hasPermission('tecnicas.editar') && { label: 'Editar', onClick: () => handleOpenEdit(service), variant: 'warning' },
                          hasPermission('tecnicas.eliminar') && { label: 'Eliminar', onClick: () => setDeletionService(service), variant: 'danger' },
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

      {/* MODALES */}
      {isFormOpen && (
        <ServiceFormModal
          key={selectedService?.id || 'new-service'}
          isOpen
          onClose={() => {
            setIsFormOpen(false);
            setSelectedService(null);
          }}
          onCreate={handleCreate}
          onUpdate={handleUpdate}
          service={selectedService}
          tariffPermissions={tariffPermissions}
        />
      )}

      <ServiceDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        service={selectedService}
      />
      <SafeDeleteModal
        key={deletionService?.id || 'technique-delete'}
        isOpen={Boolean(deletionService)}
        entityLabel="técnica"
        entityName={deletionService?.nombre || ''}
        impactEndpoint={deletionService ? SAFE_DELETE_IMPACT_ENDPOINTS.technique(deletionService.id) : ''}
        deleteAction={() => handleHardDelete(deletionService.id)}
        successMessage="Técnica eliminada correctamente."
        onClose={() => setDeletionService(null)}
      />
    </div>
  );
};

export default ServicesPage;
