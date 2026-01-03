// Shared utility functions for the modal library

let idCounter = 0;

// Generates a unique ID for each modal instance
export function generateUniqueId() {
  idCounter += 1;
  return `modal-${idCounter}`;
}

// Normalizes a value string to lowercase, hyphenated format
export function normalizeValue(value) {
  if (!value) return '';
  return value.toLowerCase().replace(/\s+/g, '-');
}
