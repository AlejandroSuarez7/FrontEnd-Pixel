import { apiClient } from './apiService';

export const fetchProtectedBlob = async (url) => {
  const response = await apiClient.get(url, { responseType: 'blob' });
  return {
    blob: response.data,
    mimeType: response.headers?.['content-type'] || response.data?.type || 'application/octet-stream',
  };
};

export const createTemporaryObjectUrl = (blob) => {
  const objectUrl = URL.createObjectURL(blob);
  return {
    objectUrl,
    revoke: () => URL.revokeObjectURL(objectUrl),
  };
};
