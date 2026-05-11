import { Card, Statistic, Row, Col } from 'antd';
import { formatCurrency } from '../../../../core/utils/formatters.js';
import styles from '../styles/PurchasesSummaryCards.module.css';

const PurchasesSummaryCards = ({ purchases, loading }) => {
  const totals = purchases.reduce(
    (acc, purchase) => {
      acc.total += purchase.total;
      if (purchase.status === 'Pagada') acc.paid += 1;
      if (purchase.status === 'Pendiente') acc.pending += 1;
      if (purchase.status === 'Anulada') acc.canceled += 1;
      return acc;
    },
    { total: 0, paid: 0, pending: 0, canceled: 0 }
  );

  return (
    <div className={styles.summaryGrid}>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={12}>
          <Card bordered={false} className={styles.summaryCard} loading={loading}>
            <Statistic title="Total Compras" value={formatCurrency(totals.total)} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={12}>
          <Card bordered={false} className={styles.summaryCard} loading={loading}>
            <Statistic title="Compras Pagadas" value={totals.paid} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={12}>
          <Card bordered={false} className={styles.summaryCard} loading={loading}>
            <Statistic title="Pendientes" value={totals.pending} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={12}>
          <Card bordered={false} className={styles.summaryCard} loading={loading}>
            <Statistic title="Anuladas" value={totals.canceled} />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default PurchasesSummaryCards;
