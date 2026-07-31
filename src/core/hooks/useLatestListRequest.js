import { useCallback, useEffect, useRef, useState } from 'react';

export const isCanceledRequest = (error) => (
  error?.code === 'ERR_CANCELED'
  || error?.name === 'CanceledError'
  || error?.name === 'AbortError'
);

export const useLatestListRequest = ({
  queryKey,
  load,
  initialData,
}) => {
  const loadRef = useRef(load);
  const mountedRef = useRef(true);
  const hasLoadedRef = useRef(false);
  const requestSequenceRef = useRef(0);
  const activeControllerRef = useRef(null);
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadRef.current = load;
  }, [load]);

  const execute = useCallback(async () => {
    activeControllerRef.current?.abort();

    const controller = new AbortController();
    const requestId = ++requestSequenceRef.current;
    activeControllerRef.current = controller;

    setError(null);
    if (hasLoadedRef.current) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const nextData = await loadRef.current(controller.signal);
      if (
        !mountedRef.current
        || controller.signal.aborted
        || requestId !== requestSequenceRef.current
      ) return null;

      setData(nextData);
      hasLoadedRef.current = true;
      return nextData;
    } catch (requestError) {
      if (
        !mountedRef.current
        || controller.signal.aborted
        || isCanceledRequest(requestError)
        || requestId !== requestSequenceRef.current
      ) return null;

      setError(requestError);
      return null;
    } finally {
      if (mountedRef.current && requestId === requestSequenceRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      activeControllerRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(execute, 0);

    return () => {
      window.clearTimeout(timer);
      activeControllerRef.current?.abort();
    };
  }, [execute, queryKey]);

  return {
    data,
    loading,
    refreshing,
    error,
    refetch: execute,
  };
};
