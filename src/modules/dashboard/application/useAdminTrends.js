import { useLatestListRequest } from '../../../core/hooks/useLatestListRequest';
import { dashboardRepository } from '../infrastructure/dashboard.repository';

export const useAdminTrends = (period) => {
  const fechaInicio = period?.fechaInicio || '';
  const fechaFin = period?.fechaFin || '';
  const granularidad = period?.granularidad || 'DIA';
  const queryKey = [fechaInicio, fechaFin, granularidad].join('|');
  const request = useLatestListRequest({
    queryKey,
    load: (signal) => dashboardRepository.getAdminTrends(
      { fechaInicio, fechaFin, granularidad },
      { signal },
    ),
    initialData: null,
  });

  return {
    ...request,
    error: request.error?.message || '',
  };
};
