import { toast } from 'sonner';

const DEFAULT_DURATION = 3800;

export const notifications = {
  success(message, options = {}) {
    toast.success(message, { duration: DEFAULT_DURATION, ...options });
  },

  error(message, options = {}) {
    const safeMessage = message || 'Ocurrio un error inesperado.';
    toast.error(safeMessage, {
      id: options.id || `pixel-error:${safeMessage}`,
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
