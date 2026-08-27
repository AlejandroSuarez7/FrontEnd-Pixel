import { useRef, useState } from 'react';
import { Pagination } from '../../../core/components/Pagination';
import { useDebounce } from '../../../core/hooks/useDebounce';
import { useLatestListRequest } from '../../../core/hooks/useLatestListRequest';
import { notifications } from '../../../core/utils/notifications';
import { DEFAULT_PAGE_SIZE } from '../../../core/utils/serverPagination';
import { useConfirm } from '../../../shared/components/ConfirmDialog/ConfirmProvider';
import { SafeDeleteModal } from '../../../shared/components/SafeDeleteModal/SafeDeleteModal';
import { SAFE_DELETE_IMPACT_ENDPOINTS } from '../../../shared/components/SafeDeleteModal/safeDeleteEndpoints';
import { TableActions } from '../../../shared/components/TableActions/TableActions';
import { useAuth } from '../../../store/AuthContext';
import { clientRepository } from '../infrastructure/client.repository';
import styles from '../presentation/users.module.css';

const emptyMeta = {
  page: 1,
  limit: DEFAULT_PAGE_SIZE,
  total: 0,
  totalPages: 0,
  hasNextPage: false,
  hasPrevPage: false,
};

const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? '-'
    : date.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
};

