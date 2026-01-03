// ScrollFade entry point with auto-initialization

import { selectors } from './config.js';
import { ScrollFade } from './core.js';

// Auto-initialize all scroll-fade containers
function autoInit() {
  const containers = document.querySelectorAll(selectors.container);

  containers.forEach((container) => {
    // Skip already initialized containers
    if (container._scrollFade) return;

    try {
      new ScrollFade(container);
    } catch (error) {
      console.warn('ScrollFade auto-initialization failed:', error);
    }
  });
}

// Run auto-init when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', autoInit);
} else {
  autoInit();
}

// Export for manual usage
export { ScrollFade };
