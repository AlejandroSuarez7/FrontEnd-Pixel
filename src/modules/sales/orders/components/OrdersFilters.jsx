import { Row, Col, Input, Select, Button, DatePicker, Space } from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import styles from '../styles/OrdersFilters.module.css';

const { RangePicker } = DatePicker;

const OrdersFilters = ({ filters, statusOptions, onChangeFilters, onResetFilters }) => {
  return (
    <div className={styles.filterCard}>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={8}>
          <label className={styles.label}>Buscar</label>
          <Input
            value={filters.search}
            prefix={<SearchOutlined />}
            placeholder="Número o cliente"
            onChange={(e) => onChangeFilters({ search: e.target.value })}
            allowClear
          />
        </Col>
        <Col xs={24} sm={12} md={8}>
          <label className={styles.label}>Estado</label>
          <Select
            value={filters.status}
            placeholder="Todos"
            allowClear
            onChange={(value) => onChangeFilters({ status: value || '' })}
          >
            {statusOptions.map((status) => (
              <Select.Option key={status} value={status}>
                {status}
              </Select.Option>
            ))}
          </Select>
        </Col>
        <Col xs={24} sm={24} md={8}>
          <label className={styles.label}>Rango de fechas</label>
          <RangePicker
            value={filters.dateRange}
            onChange={(value) => onChangeFilters({ dateRange: value || [] })}
            style={{ width: '100%' }}
          />
        </Col>
      </Row>

      <Space className={styles.actions}>
        <Button icon={<ReloadOutlined />} onClick={onResetFilters}>
          Limpiar filtros
        </Button>
      </Space>
    </div>
  );
};

export default OrdersFilters;
