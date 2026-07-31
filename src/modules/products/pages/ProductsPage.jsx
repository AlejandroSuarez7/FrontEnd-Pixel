import { useEffect, useState } from 'react';
import { Pagination } from '../../../core/components/Pagination';
import { useDebounce } from '../../../core/hooks/useDebounce';
import { notifications } from '../../../core/utils/notifications';
import { DEFAULT_PAGE_SIZE } from '../../../core/utils/serverPagination';
import { useConfirm } from '../../../shared/components/ConfirmDialog/ConfirmProvider';
import { TableActions } from '../../../shared/components/TableActions/TableActions';
import { useAuth } from '../../../store/AuthContext';
import { useProducts } from '../application/useProducts';
import { categoryRepository } from '../infrastructure/category.repository';
import { ProductModal } from '../presentation/ProductModal';
import styles from '../../users/presentation/users.module.css';

export const ProductsPage = () => {
  const { hasAnyPermission, hasPermission } = useAuth();
  const confirm = useConfirm();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const debouncedSearch = useDebounce(search, 350);

  const {
    products,
    paginationMeta,
    loading,
    error,
    refreshProducts,
    createProduct,
    updateProduct,
    deactivateProduct,
    deleteProduct,
    loadRanges,
    saveRanges,
  } = useProducts({
    page: currentPage,
    limit: DEFAULT_PAGE_SIZE,
    search: debouncedSearch,
    idCategoriaProducto: categoryFilter,
    sortBy: 'idProducto',
    order: 'desc',
  });

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      categoryRepository.listPublic({ signal: controller.signal })
        .then((categories) => {
          if (!controller.signal.aborted) setCategoryOptions(categories);
        })
        .catch((error) => {
          if (!controller.signal.aborted && error?.code !== 'ERR_CANCELED') {
            setCategoryOptions([]);
          }
        });
    }, 0);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, []);

  const openCreate = () => {
    setSelectedProduct(null);
    setIsModalOpen(true);
  };

  const openEdit = (product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const canManageDiscounts = hasAnyPermission([
    'productos.descuentos.gestionar',
    'productos.precios',
  ]);

  const handleSubmit = async ({ product: payload, ranges, persistedProductId }) => {
    const idProducto = selectedProduct?.idProducto || persistedProductId;
    const savedProduct = idProducto
      ? await updateProduct(idProducto, payload, { refresh: !canManageDiscounts })
      : await createProduct(payload, { refresh: !canManageDiscounts });

    if (canManageDiscounts) {
      try {
        await saveRanges(savedProduct.idProducto, ranges);
      } catch (error) {
        await refreshProducts().catch(() => undefined);
        const partialError = new Error(
          'El producto se guardó, pero sus rangos no. Corrige el error y vuelve a guardar; no se creará otro producto.',
        );
        partialError.partial = true;
        partialError.persistedProductId = savedProduct.idProducto;
        partialError.cause = error;
        throw partialError;
      }
    }

    notifications.success(
      selectedProduct || persistedProductId
        ? 'Producto actualizado correctamente.'
        : 'Producto creado correctamente.',
    );
    return savedProduct;
  };

  const handleDeactivate = async (product) => {
    const accepted = await confirm({
      title: 'Desactivar producto',
      message: `Desactivar "${product.nombre}"? Dejaria de aparecer en el cotizador publico.`,
      confirmText: 'Desactivar',
      variant: 'warning',
    });
    if (!accepted) return;

    try {
      await deactivateProduct(product.idProducto);
      notifications.success('Producto desactivado correctamente.');
    } catch (error) {
      notifications.error(error.message || 'No se pudo desactivar el producto.');
    }
  };

  const handleDelete = async (product) => {
    const accepted = await confirm({
      title: 'Eliminar producto',
      message: `Eliminar permanentemente "${product.nombre}"?`,
      confirmText: 'Eliminar',
      variant: 'danger',
    });
    if (!accepted) return;

    try {
      await deleteProduct(product.idProducto);
      notifications.success('Producto eliminado correctamente.');
    } catch (error) {
      notifications.error(error.message || 'No se pudo eliminar el producto.');
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.headerWrapper}>
        <div>
          <span className={styles.breadcrumb}>Servicios / Productos</span>
          <h1 className={styles.pageTitle}>Productos cotizables</h1>
          <p className={styles.pageSubtitle}>Administra el catálogo visible en solicitudes. Los precios viven en Técnicas.</p>
        </div>
        {hasPermission('productos.crear') && (
          <button className={styles.primaryButton} onClick={openCreate}>Nuevo producto</button>
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
        <select
          className={styles.selectFilter}
          value={categoryFilter}
          onChange={event => {
            setCategoryFilter(event.target.value);
            setCurrentPage(1);
          }}
        >
          <option value="">Todas las categorias</option>
          {categoryOptions.map(category => (
            <option key={category.idCategoriaProducto} value={category.idCategoriaProducto}>
              {category.nombre}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.tableContainer}>
        {loading ? (
          <p className={styles.loadingText}>Cargando productos...</p>
        ) : error && products.length === 0 ? (
          <div className={styles.loadingText}>
            <p>No fue posible cargar los productos.</p>
            <button type="button" className={styles.primaryButton} onClick={refreshProducts}>
              Reintentar
            </button>
          </div>
        ) : products.length === 0 ? (
          <p className={styles.loadingText}>No se encontraron productos cotizables.</p>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr className={styles.tableHeadRow}>
                  <th className={styles.tableHeader}>Producto</th>
                  <th className={styles.tableHeader}>Categoria</th>
                  <th className={styles.tableHeader}>Diseño</th>
                  <th className={styles.tableHeader}>Estado</th>
                  <th className={styles.tableHeader}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {products.map(product => (
                  <tr key={product.idProducto} className={styles.tableBodyRow}>
                    <td className={styles.tableCellName}>
                      {product.nombre}
                      <span className={styles.tableCellSecondary} style={{ display: 'block', padding: 0 }}>
                        {product.descripcion || 'Sin descripcion'}
                      </span>
                    </td>
                    <td className={styles.tableCell}>{product.categoriaProducto?.nombre || 'Sin categoria'}</td>
                    <td className={styles.tableCell}>{product.requiereDiseno ? 'Requerido' : 'No requerido'}</td>
                    <td className={styles.tableCell}>
                      <span className={`${styles.statusBadge} ${product.estado ? styles.statusActive : styles.statusInactive}`}>
                        {product.estado ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className={styles.actionsCell}>
                      <TableActions
                        primaryAction={hasPermission('productos.editar') ? { label: 'Editar', onClick: () => openEdit(product), variant: 'warning' } : null}
                        actions={[
                          hasPermission('productos.desactivar') && product.estado && { label: 'Desactivar', onClick: () => handleDeactivate(product), variant: 'danger' },
                          hasPermission('productos.eliminar') && { label: 'Eliminar', onClick: () => handleDelete(product), variant: 'danger' },
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

      {isModalOpen && (
        <ProductModal
          key={selectedProduct?.idProducto || 'new-product'}
          isOpen
          onClose={() => { setIsModalOpen(false); setSelectedProduct(null); }}
          onSubmit={handleSubmit}
          onLoadRanges={loadRanges}
          product={selectedProduct}
          categories={categoryOptions}
          canManageDiscounts={canManageDiscounts}
        />
      )}
    </div>
  );
};
