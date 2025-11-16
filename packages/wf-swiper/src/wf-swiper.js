import { setupWebflowSwipers } from './core.js';

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupWebflowSwipers, {
    once: true,
  });
} else {
  setupWebflowSwipers();
}

// Expose public API so users can manually initialize or re-initialize
window.setupWebflowSwipers = setupWebflowSwipers;
