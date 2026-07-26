/* eslint-disable react-hooks/set-state-in-effect */
import { Download, ExternalLink, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createTemporaryObjectUrl } from '../../../../core/services/protectedFileService';
import './AbonosPage.css';

export const ReceiptPreviewModal = ({ isOpen, onClose, loadReceipt, title = 'Comprobante' }) => {
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen || !loadReceipt) return undefined;

    let active = true;
    let releaseUrl = null;
    setPreview(null);
    setError('');

    loadReceipt()
      .then(({ blob, mimeType }) => {
        if (!active) return;
        const temporary = createTemporaryObjectUrl(blob);
        releaseUrl = temporary.revoke;
        setPreview({ url: temporary.objectUrl, mimeType });
      })
      .catch(requestError => {
        if (active) setError(requestError.message || 'Comprobante no disponible.');
      });

    return () => {
      active = false;
      releaseUrl?.();
    };
  }, [isOpen, loadReceipt]);

  if (!isOpen) return null;
  const isImage = preview?.mimeType?.startsWith('image/');
  const isPdf = preview?.mimeType === 'application/pdf';

  return (
    <div className="abonos-overlay">
      <div className="abonos-receipt-modal">
        <header className="abonos-modal-header">
          <div>
            <span className="abonos-breadcrumb">Archivo protegido</span>
            <h3 className="abonos-modal-title">{title}</h3>
          </div>
          <button type="button" className="abonos-modal-close-btn" onClick={onClose} aria-label="Cerrar">
            <X size={18} />
          </button>
        </header>

        <div className="abonos-receipt-content">
          {!preview && !error && <p className="abonos-loading-text">Cargando comprobante...</p>}
          {error && <p className="abonos-receipt-error">{error}</p>}
          {isImage && <img src={preview.url} alt="Comprobante de pago" />}
          {isPdf && <iframe src={preview.url} title={title} />}
          {preview && !isImage && !isPdf && (
            <p className="abonos-details-info-box">Este archivo no admite vista previa. Puedes abrirlo o descargarlo.</p>
          )}
        </div>

        <footer className="abonos-modal-footer">
          {preview && (
            <>
              <a className="abonos-btn-secondary" href={preview.url} target="_blank" rel="noreferrer">
                <ExternalLink size={16} /> Abrir
              </a>
              <a className="abonos-btn-primary" href={preview.url} download>
                <Download size={16} /> Descargar
              </a>
            </>
          )}
          <button type="button" className="abonos-btn-secondary" onClick={onClose}>Cerrar</button>
        </footer>
      </div>
    </div>
  );
};
