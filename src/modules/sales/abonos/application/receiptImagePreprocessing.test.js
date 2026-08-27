import { afterEach, describe, expect, it, vi } from 'vitest';
import { prepareReceiptImage } from './receiptImagePreprocessing';

describe('receipt image preprocessing', () => {
  const originalCreateImageBitmap = globalThis.createImageBitmap;

  afterEach(() => {
    globalThis.createImageBitmap = originalCreateImageBitmap;
    vi.restoreAllMocks();
  });

  it('uses the original file when browser image preparation is unavailable', async () => {
    globalThis.createImageBitmap = undefined;
    const file = new File(['image'], 'receipt.png', { type: 'image/png' });
    const prepared = await prepareReceiptImage(file);

    expect(prepared.source).toBe(file);
    expect(() => prepared.cleanup()).not.toThrow();
  });

  it('rescales a narrow screenshot without creating another analyzer', async () => {
    const bitmap = { width: 500, height: 1800, close: vi.fn() };
    globalThis.createImageBitmap = vi.fn().mockResolvedValue(bitmap);
    const drawImage = vi.fn();
    const canvas = {
      width: 0,
      height: 0,
      getContext: vi.fn(() => ({ drawImage, imageSmoothingEnabled: false, imageSmoothingQuality: 'low' })),
    };
    vi.spyOn(document, 'createElement').mockReturnValue(canvas);

    const file = new File(['image'], 'long.png', { type: 'image/png' });
    const prepared = await prepareReceiptImage(file);

    expect(globalThis.createImageBitmap).toHaveBeenCalledTimes(1);
    expect(canvas.width).toBe(1000);
    expect(canvas.height).toBe(3600);
    expect(drawImage).toHaveBeenCalledTimes(1);
    expect(bitmap.close).toHaveBeenCalledTimes(1);
    prepared.cleanup();
    expect(canvas.width).toBe(1);
    expect(canvas.height).toBe(1);
  });
});
