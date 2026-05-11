import { useContext } from 'react';
import { AuthContext } from '../../../../store/AuthContext';
import { useSales } from '../hooks/useSales.js';
import SalesFilters from '../components/SalesFilters.jsx';
import SalesSummaryCards from '../components/SalesSummaryCards.jsx';
import SalesTable from '../components/SalesTable.jsx';
import SaleFormModal from '../components/SaleFormModal.jsx';
import SaleDetailModal from '../components/SaleDetailModal.jsx';
import styles from './SalesPage.module.css';
import 'sweetalert2/dist/sweetalert2.css';

const SalesPage = () => {
  const { user } = useContext(AuthContext);
  const {
    filteredSales,
    sales,
    isLoading,
    query,
    statusFilter,
    paymentFilter,
    setQuery,
    setStatusFilter,
    setPaymentFilter,
    openSaleForm,
    isFormOpen,
    closeSaleForm,
    openSaleDetail,
    isDetailOpen,
    closeSaleDetail,
    selectedSale,
    addSale,
    annulSale,
    downloadSalePdf,
    SALE_STATUSES,
  } = useSales();

  return (
    <div className={styles.salesPage}>
      <section className={styles.pageHeader}>
        <div>
          <p className={styles.breadcrumb}>Ventas / Gestión</p>
          <h1>Gestión de Ventas</h1>
          <p className={styles.subtitle}>
            Administra ventas, pagos, estado de transacciones y productos vendidos.
          </p>
        </div>

        <button className={styles.ctaButton} type="button" onClick={openSaleForm}>
          Nueva venta
        </button>
      </section>

      <section className={styles.summarySection}>
        <SalesSummaryCards sales={sales} />
      </section>

      <section className={styles.controlsSection}>
        <SalesFilters
          query={query}
          statusFilter={statusFilter}
          paymentFilter={paymentFilter}
          onQueryChange={setQuery}
          onStatusChange={setStatusFilter}
          onPaymentMethodChange={setPaymentFilter}
          onCreateSale={openSaleForm}
        />
      </section>

      <section className={styles.tableSection}>
        <SalesTable
          sales={filteredSales}
          isLoading={isLoading}
          onView={openSaleDetail}
          onPdf={downloadSalePdf}
          onAnnul={annulSale}
          currentUserEmail={user?.email || 'Administrador'}
        />
      </section>

      <SaleFormModal
        open={isFormOpen}
        onClose={closeSaleForm}
        onSubmit={addSale}
        defaultResponsible={user?.email || 'Administrador'}
      />

      <SaleDetailModal
        open={isDetailOpen}
        sale={selectedSale}
        onClose={closeSaleDetail}
        onDownload={downloadSalePdf}
        onAnnul={annulSale}
        currentUserEmail={user?.email || 'Administrador'}
        statuses={SALE_STATUSES}
      />
    </div>
  );
};

export default SalesPage;
