import { Row, Col, Card, Button, Typography } from 'antd';
import { usePurchases } from '../hooks/usePurchases.js';
import PurchasesFilters from '../components/PurchasesFilters.jsx';
import PurchasesSummaryCards from '../components/PurchasesSummaryCards.jsx';
import PurchasesTable from '../components/PurchasesTable.jsx';
import PurchaseEditorModal from '../modals/PurchaseEditorModal.jsx';
import PurchaseDetailModal from '../modals/PurchaseDetailModal.jsx';
import styles from '../styles/PurchasesPage.module.css';

const { Title, Text } = Typography;

const PurchasesPage = () => {
  const {
    purchases,
    loading,
    submitting,
    filters,
    editorOpen,
    detailOpen,
    selectedPurchase,
    formMode,
    editingPurchase,
    statusOptions,
    paymentMethods,
    handleChangeFilters,
    resetFilters,
    openNewPurchase,
    closeEditor,
    openEditPurchase,
    openPurchaseDetail,
    closePurchaseDetail,
    savePurchase,
    confirmCancelPurchase,
    handleExport,
  } = usePurchases();

  return (
    <div className={styles.pageContainer}>
      <div className={styles.toolbar}>
        <div>
          <Title level={3} style={{ margin: 0 }}>
            Gestión de Compras
          </Title>
          <Text type="secondary">Control administrativo de compras de insumos y materiales.</Text>
        </div>
        <Button type="primary" onClick={openNewPurchase}>
          Nueva compra
        </Button>
      </div>

      <Card className={styles.summaryCard} bordered={false}>
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={8}>
            <PurchasesSummaryCards purchases={purchases} loading={loading} />
          </Col>
          <Col xs={24} lg={16}>
            <PurchasesFilters
              filters={filters}
              statusOptions={statusOptions}
              onChangeFilters={handleChangeFilters}
              onResetFilters={resetFilters}
            />
          </Col>
        </Row>
      </Card>

      <Card className={styles.tableCard} bordered={false}>
        <PurchasesTable
          purchases={purchases}
          loading={loading}
          onView={openPurchaseDetail}
          onEdit={openEditPurchase}
          onCancel={confirmCancelPurchase}
          onExport={handleExport}
        />
      </Card>

      <PurchaseEditorModal
        visible={editorOpen}
        loading={submitting}
        mode={formMode}
        purchase={editingPurchase}
        statusOptions={statusOptions}
        paymentMethods={paymentMethods}
        onClose={closeEditor}
        onSave={savePurchase}
      />

      <PurchaseDetailModal
        visible={detailOpen}
        loading={submitting}
        purchase={selectedPurchase}
        onClose={closePurchaseDetail}
        onCancel={confirmCancelPurchase}
        onExport={handleExport}
      />
    </div>
  );
};

export default PurchasesPage;
