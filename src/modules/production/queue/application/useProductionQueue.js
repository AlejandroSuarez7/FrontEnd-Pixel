import { useState } from 'react';
import { useLatestListRequest } from '../../../../core/hooks/useLatestListRequest';
import { productionQueueRepository } from '../infrastructure/productionQueue.repository';

export const useProductionQueue = () => {
  const [savingOrder, setSavingOrder] = useState(false);
  const {
    data: pedidos,
    loading,
    refreshing,
    error,
    refetch: fetchQueue,
  } = useLatestListRequest({
    queryKey: 'production-queue',
    load: (signal) => productionQueueRepository.list({ signal }),
    initialData: [],
  });

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
    refreshing,
    error,
    pedidos,
    refetch: fetchQueue,
    saveOrder,
    savingOrder,
  };
};
