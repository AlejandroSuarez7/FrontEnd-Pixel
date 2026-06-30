import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import './ConfirmDialog.css';

const ConfirmContext = createContext(null);

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

  const confirm = useCallback((options = {}) => (
    new Promise((resolve) => {
      const nextDialog = {
        ...defaultOptions,
        ...options,
        resolve,
      };
      setInputValue(nextDialog.defaultValue || '');
      setDialog(nextDialog);
    })
  ), []);

  const close = (result) => {
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

  const value = useMemo(() => ({ confirm }), [confirm]);

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      {dialog && (
        <div className="confirm-dialog-backdrop" role="presentation">
          <section className="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="confirm-dialog-title">
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
                onClick={() => close(dialog.input ? { confirmed: false, value: '' } : false)}
              >
                {dialog.cancelText}
              </button>
              <button
                type="button"
                className={`confirm-dialog-button confirm-dialog-confirm ${dialog.variant}`}
                onClick={handleConfirm}
                disabled={dialog.input && dialog.requiredInput && !inputValue.trim()}
              >
                {dialog.confirmText}
              </button>
            </div>
          </section>
        </div>
      )}
    </ConfirmContext.Provider>
  );
};

export const useConfirm = () => {
  const context = useContext(ConfirmContext);
  if (!context) throw new Error('useConfirm debe usarse dentro de ConfirmProvider');
  return context.confirm;
};
