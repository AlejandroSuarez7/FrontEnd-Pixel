import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2/dist/sweetalert2.js';
import 'sweetalert2/dist/sweetalert2.css';
import { SaleApiRepository } from '../../infrastructure/repositories/SaleApiRepository.js';
import { getSalesUseCase } from '../../application/useCases/getSalesUseCase.js';
import { createSaleUseCase } from '../../application/useCases/createSaleUseCase.js';
import { annulSaleUseCase } from '../../application/useCases/annulSaleUseCase.js';
import { getSaleDetailUseCase } from '../../application/useCases/getSaleDetailUseCase.js';
import { generateSalePdf } from '../../application/services/SalePdfService.js';
import { createSale, SALE_STATUSES } from '../../domain/models/saleModel.js';

const SalesContext = createContext();

export const SalesProvider = ({ children }) => {
  const repository = useMemo(() => new SaleApiRepository(), []);
  const [sales, setSales] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [selectedSale, setSelectedSale] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);

  useEffect(() => {
    const loadSales = async () => {
      setIsLoading(true);
      const result = await getSalesUseCase(repository);
      setSales(result);
      setIsLoading(false);
    };

    loadSales();
  }, [repository]);

  const filteredSales = useMemo(() => {
    return sales.filter((sale) => {
      const matchQuery = query
        ? sale.clientName.toLowerCase().includes(query.toLowerCase()) ||
          sale.id.toLowerCase().includes(query.toLowerCase())
        : true;
      const matchStatus = statusFilter ? sale.status === statusFilter : true;
      const matchPayment = paymentFilter ? sale.paymentMethod === paymentFilter : true;
      return matchQuery && matchStatus && matchPayment;
    });
  }, [sales, query, statusFilter, paymentFilter]);

  const openSaleDetail = async (saleId) => {
    const sale = await getSaleDetailUseCase(repository, saleId);
    setSelectedSale(sale);
    setIsDetailOpen(true);
  };

  const closeSaleDetail = () => {
    setSelectedSale(null);
    setIsDetailOpen(false);
  };

  const openSaleForm = () => setIsFormOpen(true);
  const closeSaleForm = () => setIsFormOpen(false);

  const addSale = async (saleData) => {
    const newSale = createSale({
      id: saleData.id,
      id_usuario: saleData.id_usuario,
      id_pedido: saleData.id_pedido,
      created_at: new Date().toISOString(),
      total: saleData.total,
      metodo_pago: saleData.metodo_pago,
      estado: saleData.estado,
    });

    const savedSale = await createSaleUseCase(repository, newSale);
    setSales((prev) => [savedSale, ...prev]);
    closeSaleForm();

    await Swal.fire({
      icon: 'success',
      title: 'Venta creada',
      text: `La venta ${savedSale.id} se ha registrado correctamente.`,
      timer: 2200,
      showConfirmButton: false,
    });
  };
 
  const annulSale = async (saleId, userEmail) => {
  // 1. Pedimos el motivo con SweetAlert
  const { value: motivo, isConfirmed } = await Swal.fire({
    title: '¿Anular venta?',
    text: 'Ingresa el motivo de la anulación para el historial:',
    input: 'text', // Crea un campo de texto
    inputPlaceholder: 'Ej: Error en el precio, Cliente desistió...',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Confirmar Anulación',
    cancelButtonText: 'Cancelar',
    inputValidator: (value) => {
      if (!value) {
        return '¡Es obligatorio poner un motivo!';
      }
    }
  });

  if (!isConfirmed) return null;

  try {
    // 2. Pasamos el ID y el MOTIVO al caso de uso
    // En el backend tu validador espera "motivoAnulacion"
    const updatedSale = await annulSaleUseCase(repository, saleId, motivo);
    
    // 3. Actualizamos el estado local
    setSales((prev) => prev.map((s) => (s.idVenta === saleId ? updatedSale : s)));
    
    await Swal.fire('¡Anulada!', 'La venta y el historial se actualizaron.', 'success');
    return updatedSale;
  } catch (error) {
    Swal.fire('Error', 'No se pudo anular: ' + error.message, 'error');
  }
};

  const downloadSalePdf = (sale) => {
    generateSalePdf(sale);
  };

  return (
    <SalesContext.Provider
      value={{
        sales,
        filteredSales,
        isLoading,
        query,
        statusFilter,
        paymentFilter,
        selectedSale,
        isDetailOpen,
        isFormOpen,
        openSaleDetail,
        closeSaleDetail,
        openSaleForm,
        closeSaleForm,
        setQuery,
        setStatusFilter,
        setPaymentFilter,
        addSale,
        annulSale,
        downloadSalePdf,
        SALE_STATUSES,
      }}
    >
      {children}
    </SalesContext.Provider>
  );
};

export const useSalesContext = () => {
  const context = useContext(SalesContext);
  if (!context) {
    throw new Error('useSalesContext debe usarse dentro de SalesProvider');
  }
  return context;
};
