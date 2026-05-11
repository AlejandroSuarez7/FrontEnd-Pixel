import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { notification } from 'antd';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';
import { PurchaseLocalStorageRepository } from '../../infrastructure/repositories/PurchaseLocalStorageRepository.js';
import {
  listPurchasesUseCase,
  getPurchaseByIdUseCase,
  createPurchaseUseCase,
  updatePurchaseUseCase,
  cancelPurchaseUseCase,
  exportPurchasePdfUseCase,
} from '../../application/useCases/purchaseUseCases.js';
import { useDebounce } from '../../../../core/hooks/useDebounce.js';

const PurchasesContext = createContext();
const repository = new PurchaseLocalStorageRepository();

export const PurchasesProvider = ({ children }) => {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filters, setFilters] = useState({ search: '', status: '', dateRange: [] });
  const [editorOpen, setEditorOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [formMode, setFormMode] = useState('create');
  const [editingPurchase, setEditingPurchase] = useState(null);

  const debouncedSearch = useDebounce(filters.search, 400);

  const loadPurchases = async () => {
    setLoading(true);
    try {
      const items = await listPurchasesUseCase(repository, filters);
      setPurchases(items);
    } catch (error) {
      notification.error({ message: 'Error cargando compras', description: error.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPurchases();
  }, [debouncedSearch, filters.status, filters.dateRange]);

  const handleChangeFilters = (payload) => {
    setFilters((current) => ({ ...current, ...payload }));
  };

  const resetFilters = () => {
    setFilters({ search: '', status: '', dateRange: [] });
  };

  const openNewPurchase = () => {
    setFormMode('create');
    setEditingPurchase(null);
    setEditorOpen(true);
  };

  const openEditPurchase = async (id) => {
    setSubmitting(true);
    try {
      const purchase = await getPurchaseByIdUseCase(repository, id);
      setEditingPurchase(purchase);
      setFormMode('edit');
      setEditorOpen(true);
    } catch (error) {
      notification.error({ message: 'Error cargando compra', description: error.message });
    } finally {
      setSubmitting(false);
    }
  };

  const closeEditor = () => {
    setEditorOpen(false);
    setEditingPurchase(null);
  };

  const openPurchaseDetail = async (id) => {
    setSubmitting(true);
    try {
      const purchase = await getPurchaseByIdUseCase(repository, id);
      setSelectedPurchase(purchase);
      setDetailOpen(true);
    } catch (error) {
      notification.error({ message: 'Error cargando detalle', description: error.message });
    } finally {
      setSubmitting(false);
    }
  };

  const closePurchaseDetail = () => {
    setDetailOpen(false);
    setSelectedPurchase(null);
  };

  const savePurchase = async (purchaseData) => {
    setSubmitting(true);
    try {
      if (formMode === 'create') {
        await createPurchaseUseCase(repository, purchaseData);
        notification.success({ message: 'Compra creada', description: 'La compra se registró correctamente.' });
      } else {
        await updatePurchaseUseCase(repository, editingPurchase.id, purchaseData);
        notification.success({ message: 'Compra actualizada', description: 'Los cambios se guardaron correctamente.' });
      }
      closeEditor();
      loadPurchases();
    } catch (error) {
      notification.error({ message: 'Error guardando compra', description: error.message });
    } finally {
      setSubmitting(false);
    }
  };

  const confirmCancelPurchase = async (id) => {
    const result = await Swal.fire({
      title: '¿Deseas anular esta compra?',
      text: 'La compra quedará registrada como anulada y no se eliminará.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, anular',
      cancelButtonText: 'Cancelar',
    });

    if (!result.isConfirmed) return;

    setSubmitting(true);
    try {
      await cancelPurchaseUseCase(repository, id, 'Anulación administrativa');
      notification.success({ message: 'Compra anulada', description: 'El estado se actualizó correctamente.' });
      loadPurchases();
      closePurchaseDetail();
    } catch (error) {
      notification.error({ message: 'Error al anular', description: error.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleExport = async (purchase) => {
    setSubmitting(true);
    try {
      const { blob, fileName } = await exportPurchasePdfUseCase(purchase);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      notification.success({ message: 'PDF generado', description: 'Se descargó el comprobante correctamente.' });
    } catch (error) {
      notification.error({ message: 'Error exportando PDF', description: error.message });
    } finally {
      setSubmitting(false);
    }
  };

  const value = useMemo(
    () => ({
      purchases,
      loading,
      submitting,
      filters,
      editorOpen,
      detailOpen,
      selectedPurchase,
      formMode,
      editingPurchase,
      statusOptions: ['Pendiente', 'Pagada', 'Anulada'],
      paymentMethods: ['Efectivo', 'Transferencia', 'Nequi', 'Daviplata'],
      handleChangeFilters,
      resetFilters,
      openNewPurchase,
      openEditPurchase,
      closeEditor,
      openPurchaseDetail,
      closePurchaseDetail,
      savePurchase,
      confirmCancelPurchase,
      handleExport,
      loadPurchases,
    }),
    [purchases, loading, submitting, filters, editorOpen, detailOpen, selectedPurchase, formMode, editingPurchase]
  );

  return <PurchasesContext.Provider value={value}>{children}</PurchasesContext.Provider>;
};

export const usePurchasesContext = () => {
  const context = useContext(PurchasesContext);
  if (!context) throw new Error('usePurchasesContext debe usarse dentro de PurchasesProvider');
  return context;
};
