const MIN_READABLE_WIDTH = 1000;
const MAX_READABLE_WIDTH = 2200;
const MAX_CANVAS_PIXELS = 12_000_000;

const calculateScale = (width, height) => {
  let scale = 1;
  if (width < MIN_READABLE_WIDTH) scale = Math.min(2, MIN_READABLE_WIDTH / width);
  if (width * scale > MAX_READABLE_WIDTH) scale = MAX_READABLE_WIDTH / width;
  const projectedPixels = width * height * scale * scale;
  if (projectedPixels > MAX_CANVAS_PIXELS) {
    scale *= Math.sqrt(MAX_CANVAS_PIXELS / projectedPixels);
  }
  return Math.max(0.5, scale);
};

export const prepareReceiptImage = async (file) => {
  if (!file?.type?.startsWith('image/') || typeof createImageBitmap !== 'function') {
    return { source: file, cleanup: () => {} };
  }

  let bitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    return { source: file, cleanup: () => {} };
  }
  const scale = calculateScale(bitmap.width, bitmap.height);
  if (Math.abs(scale - 1) < 0.08 || typeof document === 'undefined') {
    return { source: file, cleanup: () => bitmap.close() };
  }

  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext('2d', { alpha: false });
  if (!context) {
    bitmap.close();
    return { source: file, cleanup: () => {} };
  }

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  try {
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  } catch {
    bitmap.close();
    return { source: file, cleanup: () => {} };
  }
  bitmap.close();
  return {
    source: canvas,
    cleanup: () => {
      canvas.width = 1;
      canvas.height = 1;
    },
  };
};