const ClientDetailModal = ({ client, loading, onClose }) => {
  if (!client) return null;

  return (
    <div className={styles.overlay}>
      <div className={`${styles.modalContainer} ${styles.modalMd}`}>
        <div className={styles.modalHeader}>
          <div>
            <h3 className={styles.modalTitle}>{client.nombre}</h3>
            <p className={styles.pageSubtitle}>Cliente externo sin acceso al sistema.</p>
          </div>
          <button type="button" onClick={onClose} className={styles.modalCloseBtn}>x</button>
        </div>

        {loading ? (
          <p className={styles.loadingText}>Cargando detalle del cliente...</p>
        ) : (
        <div className={styles.form}>
          <div className={styles.formRow}>
            <div className={styles.inputGroup}>
              <span className={styles.inputLabel}>Correo</span>
              <strong>{client.correo || '-'}</strong>
            </div>
            <div className={styles.inputGroup}>
              <span className={styles.inputLabel}>Telefono</span>
              <strong>{client.telefono || '-'}</strong>
            </div>
          </div>
          <div className={styles.formRow}>
            <div className={styles.inputGroup}>
              <span className={styles.inputLabel}>Documento</span>
              <strong>{client.documento || '-'}</strong>
            </div>
            <div className={styles.inputGroup}>
              <span className={styles.inputLabel}>Direccion</span>
              <strong>{client.direccion || '-'}</strong>
            </div>
          </div>
          <div className={styles.formRow}>
            <div className={styles.inputGroup}>
              <span className={styles.inputLabel}>Cotizaciones</span>
              <strong>{client.count?.cotizaciones ?? client.cotizaciones?.length ?? 0}</strong>
            </div>
            <div className={styles.inputGroup}>
              <span className={styles.inputLabel}>Pedidos</span>
              <strong>{client.count?.pedidos ?? client.pedidos?.length ?? 0}</strong>
            </div>
          </div>
        </div>
        )}

        <div className={styles.modalFooter}>
          <button type="button" onClick={onClose} className={styles.btnSecondary}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

const ClientsPage = () => {
  const { hasPermission } = useAuth();
  const confirm = useConfirm();
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedClient, setSelectedClient] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [deletionClient, setDeletionClient] = useState(null);
  const detailRequestRef = useRef(0);
  const debouncedSearch = useDebounce(search, 350);
  const {
    data,
    loading,
    error,
    refetch: fetchClients,
  } = useLatestListRequest({
    queryKey: JSON.stringify({ currentPage, search: debouncedSearch }),
    load: signal => clientRepository.list({
        page: currentPage,
        limit: DEFAULT_PAGE_SIZE,
        search: debouncedSearch,
        sortBy: 'nombre',
        order: 'asc',
      }, { signal }),
    initialData: { items: [], meta: emptyMeta },
  });
  const clients = data.items;
  const paginationMeta = data.meta;

  const handleView = async (client) => {
    const requestId = ++detailRequestRef.current;
    setSelectedClient(client);
    setLoadingDetail(true);
    try {
      const detail = await clientRepository.getById(client.idCliente);
      if (requestId !== detailRequestRef.current) return;
      setSelectedClient(detail);
    } catch (error) {
      if (requestId !== detailRequestRef.current) return;
      notifications.error(error.message || 'No se pudo cargar el detalle del cliente.');
    } finally {
      if (requestId === detailRequestRef.current) {
        setLoadingDetail(false);
      }
    }
  };

  const handleDeactivate = async (client) => {
    const accepted = await confirm({
      title: 'Desactivar cliente',
      message: `¿Confirmas desactivar a "${client.nombre}"? El registro y su historial se conservarán.`,
      confirmText: 'Desactivar',
      cancelText: 'Cancelar',
      variant: 'warning',
    });

    if (!accepted) return;

    try {
      await clientRepository.deactivate(client.idCliente);
      notifications.success('Cliente desactivado correctamente.');
      fetchClients();
    } catch (error) {
      notifications.error(error.message || 'No se pudo desactivar el cliente.');
    }
  };

  const activeClients = clients.filter(client => client.estado).length;
  const inactiveClients = clients.filter(client => !client.estado).length;

  return (
    <div className={styles.pageContainer}>
      <div className={styles.headerWrapper}>
        <div>
          <span className={styles.breadcrumb}>Usuarios / Clientes</span>
          <h1 className={styles.pageTitle}>Clientes</h1>
          <p className={styles.pageSubtitle}>
            Consulta clientes externos creados desde cotizaciones publicas o presenciales.
          </p>
        </div>
      </div>

      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Total clientes</span>
          <span className={styles.kpiValue}>{paginationMeta.total}</span>
        </div>
        <div className={`${styles.kpiCard} ${styles.kpiCardSuccess}`}>
          <span className={styles.kpiLabel}>Activos en pagina</span>
          <span className={`${styles.kpiValue} ${styles.kpiValueSuccess}`}>{activeClients}</span>
        </div>
        <div className={`${styles.kpiCard} ${styles.kpiCardDanger}`}>
          <span className={styles.kpiLabel}>Inactivos en pagina</span>
          <span className={`${styles.kpiValue} ${styles.kpiValueDanger}`}>{inactiveClients}</span>
        </div>
      </div>

      <div className={styles.filterSection}>
        <input
          type="text"
          placeholder="Buscar por nombre, correo, telefono o documento..."
          value={search}
          onChange={event => {
            setSearch(event.target.value);
            setCurrentPage(1);
          }}
          className={styles.searchInput}
        />
      </div>

      <div className={styles.tableContainer}>
        {loading ? (
          <p className={styles.loadingText}>Cargando clientes externos...</p>
        ) : error && clients.length === 0 ? (
          <div className={styles.loadingText}>
            <p>No fue posible cargar los clientes.</p>
            <button type="button" className={styles.primaryButton} onClick={fetchClients}>
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
                  <th className={styles.tableHeader}>Telefono</th>
                  <th className={styles.tableHeader}>Documento</th>
                  <th className={styles.tableHeader}>Estado</th>
                  <th className={styles.tableHeader}>Creacion</th>
                  <th className={styles.tableHeader}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {clients.length === 0 ? (
                  <tr>
                    <td colSpan="7" className={styles.loadingText}>
                      No se encontraron clientes externos.
                    </td>
                  </tr>
                ) : (
                  clients.map(client => (
                    <tr key={client.idCliente} className={styles.tableBodyRow}>
                      <td className={styles.tableCellName}>{client.nombre}</td>
                      <td className={styles.tableCellSecondary}>{client.correo || '-'}</td>
                      <td className={styles.tableCell}>{client.telefono || '-'}</td>
                      <td className={styles.tableCell}>{client.documento || '-'}</td>
                      <td className={styles.tableCell}>
                        <span className={`${styles.statusBadge} ${client.estado ? styles.statusActive : styles.statusInactive}`}>
                          {client.estado ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className={styles.tableCellSecondary}>{formatDate(client.fechaCreacion)}</td>
                      <td className={styles.actionsCell}>
                        <TableActions
                          primaryAction={{ label: 'Ver', onClick: () => { void handleView(client); }, variant: 'accent' }}
                          actions={[
                            hasPermission('clientes.desactivar') && client.estado && { label: 'Desactivar', onClick: () => handleDeactivate(client), variant: 'warning' },
                            hasPermission('clientes.eliminar') && { label: 'Eliminar', onClick: () => setDeletionClient(client), variant: 'danger' },
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

      <ClientDetailModal
        client={selectedClient}
        loading={loadingDetail}
        onClose={() => {
          detailRequestRef.current += 1;
          setSelectedClient(null);
          setLoadingDetail(false);
        }}
      />

      <SafeDeleteModal
        key={deletionClient?.idCliente || 'client-delete'}
        isOpen={Boolean(deletionClient)}
        entityLabel="cliente"
        entityName={deletionClient?.nombre || ''}
        impactEndpoint={deletionClient ? SAFE_DELETE_IMPACT_ENDPOINTS.client(deletionClient.idCliente) : ''}
        deleteAction={() => clientRepository.delete(deletionClient.idCliente)}
        onDeleted={fetchClients}
        successMessage="Cliente eliminado correctamente."
        onClose={() => setDeletionClient(null)}
      />
    </div>
  );
};

export default ClientsPage;
