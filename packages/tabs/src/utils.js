// Shared utility functions for the tabs library

// Emits DOM CustomEvent on the container element
export function emit(instance, eventName, data = {}) {
  const { container } = instance;

  const customEvent = new CustomEvent(`tabs:${eventName}`, {
    detail: { tabs: instance, ...data },
    bubbles: true,
  });
  container.dispatchEvent(customEvent);
}

// Normalizes a value string to lowercase, hyphenated format
export function normalizeValue(value) {
  if (!value) return '';
  return value.toLowerCase().replace(/\s+/g, '-');
}

let idCounter = 0;

// Generates a unique ID for each tabs instance
export function generateUniqueId() {
  idCounter += 1;
  return `tabs-${idCounter}`;
}

// Checks if user prefers reduced motion
export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// Reads URL parameter for a given key
export function getUrlParam(key) {
  if (!key) return null;
  const params = new URLSearchParams(window.location.search);
  return params.get(key);
}

// Updates URL parameter using replaceState
export function setUrlParam(key, value) {
  if (!key) return;
  const url = new URL(window.location.href);
  url.searchParams.set(key, value);
  window.history.replaceState({}, '', url.toString());
}
