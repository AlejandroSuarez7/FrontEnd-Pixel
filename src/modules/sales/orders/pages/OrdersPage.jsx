import { Row, Col, Card, Button, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useOrders } from '../hooks/useOrders.js';
import OrdersFilters from '../components/OrdersFilters.jsx';
import OrdersSummaryCards from '../components/OrdersSummaryCards.jsx';
import OrdersTable from '../components/OrdersTable.jsx';
import OrderDrawerForm from '../components/OrderDrawerForm.jsx';
import OrderModalForm from '../components/OrderModalForm.jsx';
import OrderDetailModal from '../components/OrderDetailModal.jsx';
import styles from '../styles/OrdersPage.module.css';

const { Title, Text } = Typography;

const OrdersPage = () => {
  const {
    orders,
    loading,
    submitting,
    filters,
    drawerOpen,
    modalOpen,
    detailOpen,
    selectedOrder,
    formMode,
    editingOrder,
    statusOptions,
    handleChangeFilters,
    handleResetFilters,
    openNewOrderDrawer,
    closeOrderDrawer,
    openEditOrderModal,
    closeOrderModal,
    openOrderDetail,
    closeOrderDetail,
    createOrder,
    updateOrder,
    cancelOrder,
    exportOrder,
  } = useOrders();

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <div>
          <Title level={3} style={{ margin: 0 }}>
            Gestión de Pedidos
          </Title>
          <Text type="secondary">Administra pedidos, controla estados y visualiza detalles en tiempo real.</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openNewOrderDrawer}>
          Nuevo pedido
        </Button>
      </div>

      <Card className={styles.contentCard} bordered={false}>
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={8}>
            <OrdersSummaryCards orders={orders} loading={loading} />
          </Col>
          <Col xs={24} lg={16}>
            <OrdersFilters
              filters={filters}
              statusOptions={statusOptions}
              onChangeFilters={handleChangeFilters}
              onResetFilters={handleResetFilters}
            />
          </Col>
        </Row>
      </Card>

      <Card className={styles.tableCard} bordered={false}>
        <OrdersTable
          orders={orders}
          loading={loading}
          onView={openOrderDetail}
          onEdit={openEditOrderModal}
          onCancel={cancelOrder}
          onExport={exportOrder}
        />
      </Card>

      <OrderDrawerForm
        visible={drawerOpen}
        loading={submitting}
        mode={formMode}
        order={editingOrder}
        statusOptions={statusOptions}
        onClose={closeOrderDrawer}
        onCreate={createOrder}
        onUpdate={updateOrder}
      />

      <OrderModalForm
        visible={modalOpen}
        loading={submitting}
        mode={formMode}
        order={editingOrder}
        statusOptions={statusOptions}
        onClose={closeOrderModal}
        onCreate={createOrder}
        onUpdate={updateOrder}
      />

      <OrderDetailModal
        visible={detailOpen}
        loading={submitting}
        order={selectedOrder}
        onClose={closeOrderDetail}
        onCancel={cancelOrder}
        onExport={exportOrder}
      />
    </div>
  );
};

export default OrdersPage;
