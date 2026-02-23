// Entry point for tabs library - auto-initialization only

import { Tabs } from './core';
import { selectors } from './config';
import type { TabsHTMLElement } from './types';

// Auto-initializes all tabs containers
function autoInit(): void {
  const containers = document.querySelectorAll(selectors.container);

  containers.forEach((container) => {
    // Skip if already initialized
    if ((container as TabsHTMLElement)._tabs) return;

    try {
      new Tabs(container as HTMLElement);
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
