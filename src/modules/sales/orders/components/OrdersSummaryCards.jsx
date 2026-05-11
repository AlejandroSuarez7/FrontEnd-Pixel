import { Card, Statistic, Row, Col } from 'antd';
import styles from '../styles/OrdersSummaryCards.module.css';

const OrdersSummaryCards = ({ orders, loading }) => {
  const totals = orders.reduce(
    (acc, order) => {
      acc.total += order.total;
      if (order.status === 'Aceptado') acc.accepted += 1;
      if (order.status === 'Pendiente') acc.pending += 1;
      if (order.status === 'Cancelado') acc.cancelled += 1;
      return acc;
    },
    { total: 0, accepted: 0, pending: 0, cancelled: 0 }
  );

  return (
    <div className={styles.summaryCards}>
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card loading={loading} bordered={false} className={styles.summaryCard}>
            <Statistic title="Total facturación" value={totals.total} precision={2} prefix="$" />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card loading={loading} bordered={false} className={styles.summaryCard}>
            <Statistic title="Aceptados" value={totals.accepted} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card loading={loading} bordered={false} className={styles.summaryCard}>
            <Statistic title="Pendientes" value={totals.pending} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card loading={loading} bordered={false} className={styles.summaryCard}>
            <Statistic title="Cancelados" value={totals.cancelled} />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default OrdersSummaryCards;
