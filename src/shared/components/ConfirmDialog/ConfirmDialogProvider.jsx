import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ConfirmContext } from './ConfirmProvider';
import './ConfirmDialog.css';

const defaultOptions = {
  title: 'Confirmar accion',
  message: 'Esta accion requiere confirmacion.',
  confirmText: 'Confirmar',
  cancelText: 'Cancelar',
  variant: 'default',
  input: false,
  inputLabel: '',
  inputPlaceholder: '',
  requiredInput: false,
  defaultValue: '',
};

export const ConfirmProvider = ({ children }) => {
  const [dialog, setDialog] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [isResolving, setIsResolving] = useState(false);
  const resolvingRef = useRef(false);
  const dialogRef = useRef(null);

  useEffect(() => {
    const element = dialogRef.current;
    if (!dialog || !element || element.open) return;
    if (typeof element.showModal === 'function') element.showModal();
    else element.setAttribute('open', '');
  }, [dialog]);

  const confirm = useCallback((options = {}) => (
    new Promise((resolve) => {
      const nextDialog = {
        ...defaultOptions,
        ...options,
        resolve,
      };
      setInputValue(nextDialog.defaultValue || '');
      resolvingRef.current = false;
      setIsResolving(false);
      setDialog(nextDialog);
    })
  ), []);

  const close = (result) => {
    if (resolvingRef.current) return;
    resolvingRef.current = true;
    setIsResolving(true);
    dialog?.resolve(result);
    setDialog(null);
    setInputValue('');
  };

  const handleConfirm = () => {
    if (dialog?.input) {
      const value = inputValue.trim();
      if (dialog.requiredInput && !value) return;
      close({ confirmed: true, value });
      return;
    }

    close(true);
  };

  const handleCancel = (event) => {
    event.preventDefault();
    close(dialog?.input ? { confirmed: false, value: '' } : false);
  };

  const value = useMemo(() => ({ confirm }), [confirm]);

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      {dialog && (
        <div className="confirm-dialog-backdrop">
          <dialog
            ref={dialogRef}
            className="confirm-dialog"
            aria-labelledby="confirm-dialog-title"
            onCancel={handleCancel}
            onKeyDown={(event) => {
              if (event.key === 'Escape') handleCancel(event);
            }}
          >
            <div className="confirm-dialog-header">
              <h2 className="confirm-dialog-title" id="confirm-dialog-title">{dialog.title}</h2>
              <p className="confirm-dialog-message">{dialog.message}</p>
            </div>

            {dialog.input && (
              <div className="confirm-dialog-body">
                {dialog.inputLabel && (
                  <label className="confirm-dialog-message" htmlFor="confirm-dialog-input">
                    {dialog.inputLabel}
                  </label>
                )}
                <textarea
                  id="confirm-dialog-input"
                  className="confirm-dialog-input"
                  value={inputValue}
                  placeholder={dialog.inputPlaceholder}
                  onChange={(event) => setInputValue(event.target.value)}
                  autoFocus
                />
              </div>
            )}

            <div className="confirm-dialog-actions">
              <button
                type="button"
                className="confirm-dialog-button confirm-dialog-cancel"
                onClick={handleCancel}
                disabled={isResolving}
                autoFocus={!dialog.input}
              >
                {dialog.cancelText}
              </button>
              <button
                type="button"
                className={`confirm-dialog-button confirm-dialog-confirm ${dialog.variant}`}
                onClick={handleConfirm}
                disabled={isResolving || (dialog.input && dialog.requiredInput && !inputValue.trim())}
              >
                {isResolving ? 'Procesando...' : dialog.confirmText}
              </button>
            </div>
          </dialog>
        </div>
      )}
    </ConfirmContext.Provider>
  );
};
