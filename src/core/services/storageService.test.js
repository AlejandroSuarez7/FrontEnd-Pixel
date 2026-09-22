import { beforeEach, describe, expect, it, vi } from 'vitest';
import { storageService } from './storageService';

describe('storageService', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('stores, reads and removes JSON values', () => {
    storageService.setItem('pixel', { enabled: true });
    expect(storageService.getItem('pixel')).toEqual({ enabled: true });
    storageService.removeItem('pixel');
    expect(storageService.getItem('pixel', 'fallback')).toBe('fallback');
  });

  it('returns fallbacks and warns when browser storage fails', () => {
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('read'); });
    expect(storageService.getItem('x', 7)).toBe(7);
    expect(warning).toHaveBeenCalledWith('Storage read failed', expect.any(Error));

    vi.restoreAllMocks();
    const secondWarning = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('write'); });
    storageService.setItem('x', 1);
    expect(secondWarning).toHaveBeenCalledWith('Storage write failed', expect.any(Error));

    vi.restoreAllMocks();
    const thirdWarning = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => { throw new Error('remove'); });
    storageService.removeItem('x');
    expect(thirdWarning).toHaveBeenCalledWith('Storage remove failed', expect.any(Error));
  });
});
