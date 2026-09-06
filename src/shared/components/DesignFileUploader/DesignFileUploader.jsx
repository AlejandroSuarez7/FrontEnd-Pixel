import { useEffect, useId, useRef, useState } from 'react';
import { FileText, Image, Upload, X } from 'lucide-react';
import {
  DESIGN_FILE_ACCEPT,
  formatFileSize,
  getDesignFileFormatLabel,
  validateDesignFile,
} from '../../../core/utils/designFile';
import './DesignFileUploader.css';

export const DesignFileUploader = ({
  file,
  onFileChange,
  disabled = false,
  loading = false,
  error = '',
  label = 'Archivo *',
  helpText = 'JPG, PNG, WEBP o PDF · Maximo 10 MB',
}) => {
  const generatedId = useId();
  const inputRef = useRef(null);
  const previewUrlRef = useRef('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [validationError, setValidationError] = useState('');
  const isPdf = file?.type === 'application/pdf';

  useEffect(() => () => {
    if (previewUrlRef.current && typeof URL !== 'undefined') {
      URL.revokeObjectURL(previewUrlRef.current);
    }
  }, []);

  useEffect(() => {
    if (!file && previewUrlRef.current && typeof URL !== 'undefined') {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = '';
    }
  }, [file]);

  const selectFile = event => {
    const nextFile = event.target.files?.[0] || null;
    const nextError = validateDesignFile(nextFile);
    setValidationError(nextError);
    if (nextError) {
      event.target.value = '';
      return;
    }
    if (previewUrlRef.current && typeof URL !== 'undefined') {
      URL.revokeObjectURL(previewUrlRef.current);
    }
    const nextPreviewUrl = nextFile.type !== 'application/pdf'
      && typeof URL !== 'undefined'
      && typeof URL.createObjectURL === 'function'
      ? URL.createObjectURL(nextFile)
      : '';
    previewUrlRef.current = nextPreviewUrl;
    setPreviewUrl(nextPreviewUrl);
    onFileChange(nextFile);
  };

  const removeFile = () => {
    setValidationError('');
    if (previewUrlRef.current && typeof URL !== 'undefined') {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = '';
    }
    setPreviewUrl('');
    if (inputRef.current) inputRef.current.value = '';
    onFileChange(null);
  };

  const visibleError = validationError || error;
  const fileInfo = file ? {
    type: file.type,
    format: file.name?.split('.').pop(),
  } : null;

  return (
    <div className="design-file-uploader">
      <span className="design-file-uploader-label">{label}</span>
      {!file ? (
        <label className={`design-file-uploader-select${disabled || loading ? ' is-disabled' : ''}`} htmlFor={generatedId}>
          <Upload size={18} aria-hidden="true" />
          <span>Seleccionar archivo</span>
          <input
            ref={inputRef}
            id={generatedId}
            type="file"
            accept={DESIGN_FILE_ACCEPT}
            onChange={selectFile}
            disabled={disabled || loading}
          />
        </label>
      ) : (
        <div className="design-file-uploader-file">
          {previewUrl ? (
            <img src={previewUrl} alt="Vista previa del diseno seleccionado" />
          ) : (
            <span className="design-file-uploader-icon" aria-hidden="true">
              {isPdf ? <FileText size={24} /> : <Image size={24} />}
            </span>
          )}
          <div className="design-file-uploader-details">
            <strong title={file.name}>{file.name}</strong>
            <span>{getDesignFileFormatLabel(fileInfo)} · {formatFileSize(file.size)}</span>
            {loading && <span className="design-file-uploader-progress">Subiendo diseno...</span>}
          </div>
          <button
            type="button"
            onClick={removeFile}
            disabled={disabled || loading}
            aria-label="Quitar archivo seleccionado"
            title="Quitar archivo"
          >
            <X size={17} />
          </button>
        </div>
      )}
      <small>{helpText}</small>
      {visibleError && <p role="alert">{visibleError}</p>}
    </div>
  );
};
