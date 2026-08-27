import { useCallback, useEffect, useRef, useState } from 'react';
import { createPaginationMeta } from '../../../../core/utils/serverPagination';
import { abonoRepository } from '../infrastructure/abono.repository';

const isCanceledRequest = error => error?.code === 'ERR_CANCELED';

export const useAbonos = (filters = {}) => {
  const {
    page = 1,
    limit,
    search = '',
    idCliente = '',
    idPedido = '',
    estado = '',
    metodoPago = '',
    sortBy = 'idAbono',
    order = 'desc',
  } = filters;
  const [abonos, setAbonos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [paginationMeta, setPaginationMeta] = useState(createPaginationMeta());
  const [error, setError] = useState('');
  const hasLoadedRef = useRef(false);
  const mountedRef = useRef(true);
  const requestSequenceRef = useRef(0);
  const activeControllerRef = useRef(null);

  const fetchAbonos = useCallback(async (externalSignal) => {
    if (!mountedRef.current) return;
    activeControllerRef.current?.abort();
    const controller = new AbortController();
    activeControllerRef.current = controller;
    const requestId = ++requestSequenceRef.current;

    if (externalSignal) {
      if (externalSignal.aborted) controller.abort();
      else externalSignal.addEventListener('abort', () => controller.abort(), { once: true });
    }

    if (hasLoadedRef.current) setRefreshing(true);
    else setLoading(true);
    setError('');

    try {
      const result = await abonoRepository.list({
        page,
        limit,
        search,
        idCliente,
        idPedido,
        estado,
        metodoPago,
        sortBy,
        order,
      }, { signal: controller.signal });

      if (!mountedRef.current || controller.signal.aborted || requestId !== requestSequenceRef.current) return;
      setAbonos(result.items);
      setPaginationMeta(result.meta);
      hasLoadedRef.current = true;
    } catch (requestError) {
      if (!mountedRef.current || controller.signal.aborted || isCanceledRequest(requestError) || requestId !== requestSequenceRef.current) return;
      setAbonos([]);
      setPaginationMeta(createPaginationMeta({ page, limit }));
      setError(requestError.message || 'No se pudieron consultar los abonos.');
      hasLoadedRef.current = true;
    } finally {
      if (mountedRef.current && requestId === requestSequenceRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [page, limit, search, idCliente, idPedido, estado, metodoPago, sortBy, order]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => fetchAbonos(controller.signal), 0);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [fetchAbonos]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      activeControllerRef.current?.abort();
    };
  }, []);

  const handleCreate = async (abonoData) => {
    await abonoRepository.create(abonoData);
    await fetchAbonos();
  };

  const handleUpdate = async (idAbono, abonoData) => {
    await abonoRepository.update(idAbono, abonoData);
    await fetchAbonos();
  };

  const handleConfirm = async (idAbono, payload) => {
    const result = await abonoRepository.confirm(idAbono, payload);
    await fetchAbonos();
    return result;
  };

  const handleReject = async (idAbono, motivoRechazo) => {
    await abonoRepository.reject(idAbono, motivoRechazo);
    await fetchAbonos();
  };

  const handleDelete = async (idAbono) => {
    await abonoRepository.remove(idAbono);
    await fetchAbonos();
  };

  const getPedido = useCallback((pedidoId) => abonoRepository.getPedido(pedidoId), []);
  const getAbonosByPedido = useCallback((pedidoId) => abonoRepository.listByPedido(pedidoId), []);
  const getPedidos = useCallback((pedidoFilters) => abonoRepository.listPedidos(pedidoFilters), []);

  return {
    abonos,
    loading,
    refreshing,
    error,
    paginationMeta,
    refetch: fetchAbonos,
    handleCreate,
    handleUpdate,
    handleConfirm,
    handleReject,
    handleDelete,
    getPedido,
    getAbonosByPedido,
    getPedidos,
  };
};
