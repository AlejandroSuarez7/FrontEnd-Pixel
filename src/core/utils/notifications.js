import { toast } from 'sonner';

const DEFAULT_DURATION = 3800;

export const notifications = {
  success(message, options = {}) {
    toast.success(message, { duration: DEFAULT_DURATION, ...options });
  },

  error(message, options = {}) {
    toast.error(message || 'Ocurrio un error inesperado.', {
      duration: 5200,
      ...options,
    });
  },

  warning(message, options = {}) {
    toast.warning(message, { duration: DEFAULT_DURATION, ...options });
  },

  info(message, options = {}) {
    toast.info(message, { duration: DEFAULT_DURATION, ...options });
  },
};
