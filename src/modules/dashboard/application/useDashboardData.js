import { useLatestListRequest } from '../../../core/hooks/useLatestListRequest';
import { dashboardRepository } from '../infrastructure/dashboard.repository';

const getStoredUser = () => {
  try {
    const raw = localStorage.getItem('pixel_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const useDashboardData = (user, permissions = [], refreshKey = 0) => {
  const permissionsKey = permissions.join('|');
  const sessionUser = user || getStoredUser();
  const queryKey = [
    sessionUser?.idUsuario || sessionUser?.id || sessionUser?.correo || 'no-session',
    permissionsKey,
    refreshKey,
  ].join('|');
  const {
    data,
    loading,
    refreshing,
    error,
    refetch,
  } = useLatestListRequest({
    queryKey,
    load: (signal) => {
      if (!sessionUser) {
        throw new Error('No hay una sesion activa para cargar el dashboard.');
      }

      const dashboardPermissions = permissionsKey ? permissionsKey.split('|') : [];
      return dashboardRepository.getDashboardData(sessionUser, dashboardPermissions, { signal });
    },
    initialData: null,
  });

  return {
    data,
    loading,
    refreshing,
    error: error?.message || '',
    refetch,
  };
};
