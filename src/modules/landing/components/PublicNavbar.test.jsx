import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import PublicNavbar from './PublicNavbar';

vi.mock('../../../store/AuthContext', () => ({
  useAuth: () => ({ user: null, permissions: [], logout: vi.fn() }),
}));

const SECTION_IDS = [
  'inicio',
  'como-funciona',
  'servicios',
  'comparativo',
  'productos',
  'contacto',
];

let observerCallback;
let observerInstances;
let observedSections;

class IntersectionObserverMock {
  constructor(callback, options) {
    observerCallback = callback;
    this.options = options;
    observerInstances.push(this);
  }

  observe = (element) => {
    observedSections.push(element.id);
  };

  disconnect = vi.fn();
}

const renderNavbar = (route = '/') => render(
  <MemoryRouter initialEntries={[route]}>
    <PublicNavbar />
    {SECTION_IDS.map((id) => <section key={id} id={id}>{id}</section>)}
  </MemoryRouter>,
);

const getDesktopLink = (name) => within(
  screen.getByRole('navigation', { name: 'Navegación pública' }),
).getByRole('link', { name });

const emitVisibleSections = (entries) => {
  act(() => {
    observerCallback(entries.map(({ id, top, visible = true }) => ({
      target: document.getElementById(id),
      isIntersecting: visible,
      boundingClientRect: { top, bottom: top + 300 },
    })));
  });
};

describe('PublicNavbar section tracking', () => {
  beforeEach(() => {
    observerCallback = null;
    observerInstances = [];
    observedSections = [];
    window.IntersectionObserver = IntersectionObserverMock;
    window.history.replaceState({}, '', '/');
    Element.prototype.scrollIntoView = vi.fn();
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 800 });
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 0 });
    Object.defineProperty(document.documentElement, 'scrollHeight', { configurable: true, value: 2400 });
  });

  it('starts at Inicio and changes the active item as sections become visible', () => {
    renderNavbar('/');

    expect(getDesktopLink('Inicio')).toHaveAttribute('aria-current', 'page');
    expect(observerInstances).toHaveLength(1);
    expect(observedSections).toEqual(SECTION_IDS);

    emitVisibleSections([{ id: 'servicios', top: 92 }]);

    expect(getDesktopLink('Servicios')).toHaveAttribute('aria-current', 'page');
    expect(getDesktopLink('Inicio')).not.toHaveAttribute('aria-current');
    expect(window.location.hash).toBe('');
    expect(observerInstances[0].options.threshold).toEqual([0, 0.01]);
  });

  it('does not recreate the observer when the active section changes and disconnects on unmount', () => {
    const { unmount } = renderNavbar('/');

    emitVisibleSections([{ id: 'servicios', top: 92 }]);
    emitVisibleSections([
      { id: 'servicios', top: -200, visible: false },
      { id: 'productos', top: 92 },
    ]);

    expect(observerInstances).toHaveLength(1);
    expect(getDesktopLink('Productos')).toHaveAttribute('aria-current', 'page');

    unmount();
    expect(observerInstances[0].disconnect).toHaveBeenCalledOnce();
  });

  it('keeps Contacto active when reaching the end of the page', () => {
    renderNavbar('/');
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 1600 });

    emitVisibleSections([
      { id: 'productos', top: 90 },
      { id: 'contacto', top: 560 },
    ]);

    expect(getDesktopLink('Contacto')).toHaveAttribute('aria-current', 'page');
  });

  it('scrolls smoothly, updates the active item and ignores intermediate sections', async () => {
    const user = userEvent.setup();
    renderNavbar('/');

    await user.click(getDesktopLink('Servicios'));

    expect(document.getElementById('servicios').scrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'start',
    });
    expect(getDesktopLink('Servicios')).toHaveAttribute('aria-current', 'page');
    expect(window.location.hash).toBe('#servicios');

    emitVisibleSections([{ id: 'como-funciona', top: 92 }]);
    expect(getDesktopLink('Servicios')).toHaveAttribute('aria-current', 'page');

    emitVisibleSections([{ id: 'servicios', top: 92 }]);
    expect(getDesktopLink('Servicios')).toHaveAttribute('aria-current', 'page');
  });

  it('activates a direct hash and closes the mobile menu after section navigation', async () => {
    const user = userEvent.setup();
    renderNavbar('/#productos');

    expect(getDesktopLink('Productos')).toHaveAttribute('aria-current', 'page');

    await user.click(screen.getByRole('button', { name: 'Abrir menú' }));
    expect(document.querySelector('.sheet-container')).toHaveAttribute('aria-hidden', 'false');

    const mobileNavigation = screen.getByRole('navigation', { name: 'Navegación pública móvil' });
    await user.click(within(mobileNavigation).getByRole('link', { name: 'Contacto' }));

    expect(document.querySelector('.sheet-container')).toHaveAttribute('aria-hidden', 'true');
    expect(getDesktopLink('Contacto')).toHaveAttribute('aria-current', 'page');
  });

  it('keeps Cotizar active by route without creating an observer', () => {
    renderNavbar('/cotizar');

    expect(getDesktopLink('Cotizar')).toHaveAttribute('aria-current', 'page');
    expect(observerInstances).toHaveLength(0);
  });
});
