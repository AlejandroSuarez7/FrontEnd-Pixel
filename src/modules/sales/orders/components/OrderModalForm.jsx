import { Modal, Form, Input, Select, Button, Row, Col, InputNumber } from 'antd';
import { useEffect } from 'react';

const OrderModalForm = ({ visible, loading, mode, order, statusOptions, onClose, onCreate, onUpdate }) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (visible) {
      form.setFieldsValue({
        clientName: order?.clientName || '',
        email: order?.email || '',
        status: order?.status || '',
        total: order?.total || 0,
        notes: order?.notes || '',
      });
    }
  }, [visible, order, form]);

  const handleSubmit = async () => {
    const values = await form.validateFields();
    if (mode === 'create') {
      await onCreate(values);
    } else {
      await onUpdate(order.orderNumber, values);
    }
  };

  return (
    <Modal
      open={visible}
      title={mode === 'create' ? 'Nuevo pedido' : `Editar pedido #${order?.orderNumber}`}
      onCancel={onClose}
      footer={
        [
          <Button key="cancel" onClick={onClose}>
            Cancelar
          </Button>,
          <Button key="submit" type="primary" loading={loading} onClick={handleSubmit}>
            {mode === 'create' ? 'Guardar pedido' : 'Guardar cambios'}
          </Button>,
        ]
      }
    >
      <Form layout="vertical" form={form} initialValues={{ status: 'Pendiente', total: 0 }}>
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              label="Cliente"
              name="clientName"
              rules={[{ required: true, message: 'Ingrese el nombre del cliente' }]}
            >
              <Input placeholder="Nombre del cliente" />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item
              label="Email"
              name="email"
              rules={[{ required: true, type: 'email', message: 'Ingrese un email válido' }]}
            >
              <Input placeholder="cliente@empresa.com" />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item label="Estado" name="status" rules={[{ required: true, message: 'Seleccione un estado' }]}> 
              <Select placeholder="Seleccionar estado">
                {statusOptions.map((status) => (
                  <Select.Option key={status} value={status}>
                    {status}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item
              label="Total"
              name="total"
              rules={[{ required: true, message: 'Ingrese el total del pedido' }]}
            >
              <InputNumber style={{ width: '100%' }} min={0} formatter={(value) => `$ ${value}`} parser={(value) => value.replace(/\$\s?|(,*)/g, '')} />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item label="Observaciones" name="notes">
              <Input.TextArea rows={4} placeholder="Comentarios sobre el pedido" />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

export default OrderModalForm;
