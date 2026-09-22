import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from './apiService';
import { createTemporaryObjectUrl, fetchProtectedBlob } from './protectedFileService';

vi.mock('./apiService', () => ({ apiClient: { get: vi.fn() } }));

describe('protectedFileService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('fetches protected blobs and prefers the response content type', async () => {
    const blob = new Blob(['pdf'], { type: 'application/octet-stream' });
    apiClient.get.mockResolvedValueOnce({ data: blob, headers: { 'content-type': 'application/pdf' } });
    await expect(fetchProtectedBlob('/receipt')).resolves.toEqual({ blob, mimeType: 'application/pdf' });
    expect(apiClient.get).toHaveBeenCalledWith('/receipt', { responseType: 'blob' });
  });

  it('falls back to blob and generic MIME types', async () => {
    const image = new Blob(['image'], { type: 'image/png' });
    apiClient.get
      .mockResolvedValueOnce({ data: image, headers: {} })
      .mockResolvedValueOnce({ data: new Blob(['x']), headers: null });
    await expect(fetchProtectedBlob('/image')).resolves.toEqual({ blob: image, mimeType: 'image/png' });
    await expect(fetchProtectedBlob('/unknown')).resolves.toEqual(expect.objectContaining({ mimeType: 'application/octet-stream' }));
  });

  it('creates and revokes temporary object URLs', () => {
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:temporary');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    const temporary = createTemporaryObjectUrl(new Blob(['x']));
    expect(temporary.objectUrl).toBe('blob:temporary');
    temporary.revoke();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:temporary');
  });
});
