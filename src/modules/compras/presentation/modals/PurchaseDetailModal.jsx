import { Modal, Descriptions, Table, Tag, Typography, Button, Space } from 'antd';
import { formatCurrency, formatShortDate } from '../../../../core/utils/formatters.js';

const { Paragraph } = Typography;

const PurchaseDetailModal = ({ visible, loading, purchase, onClose, onCancel, onExport }) => {
  const columns = [
    { title: 'Insumo', dataIndex: 'nombreInsumo', key: 'nombreInsumo' },
    { title: 'Categoría', dataIndex: 'categoria', key: 'categoria' },
    { title: 'Cantidad', dataIndex: 'cantidad', key: 'cantidad' },
    { title: 'Unidad', dataIndex: 'unidadMedida', key: 'unidadMedida' },
    { title: 'Precio unitario', dataIndex: 'precioUnitario', key: 'precioUnitario', render: (value) => formatCurrency(value) },
    { title: 'Subtotal', dataIndex: 'subtotal', key: 'subtotal', render: (value) => formatCurrency(value) },
  ];

  return (
    <Modal
      open={visible}
      title={purchase ? `Detalle compra ${purchase.id}` : 'Detalle de compra'}
      width={840}
      onCancel={onClose}
      confirmLoading={loading}
      okText="Exportar PDF"
      onOk={() => purchase && onExport(purchase)}
      cancelText="Cerrar"
      onCancel={onClose}
      footer={purchase ? [
        <Button key="close" onClick={onClose}>
          Cerrar
        </Button>,
        <Button key="export" type="primary" loading={loading} onClick={() => onExport(purchase)}>
          Exportar PDF
        </Button>,
        <Button key="cancel" danger loading={loading} onClick={() => onCancel(purchase.id)}>
          Anular compra
        </Button>,
      ] : null}
    >
      {purchase ? (
        <div>
          <Descriptions column={2} bordered size="small" layout="vertical">
            <Descriptions.Item label="Factura">{purchase.invoiceNumber}</Descriptions.Item>
            <Descriptions.Item label="Proveedor">{purchase.supplier}</Descriptions.Item>
            <Descriptions.Item label="Fecha">{formatShortDate(purchase.purchaseDate)}</Descriptions.Item>
            <Descriptions.Item label="Método pago">{purchase.paymentMethod}</Descriptions.Item>
            <Descriptions.Item label="Estado">
              <Tag color={purchase.status === 'Pagada' ? 'green' : purchase.status === 'Pendiente' ? 'gold' : 'red'}>
                {purchase.status}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Total">{formatCurrency(purchase.total)}</Descriptions.Item>
          </Descriptions>

          <Table
            rowKey="idInsumo"
            dataSource={purchase.items}
            columns={columns}
            pagination={false}
            style={{ marginTop: 24 }}
          />

          <div style={{ marginTop: 24 }}>
            <Paragraph strong>Observaciones</Paragraph>
            <Paragraph>{purchase.notes || 'Sin observaciones'}</Paragraph>
          </div>
        </div>
      ) : (
        <p>No hay datos para mostrar.</p>
      )}
    </Modal>
  );
};

export default PurchaseDetailModal;
