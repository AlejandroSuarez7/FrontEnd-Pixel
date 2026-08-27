import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export const hasUsefulNavigationHistory = (locationKey, historyIndex) => (
  Boolean(locationKey && locationKey !== 'default')
  && Number.isInteger(historyIndex)
  && historyIndex > 0
);

export const useContextualBack = (fallbackPath) => {
  const navigate = useNavigate();
  const location = useLocation();

  return useCallback(() => {
    const historyIndex = typeof window !== 'undefined'
      ? window.history.state?.idx
      : null;

    if (hasUsefulNavigationHistory(location.key, historyIndex)) {
      navigate(-1);
      return;
    }

    navigate(fallbackPath, { replace: true });
  }, [fallbackPath, location.key, navigate]);
};
