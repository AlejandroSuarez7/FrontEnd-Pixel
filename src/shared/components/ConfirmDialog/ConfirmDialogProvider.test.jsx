import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ConfirmProvider } from './ConfirmDialogProvider';
import { useConfirm } from './ConfirmProvider';

const ConfirmHarness = ({ onResult }) => {
  const confirm = useConfirm();

  const run = async (options) => onResult(await confirm(options));

  return (
    <div>
      <button type="button" onClick={() => run()}>Default confirmation</button>
      <button type="button" onClick={() => run({ title: 'Eliminar', message: 'Confirma la eliminación', variant: 'danger' })}>Danger confirmation</button>
      <button type="button" onClick={() => run({
        title: 'Motivo',
        input: true,
        inputLabel: 'Detalle',
        inputPlaceholder: 'Escribe un motivo',
        requiredInput: true,
        defaultValue: '',
      })}>Input confirmation</button>
    </div>
  );
};

describe('ConfirmDialogProvider', () => {
  it('resolves standard confirmations through confirm and cancel actions', async () => {
    const user = userEvent.setup();
    const onResult = vi.fn();
    render(<ConfirmProvider><ConfirmHarness onResult={onResult} /></ConfirmProvider>);

    await user.click(screen.getByRole('button', { name: 'Default confirmation' }));
    expect(screen.getByRole('dialog')).toHaveAttribute('open');
    expect(screen.getByText('Confirmar accion')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Confirmar' }));
    await waitFor(() => expect(onResult).toHaveBeenLastCalledWith(true));

    await user.click(screen.getByRole('button', { name: 'Danger confirmation' }));
    expect(screen.getByText('Confirma la eliminación')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Confirmar' })).toHaveClass('danger');
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));
    await waitFor(() => expect(onResult).toHaveBeenLastCalledWith(false));
  });

  it('requires and trims an input value before resolving', async () => {
    const user = userEvent.setup();
    const onResult = vi.fn();
    render(<ConfirmProvider><ConfirmHarness onResult={onResult} /></ConfirmProvider>);

    await user.click(screen.getByRole('button', { name: 'Input confirmation' }));
    const input = screen.getByLabelText('Detalle');
    const confirmButton = screen.getByRole('button', { name: 'Confirmar' });
    expect(input).toHaveAttribute('placeholder', 'Escribe un motivo');
    expect(confirmButton).toBeDisabled();

    await user.type(input, '  inventario duplicado  ');
    expect(confirmButton).toBeEnabled();
    await user.click(confirmButton);
    await waitFor(() => expect(onResult).toHaveBeenLastCalledWith({
      confirmed: true,
      value: 'inventario duplicado',
    }));
  });

  it('returns the input cancellation result when Escape is pressed', async () => {
    const user = userEvent.setup();
    const onResult = vi.fn();
    render(<ConfirmProvider><ConfirmHarness onResult={onResult} /></ConfirmProvider>);

    await user.click(screen.getByRole('button', { name: 'Input confirmation' }));
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });

    await waitFor(() => expect(onResult).toHaveBeenLastCalledWith({ confirmed: false, value: '' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
