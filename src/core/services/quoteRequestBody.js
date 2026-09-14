const isFileLike = (value) => (
  value
  && typeof value === 'object'
  && typeof value.name === 'string'
  && Number.isFinite(value.size)
  && typeof value.type === 'string'
);

const itemUsesClientDesign = (item = {}) => (
  item.requiereDiseno !== false
  && (
    String(item.origenDiseno || '').toUpperCase() === 'CLIENTE'
    || (item.estampados || []).some(
      (stamp) => String(stamp.origenDiseno || '').toUpperCase() === 'CLIENTE',
    )
  )
);

export const buildQuoteRequestBody = (payload, sourceItems = payload?.items || []) => {
  const files = [];
  const fileIndexes = new Map();
  let hasFiles = false;

  const items = (payload?.items || []).map((item, index) => {
    const cleanItem = { ...item };
    const transientFile = cleanItem.archivoDiseno;
    delete cleanItem.archivoDiseno;
    delete cleanItem.archivoDisenoIndice;
    const file = sourceItems[index]?.archivoDiseno || transientFile;
    if (!itemUsesClientDesign(cleanItem) || !isFileLike(file)) return cleanItem;

    let fileIndex = fileIndexes.get(file);
    if (fileIndex === undefined) {
      fileIndex = files.length;
      fileIndexes.set(file, fileIndex);
      files.push(file);
    }
    hasFiles = true;
    return { ...cleanItem, archivoDisenoIndice: fileIndex };
  });

  const cleanPayload = { ...payload, items };
  if (!hasFiles) return cleanPayload;

  const formData = new FormData();
  formData.append('payload', JSON.stringify(cleanPayload));
  files.forEach((file) => formData.append('archivoDiseno', file));
  return formData;
};
