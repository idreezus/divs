// Keyboard navigation support

import { CONFIG } from './config.js';

// Applies the active class to the current item and removes it from others
export function updateActiveClasses(instance) {
  const { items, state } = instance;
  const { CLASSES } = CONFIG;
  const { currentIndex } = state;

  items.forEach((item, index) => {
    item.classList.toggle(CLASSES.ACTIVE, index === currentIndex);
  });
}

// Sets up keyboard event listeners for navigation
export function setupKeyboardNavigation(instance) {
  const { container } = instance;

  // Make container focusable if not already
  if (!container.hasAttribute('tabindex')) {
    container.setAttribute('tabindex', '0');
  }

  // Create and store bound handler
  const handleKeydown = (event) => {
    // Only handle keys if focus is on container or its children
    if (!container.contains(event.target)) {
      return;
    }

    // Handle navigation keys
    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        instance.prev();
        break;

      case 'ArrowRight':
        event.preventDefault();
        instance.next();
        break;

      case 'Home':
        event.preventDefault();
        instance.goTo(0);
        break;

      case 'End':
        event.preventDefault();
        instance.goTo(instance.state.maxReachableIndex);
        break;
    }
  };

  // Store handler for cleanup
  instance.boundHandlers.keyboard = handleKeydown;

  // Attach listener to container
  container.addEventListener('keydown', handleKeydown);
}
