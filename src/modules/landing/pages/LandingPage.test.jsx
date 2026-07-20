import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import LandingPage from './LandingPage';
import { publicQuoteRepository } from '../infrastructure/publicQuote.repository';

const navigateMock = vi.fn();
const confirmMock = vi.fn();

vi.mock('motion/react', async () => {
  return {
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
  };
});

vi.mock('react-router-dom', () => ({
  Link: ({ children, to, ...props }) => <a href={to} {...props}>{children}</a>,
  useNavigate: () => navigateMock,
}));

vi.mock('../../../store/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    logout: vi.fn(),
  }),
}));

vi.mock('../../../shared/components/ConfirmDialog/ConfirmProvider', () => ({
  useConfirm: () => confirmMock,
}));

vi.mock('../infrastructure/publicQuote.repository', () => ({
  publicQuoteRepository: {
    listCategories: vi.fn(),
    listTechniques: vi.fn(),
    listProductsByCategory: vi.fn(),
    calculate: vi.fn(),
    create: vi.fn(),
  },
}));

vi.mock('../../../core/utils/notifications', () => ({
  notifications: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  },
}));

describe('LandingPage public quote form', () => {
  beforeEach(() => {
    navigateMock.mockReset();
    confirmMock.mockReset();
    publicQuoteRepository.listCategories.mockResolvedValue([
      { idCategoriaProducto: 1, nombre: 'Camisetas' },
    ]);
    publicQuoteRepository.listTechniques.mockResolvedValue([
      { idTecnica: 2, nombre: 'Sublimacion', estado: true },
    ]);
    publicQuoteRepository.listProductsByCategory.mockResolvedValue([
      {
        idProducto: 10,
        nombre: 'Camiseta',
        precioBase: 20000,
        categoriaProducto: { nombre: 'Camisetas' },
      },
    ]);
    publicQuoteRepository.calculate.mockResolvedValue({
      total: 40000,
      items: [{ precioUnitario: 20000, descuentoAplicado: 0, subtotal: 40000 }],
    });
    publicQuoteRepository.create.mockResolvedValue({ data: {} });
    confirmMock.mockResolvedValue(true);
  });

  it('renders a single-product quote form without add/remove product controls', async () => {
    render(<LandingPage />);

    expect(await screen.findByText(/solicita tu cotizaci/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/nombre completo/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/tu@email.com/i)).toBeInTheDocument();
    expect(screen.getByText(/selecciona un producto/i)).toBeInTheDocument();
    expect(screen.queryByText(/agregar producto/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^quitar$/i)).not.toBeInTheDocument();
  });

  it('submits one quoted product after confirmation', async () => {
    const user = userEvent.setup();

    const { container } = render(<LandingPage />);

    await user.type(screen.getByPlaceholderText(/nombre completo/i), 'Cliente Pixel');
    await user.type(screen.getByPlaceholderText(/tu@email.com/i), 'cliente@pixel.com');
    await user.type(screen.getByPlaceholderText('3000000000'), '3001234567');

    await waitFor(() => expect(publicQuoteRepository.listProductsByCategory).toHaveBeenCalled());

    const selects = container.querySelectorAll('select.contact-input');
    const quantityInput = container.querySelector('input[type="number"]');

    await user.selectOptions(selects[1], '2');
    await user.selectOptions(selects[2], '10');
    await user.clear(quantityInput);
    await user.type(quantityInput, '2');

    await user.click(screen.getByRole('button', { name: /enviar solicitud/i }));

    await waitFor(() => expect(confirmMock).toHaveBeenCalled());
    await waitFor(() => expect(publicQuoteRepository.create).toHaveBeenCalledTimes(1));

    const payload = publicQuoteRepository.create.mock.calls[0][0];
    expect(payload.items).toHaveLength(1);
    expect(payload.items[0]).toMatchObject({
      idProducto: 10,
      idTecnica: 2,
      cantidad: 2,
    });
  });
});
