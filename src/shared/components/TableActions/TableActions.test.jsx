import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TableActions } from './TableActions';

const mocks = vi.hoisted(() => ({ locked: false, runLocked: vi.fn(operation => operation()) }));

vi.mock('../../../core/hooks/useAsyncLock', () => ({
  useAsyncLock: () => ({ isLocked: mocks.locked, runLocked: mocks.runLocked }),
}));

describe('TableActions', () => {
  beforeEach(() => {
    mocks.locked = false;
    mocks.runLocked.mockClear();
  });

  it('renders nothing without visible actions', () => {
    const { container } = render(<TableActions actions={[null, false]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('runs a styled primary action and respects disabled state', () => {
    const onClick = vi.fn();
    const { rerender } = render(
      <TableActions primaryAction={{ label: 'Ver', variant: 'accent', onClick }} />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Ver' }));
    expect(mocks.runLocked).toHaveBeenCalled();
    expect(onClick).toHaveBeenCalled();

    rerender(<TableActions primaryAction={{ label: 'Editar', disabled: true, onClick }} />);
    expect(screen.getByRole('button', { name: 'Editar' })).toBeDisabled();
  });

  it('opens the portal and executes enabled menu actions', () => {
    const onClick = vi.fn();
    render(
      <TableActions
        label="Opciones"
        align="left"
        actions={[null, { label: 'Eliminar', variant: 'danger', onClick }]}
      />,
    );
    const trigger = screen.getByRole('button', { name: 'Opciones' });
    vi.spyOn(trigger, 'getBoundingClientRect').mockReturnValue({
      top: 10, bottom: 30, left: 20, right: 60, width: 40, height: 20,
    });
    fireEvent.click(trigger);
    const action = screen.getByRole('button', { name: 'Eliminar' });
    expect(action).toHaveClass('table-actions-item-danger');
    fireEvent.click(action);
    expect(onClick).toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: 'Eliminar' })).not.toBeInTheDocument();
  });

  it('closes an open menu on Escape and outside pointer events', () => {
    render(<TableActions actions={[{ label: 'Editar', onClick: vi.fn() }]} />);
    const trigger = screen.getByRole('button', { name: 'Acciones' });
    fireEvent.click(trigger);
    expect(screen.getByRole('button', { name: 'Editar' })).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('button', { name: 'Editar' })).not.toBeInTheDocument();

    fireEvent.click(trigger);
    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole('button', { name: 'Editar' })).not.toBeInTheDocument();
  });

  it('shows loading labels and blocks callbacks while locked', () => {
    mocks.locked = true;
    const primaryClick = vi.fn();
    render(
      <TableActions
        primaryAction={{ label: 'Guardar', loadingLabel: 'Guardando...', onClick: primaryClick }}
        actions={[{ label: 'Eliminar', onClick: vi.fn() }]}
      />,
    );
    expect(screen.getByRole('button', { name: 'Guardando...' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Acciones' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Guardando...' }));
    expect(primaryClick).not.toHaveBeenCalled();
  });
});
