// Entry point for the carousel library

import { Carousel } from './carousel.js';
import { SELECTORS } from './config.js';

// Global registry to store all initialized carousel instances
const instances = new Map();

// Auto-initializes all carousels on the page when DOM is ready
function autoInit() {
  const containers = document.querySelectorAll(SELECTORS.CONTAINER);

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
    console.log(`Carousel: Initialized ${instances.size} instance(s)`);
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

export { Carousel };
export default Carousel;
