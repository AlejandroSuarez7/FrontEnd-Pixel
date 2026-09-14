import { useCallback, useEffect, useRef, useState } from 'react';
import { useAsyncLock } from '../../../core/hooks/useAsyncLock.js';
import { notifications } from '../../../core/utils/notifications.js';
import { DeletionImpactModal } from '../DeletionImpactModal/DeletionImpactModal.jsx';
import { safeDeleteRepository } from './safeDelete.repository.js';

const IMPACT_FAILURE_MESSAGE = 'No pudimos verificar qué información se verá afectada. Por seguridad, la eliminación fue cancelada.';

const getErrorStatus = (error) => error?.status ?? error?.response?.status;

const getImpactErrorDetail = (error) => {
  const status = getErrorStatus(error);
  if (status === 403) return 'No tienes permiso para realizar esta acción.';
  if (status === 404) return 'El registro ya no existe.';
  if (!error?.response || error?.isNetworkError) return 'No pudimos conectarnos con el servidor.';
  return '';
};

const getDeleteErrorMessage = (error) => {
  const status = getErrorStatus(error);
  if (status === 403) return 'No tienes permiso para realizar esta acción.';
  if (status === 404) return 'El registro ya no existe.';
  if (status === 409) return error?.message || 'El registro no puede eliminarse en su estado actual.';
  return 'No pudimos completar la eliminación. Intenta nuevamente.';
};

export const SafeDeleteModal = ({
  isOpen,
  entityLabel,
  entityName,
  impactEndpoint,
  deleteAction,
  onDeleted,
  onClose,
  successMessage,
  indirectWarning,
}) => {
  const [stage, setStage] = useState('impact');
  const [impact, setImpact] = useState(null);
  const [impactError, setImpactError] = useState('');
  const [impactErrorDetail, setImpactErrorDetail] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const impactControllerRef = useRef(null);
  const { isLocked: loadingImpact, runLocked: runImpactLocked } = useAsyncLock();
  const { isLocked: deleting, runLocked: runDeleteLocked } = useAsyncLock();

  const loadImpact = useCallback(async () => {
    if (!isOpen || !impactEndpoint) return;

    impactControllerRef.current?.abort();
    const controller = new AbortController();
    impactControllerRef.current = controller;
    setImpact(null);
    setImpactError('');
    setImpactErrorDetail('');

    await runImpactLocked(async () => {
      try {
        const result = await safeDeleteRepository.getImpact(impactEndpoint, {
          signal: controller.signal,
        });
        if (!controller.signal.aborted) setImpact(result);
      } catch (error) {
        if (controller.signal.aborted || error?.code === 'ERR_CANCELED') return;
        setImpactError(IMPACT_FAILURE_MESSAGE);
        setImpactErrorDetail(getImpactErrorDetail(error));
      }
    });
  }, [impactEndpoint, isOpen, runImpactLocked]);

  useEffect(() => {
    if (!isOpen) return undefined;

    // Deferring one tick prevents StrictMode's discarded mount from issuing a duplicate GET.
    const timer = window.setTimeout(() => {
      void loadImpact();
    }, 0);

    return () => {
      window.clearTimeout(timer);
      impactControllerRef.current?.abort();
    };
  }, [isOpen, loadImpact]);

  const closeModal = () => {
    if (deleting) return;
    impactControllerRef.current?.abort();
    onClose?.();
  };

  const confirmDelete = async () => {
    if (impact?.puedeEliminar !== true || typeof deleteAction !== 'function') return;

    await runDeleteLocked(async () => {
      setDeleteError('');
      try {
        await deleteAction();
        await onDeleted?.();
        notifications.success(successMessage || 'Registro eliminado correctamente.');
        onClose?.();
      } catch (error) {
        const message = getDeleteErrorMessage(error);
        setDeleteError(message);
        if (!error?.wasNotified) notifications.error(message);
      }
    });
  };

  return (
    <DeletionImpactModal
      isOpen={isOpen}
      entityLabel={entityLabel}
      entityName={entityName}
      stage={stage}
      impact={impact}
      loadingImpact={loadingImpact || (!impact && !impactError)}
      impactError={impactError}
      impactErrorDetail={impactErrorDetail}
      deleteError={deleteError}
      deleting={deleting}
      indirectWarning={indirectWarning}
      onCancel={closeModal}
      onRetryImpact={loadImpact}
      onContinue={() => setStage('confirm')}
      onConfirm={confirmDelete}
    />
  );
};
