import { useEffect, useState } from 'react';
import { Pagination } from '../../../core/components/Pagination';
import { notifications } from '../../../core/utils/notifications';
import { DEFAULT_PAGE_SIZE } from '../../../core/utils/serverPagination';
import { useConfirm } from '../../../shared/components/ConfirmDialog/ConfirmProvider';
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
  const [clients, setClients] = useState([]);
  const [paginationMeta, setPaginationMeta] = useState(emptyMeta);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedClient, setSelectedClient] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const response = await clientRepository.list({
        page: currentPage,
        limit: DEFAULT_PAGE_SIZE,
        search,
        sortBy: 'nombre',
        order: 'asc',
      });
      setClients(response.items);
      setPaginationMeta(response.meta);
    } catch (error) {
      notifications.error(error.message || 'No se pudieron cargar los clientes.');
      setClients([]);
      setPaginationMeta(emptyMeta);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, search]);

  const handleView = async (client) => {
    setSelectedClient(client);
    setLoadingDetail(true);
    try {
      const detail = await clientRepository.getById(client.idCliente);
      setSelectedClient(detail);
    } catch (error) {
      notifications.error(error.message || 'No se pudo cargar el detalle del cliente.');
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleDeactivate = async (client) => {
    const accepted = await confirm({
      title: 'Eliminar cliente',
      message: '¿Estás seguro de eliminar este cliente? Esta acción puede afectar el historial relacionado.',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      variant: 'danger',
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

  const handleDelete = async (client) => {
    const accepted = await confirm({
      title: 'Eliminar cliente',
      message: '¿Estás seguro de eliminar este cliente? Esta acción puede afectar el historial relacionado.',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      variant: 'danger',
    });

    if (!accepted) return;

    try {
      await clientRepository.delete(client.idCliente);
      notifications.success('Cliente eliminado correctamente.');
      fetchClients();
    } catch (error) {
      notifications.error(error.message || 'No se pudo eliminar el cliente.');
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
                            hasPermission('clientes.desactivar') && client.estado && { label: 'Eliminar', onClick: () => handleDeactivate(client), variant: 'danger' },
                            hasPermission('clientes.eliminar') && { label: 'Eliminar definitivo', onClick: () => handleDelete(client), variant: 'danger' },
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
        onClose={() => setSelectedClient(null)}
      />
    </div>
  );
};

export default ClientsPage;
