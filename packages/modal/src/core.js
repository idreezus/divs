// Core modal library with Modal class and initialization logic

import {
  selectors,
  attributes,
  classes,
  defaults,
  validPositions,
} from './config.js';
import { generateUniqueId, normalizeValue } from './utils.js';
import { lock, unlock } from './scroll-lock.js';

// Parses configuration from data attributes on the dialog element
function parseConfig(dialog) {
  const positionAttr = dialog.getAttribute(attributes.position);
  let position = defaults.position;

  if (positionAttr) {
    const normalizedPosition = positionAttr.toLowerCase();
    if (validPositions.includes(normalizedPosition)) {
      position = normalizedPosition;
    } else {
      console.warn(
        `Modal: Invalid position "${positionAttr}". Valid values: ${validPositions.join(', ')}. Defaulting to "${defaults.position}".`
      );
    }
  }

  return {
    scrollLock: dialog.getAttribute(attributes.scrollLock) !== 'false',
    urlParam: dialog.getAttribute(attributes.urlParam) || null,
    position,
  };
}

// Wraps a non-dialog element in a real <dialog>
function ensureDialog(element) {
  if (element.tagName === 'DIALOG') {
    return element;
  }

  const dialog = document.createElement('dialog');

  // Copy ONLY data-modal-* attributes to dialog
  [...element.attributes].forEach((attr) => {
    if (attr.name.startsWith('data-modal')) {
      dialog.setAttribute(attr.name, attr.value);
    }
  });

  // Mark as wrapped
  dialog.setAttribute(attributes.wrapped, '');

  // Move element inside dialog (retains ALL original classes, styles, other attributes)
  element.replaceWith(dialog);
  dialog.appendChild(element);

  return dialog;
}

// Ensures a close button exists, injecting default if needed
function ensureCloseButton(instance) {
  const { dialog } = instance;

  // Check if user provided close button
  if (dialog.querySelector(selectors.close)) {
    return;
  }

  // Check for template anywhere in document
  const template = document.querySelector(selectors.closeTemplate);
  let closeBtn;

  if (template) {
    closeBtn = template.cloneNode(true);
    closeBtn.removeAttribute(attributes.closeTemplate);
  } else {
    closeBtn = document.createElement('button');
    closeBtn.setAttribute('type', 'button');
    closeBtn.setAttribute('aria-label', 'Close dialog');
    closeBtn.className = classes.closeDefault;
    closeBtn.textContent = '×';
  }

  closeBtn.setAttribute(attributes.close, '');

  // Insert after first heading, or as first child
  const heading = dialog.querySelector('h1, h2, h3, h4, h5, h6');
  if (heading) {
    heading.after(closeBtn);
  } else {
    dialog.prepend(closeBtn);
  }
}

// Sets up backdrop click to close using native closedby or fallback
function setupBackdropClose(instance) {
  const { dialog } = instance;

  // Use native closedby if supported
  if ('closedBy' in HTMLDialogElement.prototype) {
    dialog.closedBy = 'any';
    return;
  }

  // Fallback: detect clicks on dialog element itself (backdrop area)
  const handler = (e) => {
    if (e.target === dialog) {
      dialog.close();
    }
  };

  dialog.addEventListener('click', handler);
  instance.boundHandlers.backdropClick = handler;
}

// Sets up aria-controls on trigger if not already set
function setupTriggerAria(trigger, dialog) {
  if (!trigger.hasAttribute('aria-controls')) {
    // Ensure dialog has an ID
    if (!dialog.id) {
      dialog.id = `modal-dialog-${Date.now()}`;
    }
    trigger.setAttribute('aria-controls', dialog.id);
  }
}

// Finds a modal by its normalized value
function findModalByValue(value) {
  const modals = document.querySelectorAll(selectors.modal);
  for (const modal of modals) {
    const modalValue = normalizeValue(modal.getAttribute(attributes.value));
    if (modalValue === value) {
      return modal;
    }
  }
  return null;
}

// Handles trigger click, opening modal or replacing current modal
function handleTriggerClick(trigger, targetValue) {
  // Check if trigger is inside an open modal
  const parentModal = trigger.closest('dialog[open]');

  if (parentModal && parentModal._modal) {
    // Close current modal, then open next
    parentModal.close();

    const targetDialog = findModalByValue(targetValue);
    if (targetDialog && targetDialog._modal) {
      targetDialog._modal.open();
    } else {
      throw new Error(`Modal not found: "${targetValue}"`);
    }
  } else {
    // Normal open from trigger
    const targetDialog = findModalByValue(targetValue);
    if (!targetDialog) {
      throw new Error(`Modal not found: "${targetValue}"`);
    }

    if (targetDialog._modal) {
      targetDialog._modal.open();
    }
  }
}

