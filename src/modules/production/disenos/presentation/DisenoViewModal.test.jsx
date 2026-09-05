import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DisenoViewModal } from './DisenoViewModal';

const baseDesign = {
  idDiseno: 15,
  idPedido: 54,
  estado: 'ENVIADO',
  origenDiseno: 'PIXEL',
  pedido: { cliente: { nombre: 'Cliente Pixel' } },
};

describe('DisenoViewModal files', () => {
  it('shows a PDF card and never renders it as an image', () => {
    render(
      <DisenoViewModal
        isOpen
        onClose={vi.fn()}
        diseno={{
          ...baseDesign,
          archivo: {
            url: 'https://files.pixel.test/design.pdf',
            nombre: 'design.pdf',
            tipo: 'application/pdf',
            formato: 'pdf',
            bytes: 2400,
          },
        }}
      />,
    );

    expect(screen.getByText('design.pdf')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Abrir PDF' })).toHaveAttribute(
      'href',
      'https://files.pixel.test/design.pdf',
    );
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('keeps a historical URL usable when metadata is missing', () => {
    render(
      <DisenoViewModal
        isOpen
        onClose={vi.fn()}
        diseno={{ ...baseDesign, archivoUrl: 'https://files.pixel.test/historical-design' }}
      />,
    );

    expect(screen.getByRole('link', { name: 'Abrir archivo' })).toHaveAttribute(
      'href',
      'https://files.pixel.test/historical-design',
    );
  });
});
