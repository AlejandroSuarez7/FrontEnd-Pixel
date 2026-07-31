import { useCallback, useEffect, useRef, useState } from 'react';

export const useAsyncLock = () => {
  const [isLocked, setIsLocked] = useState(false);
  const lockRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  const runLocked = useCallback(async (action) => {
    if (lockRef.current) return undefined;

    lockRef.current = true;
    setIsLocked(true);
    try {
      return await action();
    } finally {
      lockRef.current = false;
      if (mountedRef.current) setIsLocked(false);
    }
  }, []);

  return { isLocked, runLocked };
};
