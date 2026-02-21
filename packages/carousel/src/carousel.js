// Entry point for the carousel library

import { Carousel } from './core.js';
import { SELECTORS } from './config.js';

// Global registry to store all initialized carousel instances
const instances = new Map();

// Auto-initializes all carousels on the page when DOM is ready
function autoInit() {
  // Query new attribute, with silent fallback for legacy data-carousel="container"
  const containers = document.querySelectorAll(
    `${SELECTORS.CONTAINER}, [data-carousel="container"]`
  );

  containers.forEach((container) => {
    try {
      const carousel = new Carousel(container);
      if (carousel.id) {
        instances.set(carousel.id, carousel);
      }
    } catch (error) {
      console.warn('Carousel auto-initialization failed:', error);
    }
  });

  if (instances.size > 0) {
    // Carousel instances initialized
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', autoInit);
} else {
  autoInit();
}

if (typeof window !== 'undefined') {
  window.Carousel = Carousel;
  window.CarouselInstances = instances;
}
