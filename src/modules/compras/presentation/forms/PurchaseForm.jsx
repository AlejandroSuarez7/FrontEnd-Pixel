import { useEffect } from 'react';
import { useFieldArray, Controller } from 'react-hook-form';
import { Row, Col, Form, Input, Select, Button, InputNumber, Divider } from 'antd';
import styles from '../styles/PurchaseForm.module.css';

const PurchaseForm = ({ control, register, errors, statusOptions, paymentMethods, watch, setValue }) => {
  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  useEffect(() => {
    if (!fields.length) {
      append({ idInsumo: '', nombreInsumo: '', categoria: '', cantidad: 1, unidadMedida: 'unidad', precioUnitario: 0, subtotal: 0 });
    }
  }, [append, fields.length]);

  const items = watch('items') || [];

  const updateSubtotal = (index, values) => {
    const cantidad = Number(values.cantidad || 0);
    const precio = Number(values.precioUnitario || 0);
    setValue(`items.${index}.subtotal`, cantidad * precio);
  };

  return (
    <div className={styles.purchaseForm}>
      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Form.Item label="Número de factura" validateStatus={errors.invoiceNumber ? 'error' : ''} help={errors.invoiceNumber?.message}>
            <Input {...register('invoiceNumber', { required: 'Número de factura es obligatorio' })} />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item label="Proveedor" validateStatus={errors.supplier ? 'error' : ''} help={errors.supplier?.message}>
            <Input {...register('supplier', { required: 'Proveedor es obligatorio' })} />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item label="Fecha de compra" validateStatus={errors.purchaseDate ? 'error' : ''} help={errors.purchaseDate?.message}>
            <Input type="date" {...register('purchaseDate', { required: 'Fecha de compra obligatoria' })} />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item label="Método de pago" validateStatus={errors.paymentMethod ? 'error' : ''} help={errors.paymentMethod?.message}>
            <Controller
              name="paymentMethod"
              control={control}
              rules={{ required: 'Método de pago obligatorio' }}
              render={({ field }) => (
                <Select {...field} placeholder="Seleccionar método">
                  {paymentMethods.map((method) => (
                    <Select.Option key={method} value={method}>
                      {method}
                    </Select.Option>
                  ))}
                </Select>
              )}
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item label="Estado" validateStatus={errors.status ? 'error' : ''} help={errors.status?.message}>
            <Controller
              name="status"
              control={control}
              rules={{ required: 'Estado obligatorio' }}
              render={({ field }) => (
                <Select {...field} placeholder="Seleccionar estado">
                  {statusOptions.map((status) => (
                    <Select.Option key={status} value={status}>
                      {status}
                    </Select.Option>
                  ))}
                </Select>
              )}
            />
          </Form.Item>
        </Col>
      </Row>

      <Divider orientation="left">Insumos</Divider>

      {fields.map((field, index) => (
        <div key={field.id} className={styles.itemRow}>
          <Row gutter={16} align="middle">
            <Col xs={24} md={6}>
              <Form.Item label="Nombre insumo">
                <Input {...register(`items.${index}.nombreInsumo`, { required: true })} />
              </Form.Item>
            </Col>
            <Col xs={24} md={5}>
              <Form.Item label="Categoría">
                <Input {...register(`items.${index}.categoria`, { required: true })} />
              </Form.Item>
            </Col>
            <Col xs={24} md={4}>
              <Form.Item label="Cantidad">
                <Controller
                  name={`items.${index}.cantidad`}
                  control={control}
                  render={({ field }) => (
                    <InputNumber
                      {...field}
                      min={1}
                      style={{ width: '100%' }}
                      onChange={(value) => {
                        field.onChange(value);
                        updateSubtotal(index, { ...items[index], cantidad: value });
                      }}
                    />
                  )}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={4}>
              <Form.Item label="Unidad">
                <Input {...register(`items.${index}.unidadMedida`)} />
              </Form.Item>
            </Col>
            <Col xs={24} md={4}>
              <Form.Item label="Precio unitario">
                <Controller
                  name={`items.${index}.precioUnitario`}
                  control={control}
                  render={({ field }) => (
                    <InputNumber
                      {...field}
                      min={0}
                      style={{ width: '100%' }}
                      formatter={(value) => `$ ${value}`}
                      parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
                      onChange={(value) => {
                        field.onChange(value);
                        updateSubtotal(index, { ...items[index], precioUnitario: value });
                      }}
                    />
                  )}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={3}>
              <Form.Item label="Subtotal">
                <InputNumber value={items[index]?.subtotal || 0} readOnly style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={2}>
              <Button type="text" danger  onClick={() => remove(index)} />
            </Col>
          </Row>
        </div>
      ))}

      <Button type="dashed" block onClick={() => append({ idInsumo: '', nombreInsumo: '', categoria: '', cantidad: 1, unidadMedida: 'unidad', precioUnitario: 0, subtotal: 0 })}>
        Agregar insumo
      </Button>

      <Divider orientation="left">Notas</Divider>
      <Form.Item label="Observaciones">
        <Input.TextArea {...register('notes')} rows={4} />
      </Form.Item>
    </div>
  );
};

export default PurchaseForm;
