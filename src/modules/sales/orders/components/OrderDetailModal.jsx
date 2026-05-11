import { Modal, Descriptions, Tag, Button, Space, Popconfirm } from 'antd';
import { FilePdfOutlined, StopOutlined } from '@ant-design/icons';
import { getStatusBadgeProps } from '../utils/orderUtils.js';

const OrderDetailModal = ({ visible, loading, order, onClose, onCancel, onExport }) => {
  const statusProps = order ? getStatusBadgeProps(order.status) : { color: 'default', label: '' };

  return (
    <Modal
      open={visible}
      title={order ? `Pedido #${order.orderNumber}` : 'Detalle de pedido'}
      onCancel={onClose}
      footer={
        order && [
          <Button key="export" icon={<FilePdfOutlined />} onClick={() => onExport(order)}>
            Exportar PDF
          </Button>,
          <Popconfirm
            key="cancel"
            title="¿Deseas anular este pedido?"
            okText="Sí"
            cancelText="No"
            onConfirm={() => onCancel(order.orderNumber, 'Anulación administrativa')}
          >
            <Button danger loading={loading} icon={<StopOutlined />}>
              Anular pedido
            </Button>
          </Popconfirm>,
        ]
      }
      width={640}
    >
      {order ? (
        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label="Cliente">{order.clientName}</Descriptions.Item>
          <Descriptions.Item label="Email">{order.email}</Descriptions.Item>
          <Descriptions.Item label="Fecha">{order.createdAt}</Descriptions.Item>
          <Descriptions.Item label="Estado">
            <Tag color={statusProps.color}>{statusProps.label}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Total">${order.total.toFixed(2)}</Descriptions.Item>
          <Descriptions.Item label="Observaciones">{order.notes || 'Sin observaciones'}</Descriptions.Item>
        </Descriptions>
      ) : (
        <p>No hay datos para mostrar.</p>
      )}
    </Modal>
  );
};

export default OrderDetailModal;
