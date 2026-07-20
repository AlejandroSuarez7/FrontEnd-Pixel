import { useCallback, useRef, useState } from 'react';

export const useAsyncLock = () => {
  const [isLocked, setIsLocked] = useState(false);
  const lockRef = useRef(false);

  const runLocked = useCallback(async (action) => {
    if (lockRef.current) return undefined;

    lockRef.current = true;
    setIsLocked(true);
    try {
      return await action();
    } finally {
      lockRef.current = false;
      setIsLocked(false);
    }
  }, []);

  return { isLocked, runLocked };
};
