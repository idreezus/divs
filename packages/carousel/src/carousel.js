// Entry point for the carousel library

import { Carousel } from './core.js';
import { SELECTORS } from './config.js';

// Auto-initializes all carousels on the page when DOM is ready
function autoInit() {
  // Query new attribute, with silent fallback for legacy data-carousel="container"
  const containers = document.querySelectorAll(
    `${SELECTORS.CONTAINER}, [data-carousel="container"]`
  );

  containers.forEach((container) => {
    try {
      new Carousel(container);
    } catch (error) {
      console.warn('Carousel auto-initialization failed:', error);
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', autoInit);
} else {
  autoInit();
}

if (typeof window !== 'undefined') {
  window.Carousel = Carousel;
}
