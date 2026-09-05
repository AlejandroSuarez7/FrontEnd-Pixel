export const DESIGN_FILE_ACCEPT = 'image/jpeg,image/png,image/webp,application/pdf';
export const DESIGN_FILE_MAX_BYTES = 10 * 1024 * 1024;

const ALLOWED_DESIGN_FILE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
]);

const IMAGE_FORMATS = new Set(['jpg', 'jpeg', 'png', 'webp']);

const valueOrNull = value => (
  value === undefined || value === null || value === '' ? null : value
);

export const validateDesignFile = file => {
  if (!file) return 'Selecciona un archivo para continuar.';
  if (!ALLOWED_DESIGN_FILE_TYPES.has(String(file.type || '').toLowerCase())) {
    return 'Solo puedes subir archivos JPG, PNG, WEBP o PDF.';
  }
  if (!Number.isFinite(file.size) || file.size <= 0) {
    return 'El archivo seleccionado esta vacio.';
  }
  if (file.size > DESIGN_FILE_MAX_BYTES) {
    return 'El archivo supera el tamano maximo permitido de 10 MB.';
  }
  return '';
};

export const formatFileSize = bytes => {
  if (bytes === undefined || bytes === null || bytes === '') return '';
  const size = Number(bytes);
  if (!Number.isFinite(size) || size < 0) return '';
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toLocaleString('es-CO', { maximumFractionDigits: 1 })} KB`;
  return `${(size / (1024 * 1024)).toLocaleString('es-CO', { maximumFractionDigits: 1 })} MB`;
};

const getUrlExtension = url => {
  try {
    const path = new URL(url).pathname;
    return path.includes('.') ? path.split('.').pop().toLowerCase() : '';
  } catch {
    return '';
  }
};

export const getDesignFileInfo = source => {
  const stored = source?.archivo && typeof source.archivo === 'object'
    ? source.archivo
    : {};
  const url = valueOrNull(stored.url) || valueOrNull(source?.archivoUrl);
  const type = valueOrNull(stored.tipo) || valueOrNull(source?.archivoMimeType);
  const format = String(
    valueOrNull(stored.formato)
    || valueOrNull(source?.archivoFormato)
    || getUrlExtension(url)
    || '',
  ).toLowerCase();

  return {
    url,
    name: valueOrNull(stored.nombre) || valueOrNull(source?.archivoNombreOriginal),
    type,
    format,
    bytes: valueOrNull(stored.bytes) ?? valueOrNull(source?.archivoBytes),
    resourceType: valueOrNull(stored.resourceType) || valueOrNull(source?.archivoResourceType),
    isHistorical: Boolean(url && !type && !format && !stored.nombre),
  };
};

export const getDesignFileFormatLabel = fileInfo => {
  if (isPdfDesignFile(fileInfo)) return 'PDF';
  const format = String(fileInfo?.format || '').toLowerCase();
  if (format === 'jpeg' || format === 'jpg') return 'JPG';
  if (IMAGE_FORMATS.has(format)) return format.toUpperCase();
  const type = String(fileInfo?.type || '').toLowerCase();
  if (type === 'image/jpeg') return 'JPG';
  if (type === 'image/png') return 'PNG';
  if (type === 'image/webp') return 'WEBP';
  return 'Archivo';
};

export const isPdfDesignFile = fileInfo => (
  String(fileInfo?.type || '').toLowerCase() === 'application/pdf'
  || String(fileInfo?.format || '').toLowerCase() === 'pdf'
);

export const isImageDesignFile = fileInfo => {
  const type = String(fileInfo?.type || '').toLowerCase();
  const format = String(fileInfo?.format || '').toLowerCase();
  return type.startsWith('image/') || IMAGE_FORMATS.has(format);
};

export const appendDefinedFormFields = (formData, values = {}) => {
  Object.entries(values).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    formData.append(key, String(value));
  });
  return formData;
};
