import { useCallback, useEffect, useState } from 'react';
import { productionQueueRepository } from '../infrastructure/productionQueue.repository';

export const useProductionQueue = () => {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);

  const fetchQueue = useCallback(async () => {
    setLoading(true);
    try {
      const data = await productionQueueRepository.list();
      setPedidos(data);
    } catch (error) {
      console.error('Error al consultar cola de produccion:', error);
      setPedidos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  const saveOrder = async (orderedPedidos) => {
    setSavingOrder(true);
    try {
      await productionQueueRepository.saveOrder(orderedPedidos);
      await fetchQueue();
    } finally {
      setSavingOrder(false);
    }
  };

  return {
    loading,
    pedidos,
    refetch: fetchQueue,
    saveOrder,
    savingOrder,
  };
};
