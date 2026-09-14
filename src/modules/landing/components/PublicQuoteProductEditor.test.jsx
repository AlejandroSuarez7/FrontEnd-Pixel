import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { createQuoteItem, createStamp } from '../domain/publicQuoteBuilder';
import { PublicQuoteProductEditor } from './PublicQuoteProductEditor';

const renderEditor = (item, onPatch = vi.fn()) => render(
  <PublicQuoteProductEditor
    item={item}
    products={[]}
    categories={[]}
    techniques={[]}
    designReferences={[]}
    error=""
    disabled={false}
    onPatch={onPatch}
    onStampPatch={vi.fn()}
    onAddStamp={vi.fn()}
    onDuplicateStamp={vi.fn()}
    onRemoveStamp={vi.fn()}
    onShareDesign={vi.fn()}
    onSubmit={vi.fn()}
  />,
);

describe('PublicQuoteProductEditor design upload', () => {
  it('shows the shared uploader for CLIENTE and removes the manual URL input', () => {
    const onPatch = vi.fn();
    const item = createQuoteItem({
      tipoProducto: 'OTRO',
      nombrePersonalizado: 'Bolso',
      origenDiseno: 'CLIENTE',
      esDisenoGeneral: true,
    });
    const { container } = renderEditor(item, onPatch);
    const file = new File(['design'], 'design.png', { type: 'image/png' });

    expect(screen.getByText('Adjunta tu diseño')).toBeInTheDocument();
    expect(screen.getByText('JPG, PNG, WEBP o PDF · Máximo 10 MB')).toBeInTheDocument();
    expect(screen.queryByText('Enlace del diseño')).not.toBeInTheDocument();
    expect(container.querySelector('input[placeholder*="drive.google"]')).not.toBeInTheDocument();

    fireEvent.change(container.querySelector('input[type="file"]'), {
      target: { files: [file] },
    });
    expect(onPatch).toHaveBeenCalledWith({ archivoDiseno: file });
  });

  it.each([
    ['PIXEL', true],
    ['NO_REQUIERE', false],
  ])('does not show the uploader for %s', (origin, requiresDesign) => {
    const item = createQuoteItem({
      tipoProducto: 'OTRO',
      nombrePersonalizado: 'Bolso',
      requiereDiseno: requiresDesign,
      origenDiseno: origin,
      esDisenoGeneral: true,
      estampados: [createStamp({
        origenDiseno: origin,
      })],
    });
    const { container } = renderEditor(item);

    expect(screen.queryByText('Adjunta tu diseño')).not.toBeInTheDocument();
    expect(container.querySelector('input[type="file"]')).not.toBeInTheDocument();
  });

  it('renders the preferred historical secure URL without a manual URL field', () => {
    const item = createQuoteItem({
      tipoProducto: 'OTRO',
      nombrePersonalizado: 'Bolso',
      origenDiseno: 'CLIENTE',
      esDisenoGeneral: true,
      archivoDisenoInicial: { secureUrl: 'https://cloudinary.test/current.png' },
      archivoDisenoInicialUrl: 'https://legacy.test/old.png',
    });
    const { container } = renderEditor(item);

    expect(screen.getByRole('link', { name: /ver archivo de diseño actual/i }))
      .toHaveAttribute('href', 'https://cloudinary.test/current.png');
    expect(screen.queryByText('Enlace del diseño')).not.toBeInTheDocument();
    expect(container.querySelector('input[placeholder*="drive.google"]')).not.toBeInTheDocument();
  });
});
