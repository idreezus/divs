import { MarqueeAPI } from './api.js';

// Auto-initialize marquees when DOM is ready
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => MarqueeAPI.init());
  } else {
    MarqueeAPI.init();
  }
}

// Expose public API
window.Marquee = MarqueeAPI;
