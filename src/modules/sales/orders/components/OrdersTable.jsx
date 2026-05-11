import { Table, Tag, Space, Button, Popconfirm } from 'antd';
import { EyeOutlined, EditOutlined, FilePdfOutlined, StopOutlined } from '@ant-design/icons';
import { getStatusBadgeProps } from '../utils/orderUtils.js';

const OrdersTable = ({ orders, loading, onView, onEdit, onCancel, onExport }) => {
  const columns = [
    {
      title: 'Pedido',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      render: (value) => `#${value}`,
    },
    {
      title: 'Cliente',
      dataIndex: 'clientName',
      key: 'clientName',
    },
    {
      title: 'Fecha',
      dataIndex: 'createdAt',
      key: 'createdAt',
    },
    {
      title: 'Estado',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const { color, label } = getStatusBadgeProps(status);
        return <Tag color={color}>{label}</Tag>;
      },
    },
    {
      title: 'Total',
      dataIndex: 'total',
      key: 'total',
      render: (value) => `$${value.toFixed(2)}`,
    },
    {
      title: 'Acciones',
      key: 'actions',
      render: (_, record) => (
        <Space wrap>
          <Button icon={<EyeOutlined />} type="default" onClick={() => onView(record.orderNumber)}>
            Ver
          </Button>
          <Button icon={<EditOutlined />} type="primary" onClick={() => onEdit(record.orderNumber)}>
            Editar
          </Button>
          <Popconfirm
            title="¿Deseas anular este pedido?"
            okText="Sí"
            cancelText="No"
            onConfirm={() => onCancel(record.orderNumber, 'Solicitud de cliente')}
          >
            <Button danger icon={<StopOutlined />}>
              Anular
            </Button>
          </Popconfirm>
          <Button icon={<FilePdfOutlined />} onClick={() => onExport(record)}>
            Exportar
          </Button>
        </Space>
      ),
    },
  ];

  return <Table rowKey="orderNumber" loading={loading} columns={columns} dataSource={orders} pagination={{ pageSize: 8 }} />;
};

export default OrdersTable;
