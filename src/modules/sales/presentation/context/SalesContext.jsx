import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2/dist/sweetalert2.js';
import 'sweetalert2/dist/sweetalert2.css';
import { SaleLocalStorageRepository } from '../../infrastructure/repositories/SaleLocalStorageRepository.js';
import { getSalesUseCase } from '../../application/useCases/getSalesUseCase.js';
import { createSaleUseCase } from '../../application/useCases/createSaleUseCase.js';
import { annulSaleUseCase } from '../../application/useCases/annulSaleUseCase.js';
import { getSaleDetailUseCase } from '../../application/useCases/getSaleDetailUseCase.js';
import { generateSalePdf } from '../../application/services/SalePdfService.js';
import { createSale, SALE_STATUSES } from '../../domain/models/saleModel.js';

const SalesContext = createContext();

export const SalesProvider = ({ children }) => {
  const repository = useMemo(() => new SaleLocalStorageRepository(), []);
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
      id: `VTA-${new Date().getTime()}`,
      clientName: saleData.clientName,
      saleDate: new Date().toISOString(),
      paymentMethod: saleData.paymentMethod,
      status: saleData.status,
      items: saleData.items,
      observations: saleData.observations,
      responsible: saleData.responsible,
      history: [
        {
          when: new Date().toISOString(),
          action: 'Venta creada',
          by: saleData.responsible,
        },
      ],
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
    const confirmation = await Swal.fire({
      title: '¿Anular venta?',
      text: 'La venta no se eliminará, solo cambiará a estado anulada.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, anular',
      cancelButtonText: 'Cancelar',
    });

    if (!confirmation.isConfirmed) {
      return null;
    }

    const updatedSale = await annulSaleUseCase(repository, saleId, userEmail);
    setSales((prev) => prev.map((sale) => (sale.id === saleId ? updatedSale : sale)));
    if (selectedSale?.id === saleId) {
      setSelectedSale(updatedSale);
    }

    await Swal.fire({
      icon: 'success',
      title: 'Venta anulada',
      text: `La venta ${saleId} ahora tiene estado ${SALE_STATUSES.CANCELED}.`,
      timer: 2000,
      showConfirmButton: false,
    });

    return updatedSale;
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
