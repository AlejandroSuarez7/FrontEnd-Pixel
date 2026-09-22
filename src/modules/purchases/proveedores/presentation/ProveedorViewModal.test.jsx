import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ProveedorViewModal } from './ProveedorViewModal';

describe('ProveedorViewModal', () => {
  it('stays hidden without data', () => {
    const { container } = render(<ProveedorViewModal isOpen proveedor={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows active contact details and closes', () => {
    const onClose = vi.fn();
    render(<ProveedorViewModal isOpen onClose={onClose} proveedor={{ idProveedor: 2, nombre: 'Pixel Supply', estado: true, telefono: '3001', correo: 'p@x.co', direccion: 'Calle 1' }} />);
    expect(screen.getByText('Activo')).toBeInTheDocument();
    expect(screen.getByText('3001')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar ventana' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('shows inactive and missing contact fallbacks', () => {
    render(<ProveedorViewModal isOpen onClose={vi.fn()} proveedor={{ idProveedor: 3, nombre: 'Sin datos', estado: false }} />);
    expect(screen.getByText('Inactivo')).toBeInTheDocument();
    expect(screen.getByText('Sin telefono')).toBeInTheDocument();
    expect(screen.getByText('Sin correo')).toBeInTheDocument();
    expect(screen.getByText('Sin direccion')).toBeInTheDocument();
  });
});
