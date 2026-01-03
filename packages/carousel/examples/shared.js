/**
 * Shared utilities for carousel examples
 */

/**
 * Wait for the Carousel library to initialize before running a callback
 * @param {Function} callback - Function to run once Carousel is ready
 * @param {number} maxWait - Maximum time to wait in milliseconds (default: 2000)
 */
export function waitForCarousels(callback, maxWait = 2000) {
  const startTime = Date.now();
  const checkInterval = 100;

  const check = () => {
    if (
      window.Carousel &&
      window.Carousel.getAll &&
      window.Carousel.getAll().length > 0
    ) {
      callback();
    } else if (Date.now() - startTime < maxWait) {
      setTimeout(check, checkInterval);
    } else {
      console.warn('Carousels did not initialize in time');
      callback();
    }
  };

  check();
}

/**
 * Create an event logger for a given element
 * @param {string} logElementId - ID of the element to display logs
 * @param {number} maxEvents - Maximum number of events to display (default: 10)
 * @returns {Object} Logger object with log() method
 */
export function createEventLogger(logElementId, maxEvents = 10) {
  const logEl = document.getElementById(logElementId);
  const events = [];

  return {
    log(message) {
      events.unshift(`${new Date().toLocaleTimeString()}: ${message}`);
      if (logEl) {
        logEl.textContent = events.slice(0, maxEvents).join('\n');
      }
    },
    clear() {
      events.length = 0;
      if (logEl) {
        logEl.textContent = 'Waiting for events...';
      }
    },
  };
}
