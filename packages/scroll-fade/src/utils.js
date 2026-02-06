// Shared utility functions for the scroll-fade library

import { EDGE_THRESHOLD, attributes, defaults } from './config.js';

let idCounter = 0;

// Generates a unique ID for each scroll-fade instance
export function generateUniqueId() {
  idCounter += 1;
  return `scroll-fade-${idCounter}`;
}

// Checks if a presence-based attribute is enabled (exists AND !== "false")
export function isAttributeEnabled(element, attrName) {
  if (!element.hasAttribute(attrName)) return false;
  return element.getAttribute(attrName) !== 'false';
}

// Parses configuration from element data attributes
export function parseConfig(element) {
  const orientation =
    element.getAttribute(attributes.orientation) || defaults.orientation;

  const stepAttr = element.getAttribute(attributes.step);
  const step = stepAttr ? parseInt(stepAttr, 10) : defaults.step;

  return {
    orientation,
    step,
  };
}

// Emits DOM CustomEvent on the container element
export function emit(instance, eventName, data = {}) {
  const { container } = instance;

  const customEvent = new CustomEvent(`scroll-fade:${eventName}`, {
    detail: { scrollFade: instance, ...data },
    bubbles: true,
  });
  container.dispatchEvent(customEvent);
}

// Gets text direction using Intl.Locale API for RTL detection
export function getTextDirection() {
  try {
    const locale = new Intl.Locale(navigator.language);
    if (locale.getTextInfo) {
      return locale.getTextInfo().direction;
    }
  } catch {
    // Fallback if Intl.Locale.getTextInfo is not supported
  }

  // Fallback: check document direction
  const dir = document.documentElement.getAttribute('dir');
  if (dir) return dir;

  // Final fallback: check computed style
  return getComputedStyle(document.documentElement).direction || 'ltr';
}

// Checks if the container has scrollable content
export function isScrollable(container, orientation) {
  if (orientation === 'horizontal') {
    return container.scrollWidth > container.clientWidth;
  }
  return container.scrollHeight > container.clientHeight;
}

// Gets the current scroll position
export function getScrollPosition(container, orientation) {
  if (orientation === 'horizontal') {
    return container.scrollLeft;
  }
  return container.scrollTop;
}

// Calculates the maximum scroll value
export function getMaxScroll(container, orientation) {
  if (orientation === 'horizontal') {
    return container.scrollWidth - container.clientWidth;
  }
  return container.scrollHeight - container.clientHeight;
}

// Checks if scroll is at the start (within threshold)
export function isAtStart(container, orientation) {
  const position = getScrollPosition(container, orientation);
  return position <= EDGE_THRESHOLD;
}

// Checks if scroll is at the end (within threshold)
export function isAtEnd(container, orientation) {
  const position = getScrollPosition(container, orientation);
  const maxScroll = getMaxScroll(container, orientation);
  return position >= maxScroll - EDGE_THRESHOLD;
}

// Gets the scroll step value (configured or default to container size)
export function getScrollStep(container, config) {
  if (config.step !== null) {
    return config.step;
  }

  // Default to container client size
  if (config.orientation === 'horizontal') {
    return container.clientWidth;
  }
  return container.clientHeight;
}
