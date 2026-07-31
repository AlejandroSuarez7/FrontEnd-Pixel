import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useContextualBack } from './useContextualBack';

const router = vi.hoisted(() => ({
  navigate: vi.fn(),
  location: { key: 'default' },
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => router.navigate,
  useLocation: () => router.location,
}));

const BackButton = ({ fallback = '/dashboard/cliente/cotizaciones' }) => {
  const goBack = useContextualBack(fallback);
  return <button type="button" onClick={goBack}>Volver</button>;
};

describe('useContextualBack', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    router.location = { key: 'default' };
    window.history.replaceState({}, '', '/cotizar');
  });

  it('uses router history when a previous application entry exists', () => {
    router.location = { key: 'application-entry' };
    window.history.replaceState({ idx: 2 }, '', '/cotizar');
    render(<BackButton />);

    fireEvent.click(screen.getByRole('button', { name: 'Volver' }));

    expect(router.navigate).toHaveBeenCalledWith(-1);
  });

  it('uses the safe client fallback for a direct entry', () => {
    render(<BackButton />);

    fireEvent.click(screen.getByRole('button', { name: 'Volver' }));

    expect(router.navigate).toHaveBeenCalledWith('/dashboard/cliente/cotizaciones', { replace: true });
    expect(router.navigate).not.toHaveBeenCalledWith(expect.stringContaining('/dashboard/services'));
  });
});
