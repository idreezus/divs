// Shared utility functions for the tabs library

import type { TabsInstance } from './types';

// Emits DOM CustomEvent on the container element
export function emit(instance: TabsInstance, eventName: string, data: Record<string, unknown> = {}): void {
  const { container } = instance;

  const customEvent = new CustomEvent(`tabs:${eventName}`, {
    detail: { tabs: instance, ...data },
    bubbles: true,
  });
  container.dispatchEvent(customEvent);
}

// Normalizes a value string to lowercase, hyphenated format
export function normalizeValue(value: string | null | undefined): string {
  if (!value) return '';
  return value.toLowerCase().replace(/\s+/g, '-');
}

let idCounter: number = 0;

// Generates a unique ID for each tabs instance
export function generateUniqueId(): string {
  idCounter += 1;
  return `tabs-${idCounter}`;
}

// Checks if user prefers reduced motion
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// Reads URL parameter for a given key
export function getUrlParam(key: string): string | null {
  if (!key) return null;
  const params = new URLSearchParams(window.location.search);
  return params.get(key);
}

// Updates URL parameter using replaceState
export function setUrlParam(key: string, value: string): void {
  if (!key) return;
  const url = new URL(window.location.href);
  url.searchParams.set(key, value);
  window.history.replaceState({}, '', url.toString());
}
