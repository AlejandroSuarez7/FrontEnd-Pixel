import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { StrictMode } from 'react';
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

  it('does not update component state after unmounting with a pending action', async () => {
    let resolveSubmit;
    const submitMock = vi.fn(() => new Promise((resolve) => {
      resolveSubmit = resolve;
    }));
    const user = userEvent.setup();
    const { unmount } = render(<LockedForm onSubmit={submitMock} />);

    await user.click(screen.getByRole('button', { name: /guardar/i }));
    unmount();
    resolveSubmit();

    await expect(Promise.resolve()).resolves.toBeUndefined();
  });

  it('releases the lock after an action inside StrictMode', async () => {
    let resolveSubmit;
    const submitMock = vi.fn(() => new Promise((resolve) => {
      resolveSubmit = resolve;
    }));
    const user = userEvent.setup();

    render(
      <StrictMode>
        <LockedForm onSubmit={submitMock} />
      </StrictMode>,
    );

    await user.click(screen.getByRole('button', { name: /guardar/i }));
    expect(screen.getByRole('button', { name: /guardando/i })).toBeDisabled();

    resolveSubmit();

    await waitFor(() => expect(screen.getByRole('button', { name: /guardar/i })).not.toBeDisabled());
  });
});
