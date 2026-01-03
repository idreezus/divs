/*!
 * Modal v1.0.0
 * A lightweight modal library built on native HTML dialog elements.
 *
 * A part of Divs by Idreezus, a component library
 * divs.idreezus.com
 *
 * (c) 2026 Idrees Isse (https://github.com/idreezus)
 * Released under AGPL-3.0
 */

var Modal = (function (exports) {
  'use strict';

  /**
   * Modal configuration constants
   *
   * Organized by type following the component design guidelines:
   * - selectors: DOM query strings
   * - attributes: Data attribute names
   * - classes: CSS class names for state
   * - defaults: Fallback configuration values
   */

  // DOM query selectors for querySelectorAll
  const selectors = {
    modal: '[data-modal-value]',
    trigger: '[data-modal-trigger-value]',
    close: '[data-modal-close]',
    closeTemplate: '[data-modal-close-template]',
  };

  // Data attribute names for getAttribute/hasAttribute
  const attributes = {
    value: 'data-modal-value',
    triggerValue: 'data-modal-trigger-value',
    urlParam: 'data-modal-url-param',
    scrollLock: 'data-modal-scroll-lock',
    wrapped: 'data-modal-wrapped',
    close: 'data-modal-close',
    closeTemplate: 'data-modal-close-template',
  };

  // CSS class names for state management
  const classes = {
    bodyOpen: 'modal-open',
    closeDefault: 'modal-close-default',
  };

  /**
   * Shared utility functions for the modal library
   */

  let idCounter = 0;

  /**
   * Generates a unique ID for each modal instance
   * @returns {string} Unique modal ID (e.g., 'modal-1')
   */
  function generateUniqueId() {
    idCounter += 1;
    return `modal-${idCounter}`;
  }

  /**
   * Normalizes a value string to lowercase, hyphenated format
   * @param {string} value - The value to normalize
   * @returns {string} Normalized value
   */
  function normalizeValue(value) {
    if (!value) return '';
    return value.toLowerCase().replace(/\s+/g, '-');
  }

  /**
   * Scroll lock module for modal dialogs
   *
   * Preserves scroll position when modal opens and restores it when closed.
   * Adds 'modal-open' class to body for CSS scroll lock (user provides CSS).
   *
   * Example user CSS:
   * body.modal-open { overflow: hidden; }
   */


  // Track number of open modals for nested scroll lock
  let openCount = 0;
  let scrollY = 0;

  /**
   * Locks body scroll when a modal opens
   * Only applies on first modal open (supports multiple open modals)
   */
  function lock() {
    openCount += 1;

    // Only lock on first modal
    if (openCount === 1) {
      scrollY = window.scrollY;
      document.body.classList.add(classes.bodyOpen);
    }
  }

  /**
   * Unlocks body scroll when a modal closes
   * Only restores on last modal close
   */
  function unlock() {
    openCount -= 1;

    // Only unlock when all modals are closed
    if (openCount <= 0) {
      openCount = 0;
      document.body.classList.remove(classes.bodyOpen);
      window.scrollTo(0, scrollY);
    }
  }

  /**
   * Modal core module
   *
   * Main Modal class and lifecycle management built on native <dialog>.
   * Handles initialization, triggers, close buttons, and cleanup.
   */


  /**
   * Parses configuration from data attributes
   * @param {HTMLDialogElement} dialog - The dialog element
   * @returns {Object} Parsed configuration
   */
  function parseConfig(dialog) {
    return {
      scrollLock: dialog.getAttribute(attributes.scrollLock) !== 'false',
      urlParam: dialog.getAttribute(attributes.urlParam) || null,
    };
  }

  /**
   * Wraps a non-dialog element in a real <dialog>
   * @param {HTMLElement} element - Element with data-modal-value
   * @returns {HTMLDialogElement} The dialog element (original or wrapper)
   */
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

  /**
   * Ensures a close button exists in the modal
   * Injects default or clones from template if not present
   * @param {Object} instance - Modal instance
   */
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

  /**
   * Sets up backdrop click to close behavior
   * Uses native closedby="any" if supported, otherwise fallback
   * @param {Object} instance - Modal instance
   */
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

  /**
   * Sets up aria-controls on trigger if not already set
   * @param {HTMLElement} trigger - Trigger element
   * @param {HTMLDialogElement} dialog - Target dialog
   */
  function setupTriggerAria(trigger, dialog) {
    if (!trigger.hasAttribute('aria-controls')) {
      // Ensure dialog has an ID
      if (!dialog.id) {
        dialog.id = `modal-dialog-${Date.now()}`;
      }
      trigger.setAttribute('aria-controls', dialog.id);
    }
  }

  /**
   * Finds a modal by its normalized value
   * @param {string} value - Normalized modal value
   * @returns {HTMLDialogElement|null} The dialog element or null
   */
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

  /**
   * Handles trigger click - opens modal, handles replacement
   * @param {HTMLElement} trigger - The clicked trigger
   * @param {string} targetValue - Normalized target modal value
   */
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

  /**
   * Attaches event listeners for triggers and close buttons
   * @param {Object} instance - Modal instance
   */
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

  /**
   * Updates URL based on modal state
   * @param {Object} instance - Modal instance
   * @param {string} action - 'open' or 'close'
   */
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

  /**
   * Initializes a modal instance
   * @param {Object} instance - Modal instance
   * @returns {boolean} Whether initialization succeeded
   */
  function init(instance) {
    const { dialog, id } = instance;

    // Validate we have a dialog
    if (!dialog || dialog.tagName !== 'DIALOG') {
      console.warn(`Modal ${id}: Invalid dialog element`);
      return false;
    }

    // Ensure close button exists
    ensureCloseButton(instance);

    // Setup backdrop close behavior
    setupBackdropClose(instance);

    // Attach event listeners
    attachEventListeners(instance);

    return true;
  }

  /**
   * Cleans up event listeners
   * @param {Object} instance - Modal instance
   */
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

  /**
   * Modal class
   *
   * Built on native <dialog> element. Handles initialization, triggers,
   * close buttons, scroll lock, and URL integration.
   */
  class Modal {
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

    /**
     * Opens the modal
     * @returns {Modal} The instance for chaining
     */
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

    /**
     * Closes the modal
     * @returns {Modal} The instance for chaining
     */
    close() {
      const { dialog, state } = this;

      // close() triggers the 'close' event which handles cleanup
      if (state.isOpen) {
        dialog.close();
      }

      return this;
    }

    /**
     * Re-initializes the modal after DOM changes
     * Also discovers and initializes any new modals
     * @returns {Modal} The instance for chaining
     */
    refresh() {
      // Clean up current listeners
      cleanup(this);

      // Re-initialize
      this.boundHandlers = {};
      init(this);

      return this;
    }

    /**
     * Destroys the modal instance and cleans up
     */
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

  /**
   * Sets up global trigger listeners
   * Called once during auto-init
   */
  function setupTriggerListeners() {
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

  /**
   * Opens modals based on URL parameters
   * Called during auto-init
   */
  function openFromUrl() {
    const params = new URLSearchParams(window.location.search);

    document.querySelectorAll(`[${attributes.urlParam}]`).forEach((dialog) => {
      const paramName = dialog.getAttribute(attributes.urlParam);
      if (params.has(paramName) && dialog._modal) {
        dialog._modal.open();
      }
    });
  }

  /**
   * Modal library entry point
   *
   * Auto-initializes all modal elements on DOMContentLoaded.
   * Built on native <dialog> element.
   *
   * @example
   * <!-- Trigger (anywhere in document) -->
   * <button data-modal-trigger-value="login">Open Login</button>
   *
   * <!-- Modal -->
   * <dialog data-modal-value="login">
   *   <button data-modal-close>Close</button>
   *   <h2>Login</h2>
   *   <form>...</form>
   * </dialog>
   */


  /**
   * Auto-initializes all modals on the page
   * Called on DOMContentLoaded or immediately if DOM is ready
   */
  function autoInit() {
    // Find all modal elements
    const modalElements = document.querySelectorAll(selectors.modal);

    modalElements.forEach((element) => {
      // Skip if already initialized
      if (element._modal) return;

      try {
        // Wrap non-dialog elements in <dialog>
        const dialog = ensureDialog(element);

        // Create modal instance
        new Modal(dialog);
      } catch (error) {
        console.warn('Modal auto-initialization failed:', error);
      }
    });

    // Setup global trigger listeners (event delegation)
    setupTriggerListeners();

    // Check URL for deep-linked modals
    openFromUrl();
  }

  // Execute on DOMContentLoaded or immediately if DOM is already ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit);
  } else {
    autoInit();
  }

  exports.Modal = Modal;

  return exports;

})({});
//# sourceMappingURL=modal.js.map
