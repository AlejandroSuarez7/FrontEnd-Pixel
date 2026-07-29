import { describe, expect, it, vi } from 'vitest';
import {
  LANDING_QUOTE_PATH,
  navigateToLandingQuote,
  scrollToCurrentHash,
} from './landingNavigation';

describe('landing navigation helpers', () => {
  it('navigates to the public quote section with the exact route', () => {
    const navigate = vi.fn();

    navigateToLandingQuote(navigate);

    expect(LANDING_QUOTE_PATH).toBe('/#contacto');
    expect(navigate).toHaveBeenCalledWith('/#contacto');
  });

  it('scrolls to the section represented by the current hash', () => {
    const scrollIntoView = vi.fn();
    const section = document.createElement('section');
    section.id = 'contacto';
    section.scrollIntoView = scrollIntoView;
    document.body.appendChild(section);

    expect(scrollToCurrentHash('#contacto')).toBe(true);
    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'start',
    });

    section.remove();
  });
});
