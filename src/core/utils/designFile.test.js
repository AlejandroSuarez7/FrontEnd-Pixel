import { describe, expect, it } from 'vitest';
import {
  DESIGN_FILE_MAX_BYTES,
  formatFileSize,
  getDesignFileInfo,
  isPdfDesignFile,
  validateDesignFile,
} from './designFile';

describe('design file utilities', () => {
  it.each([
    ['image/jpeg', 'design.jpg'],
    ['image/jpeg', 'design.jpeg'],
    ['image/png', 'design.png'],
    ['image/webp', 'design.webp'],
    ['application/pdf', 'design.pdf'],
  ])('allows %s design files', (type, name) => {
    expect(validateDesignFile(new File(['file'], name, { type }))).toBe('');
  });

  it('rejects unsupported and oversized files', () => {
    expect(validateDesignFile(new File(['file'], 'design.svg', { type: 'image/svg+xml' })))
      .toMatch(/JPG, PNG, WEBP o PDF/);
    const oversized = new File(['file'], 'design.png', { type: 'image/png' });
    Object.defineProperty(oversized, 'size', { value: DESIGN_FILE_MAX_BYTES + 1 });
    expect(validateDesignFile(oversized)).toMatch(/10 MB/);
  });

  it('normalizes new metadata and keeps historical URLs without metadata', () => {
    expect(getDesignFileInfo({
      archivoUrl: 'https://files.pixel.test/new.png',
      archivo: {
        url: 'https://files.pixel.test/design.pdf',
        nombre: 'design.pdf',
        tipo: 'application/pdf',
        formato: 'pdf',
        bytes: 245812,
        resourceType: 'raw',
      },
    })).toMatchObject({
      url: 'https://files.pixel.test/design.pdf',
      name: 'design.pdf',
      bytes: 245812,
    });

    const historical = getDesignFileInfo({ archivoUrl: 'https://files.pixel.test/archive' });
    expect(historical.url).toBe('https://files.pixel.test/archive');
    expect(historical.name).toBeNull();
    expect(formatFileSize(historical.bytes)).toBe('');
  });

  it('detects PDF files without treating them as images', () => {
    expect(isPdfDesignFile(getDesignFileInfo({ archivoUrl: 'https://files.pixel.test/design.pdf' })))
      .toBe(true);
  });
});
