import { useState } from 'react';
import { Pagination } from '../../../core/components/Pagination';
import { notifications } from '../../../core/utils/notifications';
import { DEFAULT_PAGE_SIZE } from '../../../core/utils/serverPagination';
import { useConfirm } from '../../../shared/components/ConfirmDialog/ConfirmProvider';
import { TableActions } from '../../../shared/components/TableActions/TableActions';
import { useAuth } from '../../../store/AuthContext';
import { useProductCategories } from '../application/useProductCategories';
import { CategoryModal } from '../presentation/CategoryModal';
import styles from '../../users/presentation/users.module.css';

export const ProductCategoriesPage = () => {
  const { hasPermission } = useAuth();
  const confirm = useConfirm();
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const {
    categories,
    paginationMeta,
    loading,
    createCategory,
    updateCategory,
    deactivateCategory,
    deleteCategory,
  } = useProductCategories({
    page: currentPage,
    limit: DEFAULT_PAGE_SIZE,
    search,
    sortBy: 'idCategoriaProducto',
    order: 'desc',
  });

  const openCreate = () => {
    setSelectedCategory(null);
    setIsModalOpen(true);
  };

  const openEdit = (category) => {
    setSelectedCategory(category);
    setIsModalOpen(true);
  };

  const handleSubmit = async (payload) => {
    if (selectedCategory) {
      await updateCategory(selectedCategory.idCategoriaProducto, payload);
      notifications.success('Categoria actualizada correctamente.');
    } else {
      await createCategory(payload);
      notifications.success('Categoria creada correctamente.');
    }
    setIsModalOpen(false);
    setSelectedCategory(null);
  };

  const handleDeactivate = async (category) => {
    const accepted = await confirm({
      title: 'Desactivar categoria',
      message: `Desactivar "${category.nombre}"? Sus productos asociados podrian dejar de usarse para nuevas cotizaciones.`,
      confirmText: 'Desactivar',
      variant: 'warning',
    });

    if (!accepted) return;

    try {
      await deactivateCategory(category.idCategoriaProducto);
      notifications.success('Categoria desactivada correctamente.');
    } catch (error) {
      notifications.error(error.message || 'No se pudo desactivar la categoria.');
    }
  };

  const handleDelete = async (category) => {
    const accepted = await confirm({
      title: 'Eliminar categoria',
      message: `Eliminar permanentemente "${category.nombre}"?`,
      confirmText: 'Eliminar',
      variant: 'danger',
    });

    if (!accepted) return;

    try {
      await deleteCategory(category.idCategoriaProducto);
      notifications.success('Categoria eliminada correctamente.');
    } catch (error) {
      notifications.error(error.message || 'No se pudo eliminar la categoria.');
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.headerWrapper}>
        <div>
          <span className={styles.breadcrumb}>Servicios / Categorias</span>
          <h1 className={styles.pageTitle}>Categorias de productos</h1>
          <p className={styles.pageSubtitle}>Organiza los productos cotizables que ve el cliente en la landing.</p>
        </div>
        {hasPermission('categorias_producto.crear') && (
          <button className={styles.primaryButton} onClick={openCreate}>Nueva categoria</button>
        )}
      </div>

      <div className={styles.filterSection}>
        <input
          className={styles.searchInput}
          value={search}
          onChange={event => {
            setSearch(event.target.value);
            setCurrentPage(1);
          }}
          placeholder="Buscar por nombre..."
        />
      </div>

      <div className={styles.tableContainer}>
        {loading ? (
          <p className={styles.loadingText}>Cargando categorias...</p>
        ) : categories.length === 0 ? (
          <p className={styles.loadingText}>No se encontraron categorias.</p>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr className={styles.tableHeadRow}>
                  <th className={styles.tableHeader}>Categoria</th>
                  <th className={styles.tableHeader}>Descripcion</th>
                  <th className={styles.tableHeader}>Estado</th>
                  <th className={styles.tableHeader}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {categories.map(category => (
                  <tr key={category.idCategoriaProducto} className={styles.tableBodyRow}>
                    <td className={styles.tableCellName}>{category.nombre}</td>
                    <td className={styles.tableCell}>{category.descripcion || 'Sin descripcion'}</td>
                    <td className={styles.tableCell}>
                      <span className={`${styles.statusBadge} ${category.estado ? styles.statusActive : styles.statusInactive}`}>
                        {category.estado ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                    <td className={styles.actionsCell}>
                      <TableActions
                        primaryAction={hasPermission('categorias_producto.editar') ? { label: 'Editar', onClick: () => openEdit(category), variant: 'warning' } : null}
                        actions={[
                          hasPermission('categorias_producto.desactivar') && category.estado && { label: 'Desactivar', onClick: () => handleDeactivate(category), variant: 'danger' },
                          hasPermission('categorias_producto.eliminar') && { label: 'Eliminar', onClick: () => handleDelete(category), variant: 'danger' },
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

      <CategoryModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setSelectedCategory(null); }}
        onSubmit={handleSubmit}
        category={selectedCategory}
      />
    </div>
  );
};
