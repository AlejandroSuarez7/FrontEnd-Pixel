import { useEffect, useState } from 'react';
import { dashboardRepository } from '../infrastructure/dashboard.repository';

const getStoredUser = () => {
  try {
    const raw = localStorage.getItem('pixel_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const useDashboardData = (user, permissions = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const permissionsKey = permissions.join('|');

  useEffect(() => {
    let isMounted = true;

    const loadDashboard = async () => {
      setLoading(true);
      setError('');

      try {
        const sessionUser = user || getStoredUser();

        if (!sessionUser) {
          setData(null);
          setError('No hay una sesion activa para cargar el dashboard.');
          return;
        }

        const dashboardPermissions = permissionsKey ? permissionsKey.split('|') : [];
        const dashboardData = await dashboardRepository.getDashboardData(sessionUser, dashboardPermissions);
        if (isMounted) setData(dashboardData);
      } catch (requestError) {
        console.error('Error al cargar datos del dashboard:', requestError);
        if (isMounted) {
          setData(null);
          setError(requestError.message || 'No se pudo cargar el dashboard.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, [user, permissionsKey]);

  return { data, loading, error };
};
