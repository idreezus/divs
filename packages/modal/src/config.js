// Configuration constants for the modal library

// DOM query selectors for querySelectorAll
export const selectors = {
  modal: '[data-modal-value]',
  trigger: '[data-modal-trigger-value]',
  close: '[data-modal-close]',
  closeTemplate: '[data-modal-close-template]',
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
