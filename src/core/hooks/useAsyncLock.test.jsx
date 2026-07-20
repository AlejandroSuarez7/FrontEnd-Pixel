import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { useAsyncLock } from './useAsyncLock';

const LockedForm = ({ onSubmit }) => {
  const { isLocked, runLocked } = useAsyncLock();

  const handleSubmit = (event) => {
    event.preventDefault();
    runLocked(onSubmit);
  };

  return (
    <form onSubmit={handleSubmit}>
      <button type="submit" disabled={isLocked}>
        {isLocked ? 'Guardando...' : 'Guardar'}
      </button>
    </form>
  );
};

describe('useAsyncLock', () => {
  it('prevents multiple submissions while an action is pending', async () => {
    let resolveSubmit;
    const submitMock = vi.fn(() => new Promise((resolve) => {
      resolveSubmit = resolve;
    }));
    const user = userEvent.setup();

    render(<LockedForm onSubmit={submitMock} />);

    const button = screen.getByRole('button', { name: /guardar/i });
    await Promise.all([
      user.click(button),
      user.click(button),
      user.click(button),
    ]);

    expect(submitMock).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: /guardando/i })).toBeDisabled();

    resolveSubmit();

    await waitFor(() => expect(screen.getByRole('button', { name: /guardar/i })).not.toBeDisabled());
  });
});
