import { Modal, Form } from 'antd';
import { useForm } from 'react-hook-form';
import PurchaseForm from '../forms/PurchaseForm.jsx';
import { buildPurchaseEntity } from '../../domain/models/PurchaseModel.js';

const PurchaseEditorModal = ({ visible, loading, mode, purchase, statusOptions, paymentMethods, onClose, onSave }) => {
  const { control, register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      invoiceNumber: '',
      supplier: '',
      purchaseDate: new Date().toISOString().split('T')[0],
      paymentMethod: paymentMethods[0],
      status: statusOptions[0],
      items: [],
      notes: '',
    },
  });

  const initializeForm = () => {
    if (purchase) {
      reset({
        invoiceNumber: purchase.invoiceNumber,
        supplier: purchase.supplier,
        purchaseDate: purchase.purchaseDate,
        paymentMethod: purchase.paymentMethod,
        status: purchase.status,
        items: purchase.items,
        notes: purchase.notes,
      });
    } else {
      reset({
        invoiceNumber: '',
        supplier: '',
        purchaseDate: new Date().toISOString().split('T')[0],
        paymentMethod: paymentMethods[0],
        status: statusOptions[0],
        items: [],
        notes: '',
      });
    }
  };

  return (
    <Modal
      open={visible}
      title={mode === 'create' ? 'Nueva compra' : `Editar compra ${purchase?.id}`}
      width={900}
      onCancel={onClose}
      okText={mode === 'create' ? 'Registrar compra' : 'Actualizar compra'}
      confirmLoading={loading}
      onOk={handleSubmit((values) => {
        const entity = buildPurchaseEntity({
          ...purchase,
          ...values,
        });
        onSave(entity);
      })}
      afterOpenChange={(open) => {
        if (open) initializeForm();
      }}
    >
      <Form layout="vertical">
        <PurchaseForm
          control={control}
          register={register}
          errors={errors}
          statusOptions={statusOptions}
          paymentMethods={paymentMethods}
          watch={watch}
          setValue={setValue}
        />
      </Form>
    </Modal>
  );
};

export default PurchaseEditorModal;
