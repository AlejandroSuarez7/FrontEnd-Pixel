import { Table, Tag, Space, Button, Tooltip } from 'antd';
import { formatCurrency, formatShortDate } from '../../../../core/utils/formatters.js';
import styles from '../styles/PurchasesTable.module.css';

const statusColor = (status) => {
  switch (status) {
    case 'Pagada':
      return 'green';
    case 'Pendiente':
      return 'gold';
    case 'Anulada':
      return 'red';
    default:
      return 'default';
  }
};

const PurchasesTable = ({ purchases, loading, onView, onEdit, onCancel, onExport }) => {
  const columns = [
    {
      title: 'N° Compra',
      dataIndex: 'id',
      key: 'id',
      render: (value) => <strong>{value}</strong>,
    },
    {
      title: 'Factura',
      dataIndex: 'invoiceNumber',
      key: 'invoiceNumber',
    },
    {
      title: 'Proveedor',
      dataIndex: 'supplier',
      key: 'supplier',
    },
    {
      title: 'Fecha',
      dataIndex: 'purchaseDate',
      key: 'purchaseDate',
      render: (value) => formatShortDate(value),
    },
    {
      title: 'Método pago',
      dataIndex: 'paymentMethod',
      key: 'paymentMethod',
    },
    {
      title: 'Estado',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <Tag color={statusColor(status)}>{status}</Tag>,
    },
    {
      title: 'Total',
      dataIndex: 'total',
      key: 'total',
      render: (value) => formatCurrency(value),
    },
    {
      title: 'Acciones',
      key: 'actions',
      render: (_, record) => (
        <Space wrap>
          <Tooltip title="Ver detalle">
            <Button shape="circle" onClick={() => onView(record.id)} />
          </Tooltip>
          <Tooltip title="Editar compra">
            <Button shape="circle" type="primary" onClick={() => onEdit(record.id)} />
          </Tooltip>
          <Tooltip title="Anular compra">
            <Button shape="circle" danger onClick={() => onCancel(record.id)} />
          </Tooltip>
          <Tooltip title="Exportar PDF">
            <Button shape="circle"  onClick={() => onExport(record)} />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <Table
      rowKey="id"
      loading={loading}
      columns={columns}
      dataSource={purchases}
      pagination={{ pageSize: 8 }}
      className={styles.purchaseTable}
    />
  );
};

export default PurchasesTable;
