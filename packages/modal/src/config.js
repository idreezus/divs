// Configuration constants for the modal library

// Builds a presence-based selector with opt-out support
const sel = (attr) => `[${attr}]:not([${attr}="false"])`;

// Raw attribute names for marker (presence-based) elements
export const selectorAttrs = {
  close: 'data-modal-close',
  closeTemplate: 'data-modal-close-template',
};

// DOM query selectors (marker attrs auto-derived, value attrs manual)
export const selectors = {
  ...Object.fromEntries(
    Object.entries(selectorAttrs).map(([k, v]) => [k, sel(v)])
  ),
  modal: '[data-modal-value]',
  trigger: '[data-modal-trigger-value]',
};

// Data attribute names for getAttribute/hasAttribute
export const attributes = {
  value: 'data-modal-value',
  triggerValue: 'data-modal-trigger-value',
  urlParam: 'data-modal-url-param',
  scrollLock: 'data-modal-scroll-lock',
  position: 'data-modal-position',
  wrapped: 'data-modal-wrapped',
  close: 'data-modal-close',
  closeTemplate: 'data-modal-close-template',
};

// CSS class names for state management
export const classes = {
  bodyOpen: 'modal-open',
  closeDefault: 'modal-close-default',
  positionCenter: 'modal-center',
  positionLeft: 'modal-left',
  positionRight: 'modal-right',
  positionTop: 'modal-top',
  positionBottom: 'modal-bottom',
};

// Default configuration values
export const defaults = {
  scrollLock: true,
  position: 'center',
};

// Valid position values for validation
export const validPositions = ['center', 'left', 'right', 'top', 'bottom'];
