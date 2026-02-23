// Entry point for the carousel library

import { Carousel } from './core';
import { SELECTORS } from './config';

// Auto-initializes all carousels on the page when DOM is ready
function autoInit(): void {
  // Query new attribute, with silent fallback for legacy data-carousel="container"
  const containers = document.querySelectorAll<HTMLElement>(
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
  (window as unknown as Record<string, unknown>).Carousel = Carousel;
}
