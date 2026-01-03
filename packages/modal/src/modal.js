// Entry point for modal library, handles auto-initialization

import { selectors, attributes } from './config.js';
import { Modal, ensureDialog, setupTriggerListeners, openFromUrl } from './core.js';

// Auto-initializes all modals on the page
function autoInit() {
  // Find all modal elements
  const modalElements = document.querySelectorAll(selectors.modal);

  modalElements.forEach((element) => {
    // Skip if already initialized
    if (element._modal) return;

    try {
      // Wrap non-dialog elements in <dialog>
      const dialog = ensureDialog(element);

      // Create modal instance
      new Modal(dialog);
    } catch (error) {
      console.warn('Modal auto-initialization failed:', error);
    }
  });

  // Setup global trigger listeners (event delegation)
  setupTriggerListeners();

  // Check URL for deep-linked modals
  openFromUrl();
}

// Execute on DOMContentLoaded or immediately if DOM is already ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', autoInit);
} else {
  autoInit();
}

// Export Modal class for module usage
export { Modal };
