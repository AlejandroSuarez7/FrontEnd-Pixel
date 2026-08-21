import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DeletionImpactModal } from './DeletionImpactModal';

const baseProps = {
  isOpen: true,
  entityLabel: 'rol',
  entityName: 'Diseñador',
  onCancel: vi.fn(),
  onRetryImpact: vi.fn(),
  onContinue: vi.fn(),
  onConfirm: vi.fn(),
};

describe('DeletionImpactModal', () => {
  it('shows affected records, omitted records and human action labels', () => {
    render(
      <DeletionImpactModal
        {...baseProps}
        impact={{
          puedeEliminar: true,
          totalAfectados: 3,
          afectados: [{
            tipo: 'Usuarios',
            accion: 'ELIMINAR',
            cantidad: 3,
            registros: [{ id: 1, nombre: 'Juan Perez' }],
            registrosOmitidos: 2,
          }],
        }}
      />,
    );

    expect(screen.getByText('Se eliminarán 3 usuarios asociados')).toBeInTheDocument();
    expect(screen.getByText('Juan Perez')).toBeInTheDocument();
    expect(screen.getByText('+ 2 registros adicionales')).toBeInTheDocument();
    expect(screen.queryByText('ELIMINAR')).not.toBeInTheDocument();
    expect(screen.queryByText('1')).not.toBeInTheDocument();
  });

  it('keeps the critical double confirmation when no related records exist', () => {
    const onContinue = vi.fn();
    const { rerender } = render(
      <DeletionImpactModal
        {...baseProps}
        onContinue={onContinue}
        impact={{ puedeEliminar: true, totalAfectados: 0, afectados: [] }}
      />,
    );

    expect(screen.getByText('No se encontraron registros relacionados que vayan a ser afectados.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
    expect(onContinue).toHaveBeenCalledOnce();

    rerender(
      <DeletionImpactModal
        {...baseProps}
        stage="confirm"
        impact={{ puedeEliminar: true, totalAfectados: 0, afectados: [] }}
      />,
    );
    expect(screen.getByRole('button', { name: 'Sí, eliminar definitivamente' })).toBeInTheDocument();
  });

  it('blocks continuation when the backend says the entity cannot be deleted', () => {
    render(
      <DeletionImpactModal
        {...baseProps}
        impact={{
          puedeEliminar: false,
          totalAfectados: 1,
          afectados: [],
          motivoBloqueo: 'El rol está protegido.',
        }}
      />,
    );

    expect(screen.getByText('No se puede eliminar este registro.')).toBeInTheDocument();
    expect(screen.getByText('El rol está protegido.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Continuar' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Entendido' })).toBeInTheDocument();
  });

  it('offers retry and never exposes a destructive action when impact lookup fails', () => {
    const onRetryImpact = vi.fn();
    render(
      <DeletionImpactModal
        {...baseProps}
        impactError="No pudimos verificar el impacto."
        onRetryImpact={onRetryImpact}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(onRetryImpact).toHaveBeenCalledOnce();
    expect(screen.queryByRole('button', { name: 'Continuar' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Sí, eliminar definitivamente' })).not.toBeInTheDocument();
  });
});
