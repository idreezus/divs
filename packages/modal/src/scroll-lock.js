// Scroll lock module for modal dialogs

import { classes } from './config.js';

// Track number of open modals for nested scroll lock
let openCount = 0;
let scrollY = 0;

// Locks body scroll when a modal opens
export function lock() {
  openCount += 1;

  // Only lock on first modal
  if (openCount === 1) {
    scrollY = window.scrollY;
    document.body.classList.add(classes.bodyOpen);
  }
}

// Unlocks body scroll when a modal closes
export function unlock() {
  openCount -= 1;

  // Only unlock when all modals are closed
  if (openCount <= 0) {
    openCount = 0;
    document.body.classList.remove(classes.bodyOpen);
    window.scrollTo(0, scrollY);
  }
}
