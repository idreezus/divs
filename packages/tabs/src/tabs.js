// Entry point for tabs library - auto-initialization only

import { Tabs } from './core.js';
import { selectors } from './config.js';

// Auto-initializes all tabs containers
function autoInit() {
  const containers = document.querySelectorAll(selectors.container);

  containers.forEach((container) => {
    // Skip if already initialized
    if (container._tabs) return;

    try {
      new Tabs(container);
    } catch (error) {
      console.warn('Tabs auto-initialization failed:', error);
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', autoInit);
} else {
  autoInit();
}

// Export for module usage
export { Tabs };
