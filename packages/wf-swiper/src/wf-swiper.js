import { setupWebflowSwipers } from './setup.js';

// Tracks initialization state so setup only runs once automatically
let autoInitHasRun = false;

// Runs setup once DOM is ready so swipers initialize without manual intervention
function autoInitWebflowSwipers() {
  if (autoInitHasRun) return;
  autoInitHasRun = true;
  setupWebflowSwipers();
}

// Auto-initialize when DOM is ready
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInitWebflowSwipers, {
      once: true,
    });
  } else {
    autoInitWebflowSwipers();
  }
}

// Expose public API so users can manually initialize or re-initialize
window.setupWebflowSwipers = setupWebflowSwipers;
