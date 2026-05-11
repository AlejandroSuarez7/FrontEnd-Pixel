import { Row, Col, Input, Select, Button, DatePicker, Space } from 'antd';
import styles from '../styles/PurchasesFilters.module.css';

const { RangePicker } = DatePicker;

const PurchasesFilters = ({ filters, statusOptions, onChangeFilters, onResetFilters }) => {
  return (
    <div className={styles.filtersPanel}>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <label className={styles.label}>Buscar</label>
          <Input
            value={filters.search}
            placeholder="Factura o proveedor"
            onChange={(e) => onChangeFilters({ search: e.target.value })}
            allowClear
          />
        </Col>
        <Col xs={24} md={8}>
          <label className={styles.label}>Estado</label>
          <Select
            value={filters.status}
            placeholder="Todos los estados"
            allowClear
            onChange={(value) => onChangeFilters({ status: value || '' })}
            style={{ width: '100%' }}
          >
            {statusOptions.map((status) => (
              <Select.Option key={status} value={status}>
                {status}
              </Select.Option>
            ))}
          </Select>
        </Col>
        <Col xs={24} md={8}>
          <label className={styles.label}>Rango de fechas</label>
          <RangePicker
            value={filters.dateRange}
            onChange={(value) => onChangeFilters({ dateRange: value || [] })}
            style={{ width: '100%' }}
          />
        </Col>
      </Row>

      <Space className={styles.actions}>
        <Button type="default" onClick={onResetFilters}>
          Limpiar filtros
        </Button>
      </Space>
    </div>
  );
};

export default PurchasesFilters;
