import { useEffect, useMemo, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { Pagination } from '../../../../core/components/Pagination';
import { useDebounce } from '../../../../core/hooks/useDebounce';
import { notifications } from '../../../../core/utils/notifications';
import { DEFAULT_PAGE_SIZE } from '../../../../core/utils/serverPagination';
import { useConfirm } from '../../../../shared/components/ConfirmDialog/ConfirmProvider';
import { TableActions } from '../../../../shared/components/TableActions/TableActions';
import { useAuth } from '../../../../store/AuthContext';
import { useTariffs } from '../application/useTariffs';
import { tariffRepository } from '../infrastructure/tariff.repository';
import { TariffModal } from '../presentation/TariffModal';
import styles from '../presentation/tariffs.module.css';

const formatMoney = (value) => (
  value == null
    ? 'No especificado'
    : new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value)
);

const formatDimension = (value) => (
  value == null ? 'No especificada' : `${Number(value).toLocaleString('es-CO')} cm`
);

export const TechniqueRatesPage = () => {
  const { hasPermission } = useAuth();
  const confirm = useConfirm();
  const [search, setSearch] = useState('');
  const [techniqueFilter, setTechniqueFilter] = useState('');
  const [page, setPage] = useState(1);
  const [techniques, setTechniques] = useState([]);
  const [catalogError, setCatalogError] = useState('');
  const [selectedTariff, setSelectedTariff] = useState(null);
  const [rateModalOpen, setRateModalOpen] = useState(false);
  const debouncedSearch = useDebounce(search, 350);

  const filters = useMemo(() => ({
    page,
    limit: DEFAULT_PAGE_SIZE,
    search: debouncedSearch,
    idTecnica: techniqueFilter,
    sortBy: 'idTarifa',
    order: 'desc',
  }), [page, debouncedSearch, techniqueFilter]);

  const {
    tariffs,
    paginationMeta,
    loading,
    error,
    createTariff,
    updateTariff,
    deleteTariff,
    refreshTariffs,
  } = useTariffs(filters);

  useEffect(() => {
    const controller = new AbortController();
    tariffRepository.listTechniques({ signal: controller.signal })
      .then((data) => {
        if (!controller.signal.aborted) {
          setTechniques(data);
          setCatalogError('');
        }
      })
      .catch((requestError) => {
        if (!controller.signal.aborted && requestError?.code !== 'ERR_CANCELED') {
          setCatalogError(requestError.message || 'No se pudieron cargar las técnicas.');
        }
      });
    return () => controller.abort();
  }, []);

  const openCreate = () => {
    setSelectedTariff(null);
    setRateModalOpen(true);
  };

  const saveTariff = async (payload) => {
    if (selectedTariff) {
      await updateTariff(selectedTariff.idTarifa, payload);
      notifications.success('Tarifa actualizada correctamente.');
    } else {
      await createTariff(payload);
      notifications.success('Tarifa creada correctamente.');
    }
  };

  const removeTariff = async (tariff) => {
    const accepted = await confirm({
      title: 'Eliminar tarifa',
      message: `¿Eliminar la tarifa de ${tariff.tecnica?.nombre || 'esta técnica'} para ${formatDimension(tariff.anchoHastaCm)} × ${formatDimension(tariff.altoHastaCm)}?`,
      confirmText: 'Eliminar',
      variant: 'danger',
    });
    if (!accepted) return;

    try {
      await deleteTariff(tariff.idTarifa);
      notifications.success('Tarifa eliminada correctamente.');
    } catch (requestError) {
      notifications.error(requestError.message || 'No se pudo eliminar la tarifa.');
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <span className={styles.eyebrow}>Catálogo / Técnicas</span>
          <h1>Tarifas por técnica</h1>
          <p>Consulta precios por dimensiones. La administración normal se realiza desde Gestión de Servicios.</p>
        </div>
        {hasPermission('tarifas.tecnicas.crear') && (
          <button type="button" className={styles.primaryButton} onClick={openCreate}>
            <Plus size={17} /> Nueva tarifa
          </button>
        )}
      </header>

      <section className={styles.filterCard}>
        <label className={styles.searchField}>
          <Search size={17} aria-hidden="true" />
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Buscar por técnica..."
          />
        </label>
        <select
          value={techniqueFilter}
          onChange={(event) => {
            setTechniqueFilter(event.target.value);
            setPage(1);
          }}
        >
          <option value="">Todas las técnicas</option>
          {techniques.map((technique) => (
            <option key={technique.idTecnica} value={technique.idTecnica}>{technique.nombre}</option>
          ))}
        </select>
      </section>

      {catalogError && <p className={styles.inlineWarning}>{catalogError}</p>}

      <section className={styles.tableCard}>
        {loading ? (
          <p className={styles.stateMessage}>Cargando tarifas...</p>
        ) : error && tariffs.length === 0 ? (
          <div className={styles.stateMessage}>
            <p>No se pudieron cargar las tarifas.</p>
            <button type="button" className={styles.secondaryButton} onClick={refreshTariffs}>Reintentar</button>
          </div>
        ) : tariffs.length === 0 ? (
          <p className={styles.stateMessage}>No hay tarifas para los filtros seleccionados.</p>
        ) : (
          <div className={styles.tableScroll}>
            <table>
              <thead>
                <tr>
                  <th>Técnica</th>
                  <th>Hasta ancho</th>
                  <th>Hasta alto</th>
                  <th>Precio unitario</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {tariffs.map((tariff) => (
                  <tr key={tariff.idTarifa}>
                    <td>
                      <strong>{tariff.tecnica?.nombre || 'Técnica no especificada'}</strong>
                      <small>Tarifa #{tariff.idTarifa}</small>
                    </td>
                    <td>{formatDimension(tariff.anchoHastaCm)}</td>
                    <td>{formatDimension(tariff.altoHastaCm)}</td>
                    <td className={styles.money}>{formatMoney(tariff.precioUnitario)}</td>
                    <td>
                      <span className={`${styles.badge} ${tariff.estado ? styles.active : styles.inactive}`}>
                        {tariff.estado ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                    <td>
                      <TableActions
                        primaryAction={hasPermission('tarifas.tecnicas.editar') ? {
                          label: 'Editar',
                          variant: 'warning',
                          onClick: () => {
                            setSelectedTariff(tariff);
                            setRateModalOpen(true);
                          },
                        } : null}
                        actions={[
                          hasPermission('tarifas.tecnicas.eliminar') && {
                            label: 'Eliminar',
                            variant: 'danger',
                            onClick: () => removeTariff(tariff),
                          },
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
          currentPage={page}
          hasNextPage={paginationMeta.hasNextPage}
          hasPrevPage={paginationMeta.hasPrevPage}
          onPageChange={setPage}
          pageSize={paginationMeta.limit}
          totalItems={paginationMeta.total}
          totalPages={paginationMeta.totalPages}
        />
      </section>

      {rateModalOpen && (
        <TariffModal
          key={selectedTariff?.idTarifa || 'new-tariff'}
          open
          tariff={selectedTariff}
          techniques={techniques}
          onClose={() => {
            setRateModalOpen(false);
            setSelectedTariff(null);
          }}
          onSubmit={saveTariff}
        />
      )}

    </div>
  );
};