// Attaches event listeners for close buttons and native close event
function attachEventListeners(instance) {
  const { dialog } = instance;

  // Close button listeners
  const closeButtons = dialog.querySelectorAll(selectors.close);
  instance.boundHandlers.closeButtons = [];

  closeButtons.forEach((btn) => {
    const handler = () => dialog.close();
    btn.addEventListener('click', handler);
    instance.boundHandlers.closeButtons.push({ btn, handler });
  });

  // Listen for native close event to handle scroll unlock
  const closeHandler = () => {
    instance.state.isOpen = false;
    if (instance.config.scrollLock) {
      unlock();
    }
    updateUrl(instance, 'close');
  };

  dialog.addEventListener('close', closeHandler);
  instance.boundHandlers.close = closeHandler;
}

// Updates URL query parameter based on modal open/close state
function updateUrl(instance, action) {
  const { dialog, config } = instance;
  const paramName = config.urlParam;

  if (!paramName) return;

  const url = new URL(window.location.href);

  if (action === 'open') {
    url.searchParams.set(paramName, '');
  } else {
    url.searchParams.delete(paramName);
  }

  history.replaceState(null, '', url.toString());
}

// Applies the position class to the dialog element
function applyPositionClass(instance) {
  const { dialog, config } = instance;
  const positionClass = `modal-${config.position}`;
  dialog.classList.add(positionClass);
}

// Initializes a modal instance
function init(instance) {
  const { dialog, id } = instance;

  // Validate we have a dialog
  if (!dialog || dialog.tagName !== 'DIALOG') {
    console.warn(`Modal ${id}: Invalid dialog element`);
    return false;
  }

  // Apply position class
  applyPositionClass(instance);

  // Ensure close button exists
  ensureCloseButton(instance);

  // Setup backdrop close behavior
  setupBackdropClose(instance);

  // Attach event listeners
  attachEventListeners(instance);

  return true;
}

// Cleans up all event listeners
function cleanup(instance) {
  const { dialog, boundHandlers } = instance;

  // Remove close button listeners
  if (boundHandlers.closeButtons) {
    boundHandlers.closeButtons.forEach(({ btn, handler }) => {
      btn.removeEventListener('click', handler);
    });
  }

  // Remove close event listener
  if (boundHandlers.close) {
    dialog.removeEventListener('close', boundHandlers.close);
  }

  // Remove backdrop click listener
  if (boundHandlers.backdropClick) {
    dialog.removeEventListener('click', boundHandlers.backdropClick);
  }
}

// Main Modal class
export class Modal {
  constructor(dialog) {
    this.id = generateUniqueId();
    this.dialog = dialog;
    this.value = normalizeValue(dialog.getAttribute(attributes.value));
    this.config = parseConfig(dialog);

    this.state = {
      isOpen: false,
    };

    this.boundHandlers = {};

    const initialized = init(this);
    if (initialized) {
      this.dialog._modal = this;
    } else {
      console.warn(`Modal ${this.id}: Initialization failed`);
    }
  }

  // Opens the modal
  open() {
    const { dialog, state, config } = this;

    // No-op if already open
    if (state.isOpen) return this;

    // Lock scroll
    if (config.scrollLock) {
      lock();
    }

    dialog.showModal();
    state.isOpen = true;

    // Update URL
    updateUrl(this, 'open');

    return this;
  }

  // Closes the modal
  close() {
    const { dialog, state } = this;

    // close() triggers the 'close' event which handles cleanup
    if (state.isOpen) {
      dialog.close();
    }

    return this;
  }

  // Re-initializes the modal after DOM changes
  refresh() {
    // Clean up current listeners
    cleanup(this);

    // Re-initialize
    this.boundHandlers = {};
    init(this);

    return this;
  }

  // Destroys the modal instance and cleans up
  destroy() {
    cleanup(this);

    // Remove instance reference
    delete this.dialog._modal;

    // Clear all properties
    this.dialog = null;
    this.config = null;
    this.state = null;
    this.boundHandlers = null;
  }
}

// Sets up global trigger listeners via event delegation
export function setupTriggerListeners() {
  // Use event delegation on document for all triggers
  document.addEventListener('click', (e) => {
    const trigger = e.target.closest(selectors.trigger);
    if (!trigger) return;

    e.preventDefault();

    const targetValue = normalizeValue(
      trigger.getAttribute(attributes.triggerValue)
    );

    // Setup aria-controls if not set
    const targetDialog = findModalByValue(targetValue);
    if (targetDialog) {
      setupTriggerAria(trigger, targetDialog);
    }

    handleTriggerClick(trigger, targetValue);
  });
}

// Opens modals based on URL parameters
export function openFromUrl() {
  const params = new URLSearchParams(window.location.search);

  document.querySelectorAll(`[${attributes.urlParam}]`).forEach((dialog) => {
    const paramName = dialog.getAttribute(attributes.urlParam);
    if (params.has(paramName) && dialog._modal) {
      dialog._modal.open();
    }
  });
}

// Export for use in modal.js
export { ensureDialog };
