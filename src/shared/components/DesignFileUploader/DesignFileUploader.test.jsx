import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DesignFileUploader } from './DesignFileUploader';

describe('DesignFileUploader', () => {
  beforeEach(() => {
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: vi.fn(() => 'blob:design-preview'),
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: vi.fn(),
    });
  });

  it('shows an image preview and releases it when removed', () => {
    const onFileChange = vi.fn();
    const { container, rerender } = render(
      <DesignFileUploader file={null} onFileChange={onFileChange} />,
    );
    const file = new File(['design'], 'design.png', { type: 'image/png' });

    fireEvent.change(container.querySelector('input[type="file"]'), {
      target: { files: [file] },
    });
    expect(onFileChange).toHaveBeenCalledWith(file);

    rerender(<DesignFileUploader file={file} onFileChange={onFileChange} />);
    expect(screen.getByRole('img', { name: /vista previa/i })).toHaveAttribute(
      'src',
      'blob:design-preview',
    );
    fireEvent.click(screen.getByRole('button', { name: /quitar archivo/i }));
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:design-preview');
    expect(onFileChange).toHaveBeenLastCalledWith(null);
  });

  it('shows PDF information without rendering an image', () => {
    const file = new File(['pdf'], 'design.pdf', { type: 'application/pdf' });
    render(<DesignFileUploader file={file} onFileChange={vi.fn()} />);

    expect(screen.getByText('design.pdf')).toBeInTheDocument();
    expect(screen.getByText(/PDF · 3 B/)).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it.each([
    ['photo.jpg', 'image/jpeg'],
    ['photo.jpeg', 'image/jpeg'],
    ['photo.png', 'image/png'],
    ['photo.webp', 'image/webp'],
    ['document.pdf', 'application/pdf'],
  ])('accepts %s', (name, type) => {
    const onFileChange = vi.fn();
    const { container } = render(
      <DesignFileUploader file={null} onFileChange={onFileChange} />,
    );
    const file = new File(['valid'], name, { type });

    fireEvent.change(container.querySelector('input[type="file"]'), {
      target: { files: [file] },
    });

    expect(onFileChange).toHaveBeenCalledWith(file);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('rejects files larger than 10 MB', () => {
    const onFileChange = vi.fn();
    const { container } = render(
      <DesignFileUploader file={null} onFileChange={onFileChange} />,
    );
    const file = new File([new Uint8Array((10 * 1024 * 1024) + 1)], 'large.png', {
      type: 'image/png',
    });

    fireEvent.change(container.querySelector('input[type="file"]'), {
      target: { files: [file] },
    });

    expect(screen.getByRole('alert')).toHaveTextContent(/10 MB/);
    expect(onFileChange).not.toHaveBeenCalled();
  });

  it('keeps the current selection when a new unsupported file is chosen', () => {
    const onFileChange = vi.fn();
    const { container } = render(
      <DesignFileUploader file={null} onFileChange={onFileChange} />,
    );

    fireEvent.change(container.querySelector('input[type="file"]'), {
      target: { files: [new File(['svg'], 'design.svg', { type: 'image/svg+xml' })] },
    });

    expect(screen.getByRole('alert')).toHaveTextContent(/JPG, PNG, WEBP o PDF/);
    expect(onFileChange).not.toHaveBeenCalled();
  });
});
