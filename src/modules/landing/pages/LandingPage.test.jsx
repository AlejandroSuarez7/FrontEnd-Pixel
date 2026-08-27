import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import LandingPage from './LandingPage';

const navigateMock = vi.fn();

vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, ...props }) => {
      const cleanProps = { ...props };
      delete cleanProps.initial;
      delete cleanProps.whileInView;
      delete cleanProps.viewport;
      delete cleanProps.transition;
      return <div {...cleanProps}>{children}</div>;
    },
  },
}));

vi.mock('react-router-dom', () => ({
  Link: ({ children, to, ...props }) => <a href={to} {...props}>{children}</a>,
  useLocation: () => ({ hash: '', state: null }),
  useNavigate: () => navigateMock,
}));

vi.mock('../../../store/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    permissions: [],
    logout: vi.fn(),
  }),
}));

describe('LandingPage', () => {
  beforeEach(() => {
    navigateMock.mockReset();
  });

  it('keeps general contact separate from the quote builder', () => {
    render(<LandingPage />);

    expect(screen.getByRole('heading', { name: /escríbenos/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/nombre completo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^correo$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/teléfono/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/mensaje/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /enviar consulta por correo/i })).toHaveAttribute(
      'href',
      expect.stringContaining('mailto:contacto@pixel.com'),
    );
    expect(screen.queryByText(/agregar producto/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/total estimado/i)).not.toBeInTheDocument();
  });

  it('routes quote links and the hero action to the public builder', () => {
    render(<LandingPage />);

    expect(screen.getAllByRole('link', { name: /^cotizar$/i })[0]).toHaveAttribute('href', '/cotizar');
    expect(screen.getByRole('link', { name: /crear solicitud de cotización/i })).toHaveAttribute(
      'href',
      '/cotizar',
    );

    fireEvent.click(screen.getByRole('button', { name: /solicitar cotización/i }));
    expect(navigateMock).toHaveBeenCalledWith('/cotizar');
  });

  it('keeps the explicit Contact links pointing to the landing section', () => {
    render(<LandingPage />);

    expect(screen.getAllByRole('link', { name: /^contacto$/i })[0]).toHaveAttribute(
      'href',
      '/#contacto',
    );
  });

  it('uses the shared public navbar', () => {
    render(<LandingPage />);

    expect(screen.getByTestId('public-navbar')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /^inicio$/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: /¿cómo funciona\?/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: /^servicios$/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: /^comparativo$/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: /^productos$/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: /^cotizar$/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: /^contacto$/i }).length).toBeGreaterThan(0);
  });
});
