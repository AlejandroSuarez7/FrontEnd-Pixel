export const LANDING_QUOTE_PATH = '/cotizar';

export const navigateToLandingQuote = (navigate) => {
  navigate(LANDING_QUOTE_PATH);
};

export const scrollToCurrentHash = (hash, options = {}) => {
  const sectionId = String(hash || '').replace(/^#/, '');
  if (!sectionId) return false;

  const element = document.getElementById(sectionId);
  if (!element) return false;

  element.scrollIntoView({
    behavior: options.behavior || 'smooth',
    block: options.block || 'start',
  });
  return true;
};
