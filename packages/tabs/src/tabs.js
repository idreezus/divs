// Core tabs library with initialization, keyboard navigation, accessibility, and entry point

import {
  SELECTORS,
  ATTRIBUTES,
  CLASSES,
  CSS_VARS,
  DEFAULTS,
  TIMING,
} from './config.js';
import {
  setupAutoplay,
  startAutoplay,
  pauseAutoplay,
  resumeAutoplay,
  cleanupAutoplay,
} from './autoplay.js';
import {
  emit,
  normalizeValue,
  generateUniqueId,
  prefersReducedMotion,
  getUrlParam,
  setUrlParam,
} from './utils.js';

// Finds the index of a trigger by its normalized value
function findTriggerIndex(triggers, targetValue) {
  return triggers.findIndex((trigger) => {
    const triggerValue = normalizeValue(
      trigger.getAttribute(ATTRIBUTES.TRIGGER_VALUE)
    );
    return triggerValue === targetValue;
  });
}

// Parses configuration from data attributes on the container
function parseConfig(container) {
  return {
    groupName: container.getAttribute(ATTRIBUTES.GROUP_NAME) || null,
    defaultValue: container.getAttribute(ATTRIBUTES.DEFAULT) || null,
    orientation:
      container.getAttribute(ATTRIBUTES.ORIENTATION) || DEFAULTS.ORIENTATION,
    activateOnFocus:
      container.getAttribute(ATTRIBUTES.ACTIVATE_ON_FOCUS) !== 'false',
    loop: container.getAttribute(ATTRIBUTES.LOOP) === 'true',
    keyboard: container.getAttribute(ATTRIBUTES.KEYBOARD) !== 'false',
    autoplay: container.getAttribute(ATTRIBUTES.AUTOPLAY) === 'true',
    autoplayDuration:
      parseInt(container.getAttribute(ATTRIBUTES.AUTOPLAY_DURATION), 10) ||
      DEFAULTS.AUTOPLAY_DURATION,
    autoplayPauseHover:
      container.getAttribute(ATTRIBUTES.AUTOPLAY_PAUSE_HOVER) !== 'false',
    autoplayPauseFocus:
      container.getAttribute(ATTRIBUTES.AUTOPLAY_PAUSE_FOCUS) !== 'false',
  };
}

// Finds and validates all elements within the tabs container
function findElements(instance) {
  const { container, id } = instance;

  // Scope to this container to support nested tabs
  const scopedQuery = (selector) => {
    return [...container.querySelectorAll(selector)].filter((el) => {
      return el.closest(SELECTORS.CONTAINER) === container;
    });
  };

  // Find triggers and panels
  const triggers = scopedQuery(SELECTORS.TRIGGER);
  const panels = scopedQuery(SELECTORS.PANEL);

  if (triggers.length === 0) {
    console.error(
      `Tabs ${id}: No triggers found. Expected elements with [data-tabs-trigger-value].`
    );
    return false;
  }

  if (panels.length === 0) {
    console.error(
      `Tabs ${id}: No panels found. Expected elements with [data-tabs-panel-value].`
    );
    return false;
  }

  // Build trigger and panel maps
  const triggerMap = new Map();
  const panelMap = new Map();
  let hasErrors = false;

  triggers.forEach((trigger) => {
    const rawValue = trigger.getAttribute(ATTRIBUTES.TRIGGER_VALUE);
    const value = normalizeValue(rawValue);

    if (!value) {
      console.error(`Tabs ${id}: Trigger has empty data-tabs-trigger-value.`);
      hasErrors = true;
      return;
    }

    // Warn if trigger is an <a> tag
    if (trigger.tagName.toLowerCase() === 'a') {
      console.warn(
        `Tabs ${id}: Trigger "${value}" is an <a> tag. Consider using <button> for better accessibility.`
      );
    }

    if (!triggerMap.has(value)) {
      triggerMap.set(value, []);
    }
    triggerMap.get(value).push(trigger);
  });

  panels.forEach((panel) => {
    const rawValue = panel.getAttribute(ATTRIBUTES.PANEL_VALUE);
    const value = normalizeValue(rawValue);

    if (!value) {
      console.error(`Tabs ${id}: Panel has empty data-tabs-panel-value.`);
      hasErrors = true;
      return;
    }

    panelMap.set(value, panel);
  });

  // Validate matching
  triggerMap.forEach((_, value) => {
    if (!panelMap.has(value)) {
      console.error(
        `Tabs ${id}: Trigger value "${value}" has no matching panel.`
      );
      hasErrors = true;
    }
  });

  panelMap.forEach((_, value) => {
    if (!triggerMap.has(value)) {
      console.error(
        `Tabs ${id}: Panel value "${value}" has no matching trigger.`
      );
      hasErrors = true;
    }
  });

  if (hasErrors) return false;

  // Find optional navigation buttons (scoped)
  const prevBtn = container.querySelector(SELECTORS.PREV_BTN);
  const nextBtn = container.querySelector(SELECTORS.NEXT_BTN);
  const playPauseBtn = container.querySelector(SELECTORS.PLAY_PAUSE_BTN);

  // Store references
  Object.assign(instance, {
    triggers,
    panels,
    triggerMap,
    panelMap,
    prevBtn,
    nextBtn,
    playPauseBtn,
  });

  return true;
}

// Sets up ARIA attributes for triggers and panels
function setupAccessibility(instance) {
  const { triggers, panels, id, config } = instance;

  // Set orientation on container
  instance.container.setAttribute('aria-orientation', config.orientation);

  triggers.forEach((trigger) => {
    const value = normalizeValue(
      trigger.getAttribute(ATTRIBUTES.TRIGGER_VALUE)
    );
    const triggerId = trigger.id || `${id}-trigger-${value}`;
    const panelId = `${id}-panel-${value}`;

    trigger.setAttribute('role', 'tab');
    trigger.id = triggerId;
    trigger.setAttribute('aria-controls', panelId);
  });

  panels.forEach((panel) => {
    const value = normalizeValue(panel.getAttribute(ATTRIBUTES.PANEL_VALUE));
    const panelId = panel.id || `${id}-panel-${value}`;
    const triggerId = `${id}-trigger-${value}`;

    panel.setAttribute('role', 'tabpanel');
    panel.id = panelId;
    panel.setAttribute('aria-labelledby', triggerId);
    panel.setAttribute('tabindex', '0');
  });
}

// Updates ARIA states when active tab changes
function updateAriaStates(instance) {
  const { triggers, panels, state } = instance;

  triggers.forEach((trigger) => {
    const value = normalizeValue(
      trigger.getAttribute(ATTRIBUTES.TRIGGER_VALUE)
    );
    const isActive = value === state.activeValue;

    trigger.setAttribute('aria-selected', isActive.toString());
    trigger.setAttribute('tabindex', isActive ? '0' : '-1');
  });

  panels.forEach((panel) => {
    const value = normalizeValue(panel.getAttribute(ATTRIBUTES.PANEL_VALUE));
    const isActive = value === state.activeValue;

    panel.setAttribute('aria-hidden', (!isActive).toString());
  });
}

// Sets up keyboard navigation for triggers
function setupKeyboardNavigation(instance) {
  const { container, config } = instance;

  const handleKeydown = (e) => {
    // Only handle if a trigger within this container has focus
    const focusedTrigger = document.activeElement;
    if (
      !instance.triggers.includes(focusedTrigger) ||
      focusedTrigger.closest(SELECTORS.CONTAINER) !== container
    ) {
      return;
    }

    const isHorizontal = config.orientation === 'horizontal';
    const prevKey = isHorizontal ? 'ArrowLeft' : 'ArrowUp';
    const nextKey = isHorizontal ? 'ArrowRight' : 'ArrowDown';

    switch (e.key) {
      case prevKey:
        e.preventDefault();
        moveFocus(instance, -1);
        break;

      case nextKey:
        e.preventDefault();
        moveFocus(instance, 1);
        break;

      case 'Home':
        e.preventDefault();
        focusTriggerAt(instance, 0);
        break;

      case 'End':
        e.preventDefault();
        focusTriggerAt(instance, instance.triggers.length - 1);
        break;

      case 'Enter':
      case ' ':
        // Only needed if activate-on-focus is false
        if (!config.activateOnFocus) {
          e.preventDefault();
          const value = focusedTrigger.getAttribute(ATTRIBUTES.TRIGGER_VALUE);
          activate(instance, value);
        }
        break;
    }
  };

  instance.keyboardHandler = handleKeydown;
  container.addEventListener('keydown', handleKeydown);
}

// Moves focus by a given direction (-1 or +1)
function moveFocus(instance, direction) {
  const { triggers, config, state } = instance;
  const currentIndex = triggers.indexOf(document.activeElement);

  if (currentIndex === -1) return;

  let nextIndex = currentIndex + direction;

  if (config.loop) {
    nextIndex = (nextIndex + triggers.length) % triggers.length;
  } else {
    nextIndex = Math.max(0, Math.min(nextIndex, triggers.length - 1));
  }

  triggers[nextIndex].focus();

  // Pause autoplay on keyboard interaction
  if (state.isAutoplaying) {
    pauseAutoplay(instance, 'keyboard');
  }

  // Activate if activate-on-focus is true
  if (config.activateOnFocus) {
    const value = triggers[nextIndex].getAttribute(ATTRIBUTES.TRIGGER_VALUE);
    activate(instance, value);
  }
}

// Focuses trigger at a specific index
function focusTriggerAt(instance, index) {
  const { triggers, config, state } = instance;

  triggers[index].focus();

  if (state.isAutoplaying) {
    pauseAutoplay(instance, 'keyboard');
  }

  if (config.activateOnFocus) {
    const value = triggers[index].getAttribute(ATTRIBUTES.TRIGGER_VALUE);
    activate(instance, value);
  }
}

// Determines the initial active value
function determineInitialValue(instance) {
  const { config, triggerMap, triggers } = instance;

  // Priority 1: URL parameter
  if (config.groupName) {
    const urlValue = getUrlParam(config.groupName);
    if (urlValue) {
      const normalized = normalizeValue(urlValue);
      if (triggerMap.has(normalized)) {
        return normalized;
      }
      console.warn(
        `Tabs ${instance.id}: URL param "${urlValue}" doesn't match any trigger.`
      );
    }
  }

  // Priority 2: data-tabs-default attribute
  if (config.defaultValue) {
    const normalized = normalizeValue(config.defaultValue);
    if (triggerMap.has(normalized)) {
      return normalized;
    }
  }

  // Priority 3: First trigger
  const firstValue = triggers[0].getAttribute(ATTRIBUTES.TRIGGER_VALUE);
  return normalizeValue(firstValue);
}

// Activates a tab by its value
function activate(instance, value, options = {}) {
  const { silent = false, updateUrl = true } = options;
  const normalized = normalizeValue(value);
  const { state, config, triggerMap, panelMap, triggers, panels, container } =
    instance;

  if (!triggerMap.has(normalized)) {
    console.warn(`Tabs ${instance.id}: Value "${value}" not found.`);
    return false;
  }

  const previousValue = state.activeValue;

  // Skip if already active
  if (normalized === previousValue) return false;

  // Calculate indices for CSS variables
  const newIndex = findTriggerIndex(triggers, normalized);
  const previousIndex = previousValue
    ? findTriggerIndex(triggers, previousValue)
    : -1;

  // Set active index CSS variable
  container.style.setProperty(CSS_VARS.ACTIVE_INDEX, newIndex);

  // Set direction CSS variable (1 = forward, -1 = backward, 0 = initial)
  const direction =
    previousIndex === -1 ? 0 : newIndex > previousIndex ? 1 : -1;
  container.style.setProperty(CSS_VARS.DIRECTION, direction);

  // Update state
  state.activeValue = normalized;

  // Reset autoplay timer if active
  if (state.isAutoplaying && !state.isPaused) {
    state.autoplayStartTime = performance.now();
  }

  // Update URL
  if (updateUrl && config.groupName) {
    setUrlParam(config.groupName, normalized);
  }

  // Add transitioning class
  container.classList.add(CLASSES.TRANSITIONING);

  // Update trigger states
  triggers.forEach((trigger) => {
    const triggerValue = normalizeValue(
      trigger.getAttribute(ATTRIBUTES.TRIGGER_VALUE)
    );
    const isActive = triggerValue === normalized;

    trigger.classList.toggle(CLASSES.ACTIVE, isActive);
    trigger.classList.toggle(CLASSES.INACTIVE, !isActive);

    // Reset progress on inactive triggers
    if (!isActive) {
      trigger.style.setProperty(CSS_VARS.PROGRESS, '0');
    }
  });

  // Update panel states
  panels.forEach((panel) => {
    const panelValue = normalizeValue(
      panel.getAttribute(ATTRIBUTES.PANEL_VALUE)
    );
    const isActive = panelValue === normalized;
    const wasActive = panelValue === previousValue;

    // Remove previous transition classes
    panel.classList.remove(CLASSES.PANEL_ENTERING, CLASSES.PANEL_LEAVING);

    if (isActive) {
      panel.classList.add(CLASSES.ACTIVE, CLASSES.PANEL_ENTERING);
      panel.classList.remove(CLASSES.INACTIVE);
    } else if (wasActive) {
      panel.classList.add(CLASSES.INACTIVE, CLASSES.PANEL_LEAVING);
      panel.classList.remove(CLASSES.ACTIVE);
    } else {
      panel.classList.add(CLASSES.INACTIVE);
      panel.classList.remove(CLASSES.ACTIVE);
    }
  });

  // Remove transition classes after animation
  setTimeout(() => {
    container.classList.remove(CLASSES.TRANSITIONING);
    panels.forEach((panel) => {
      panel.classList.remove(CLASSES.PANEL_ENTERING, CLASSES.PANEL_LEAVING);
    });
  }, TIMING.TRANSITION_DURATION);

  // Update ARIA states
  updateAriaStates(instance);

  // Update navigation button states
  updateButtonStates(instance);

  // Emit change event
  if (!silent) {
    emit(instance, 'change', {
      value: normalized,
      previousValue,
    });
  }

  return true;
}

// Updates prev/next button disabled states
function updateButtonStates(instance) {
  const { triggers, prevBtn, nextBtn, config, state } = instance;

  if (!prevBtn && !nextBtn) return;
  if (config.loop) {
    // Never disabled when looping
    prevBtn?.classList.remove(CLASSES.BUTTON_DISABLED);
    nextBtn?.classList.remove(CLASSES.BUTTON_DISABLED);
    return;
  }

  const currentIndex = findTriggerIndex(triggers, state.activeValue);

  if (prevBtn) {
    prevBtn.classList.toggle(CLASSES.BUTTON_DISABLED, currentIndex === 0);
  }
  if (nextBtn) {
    nextBtn.classList.toggle(
      CLASSES.BUTTON_DISABLED,
      currentIndex === triggers.length - 1
    );
  }
}

// Attaches click handlers to triggers and navigation buttons
function attachEventListeners(instance) {
  const { triggers, prevBtn, nextBtn, playPauseBtn, state } = instance;

  instance.boundHandlers = {
    triggerClicks: [],
    prev: null,
    next: null,
    playPause: null,
  };

  // Trigger click handlers
  triggers.forEach((trigger) => {
    const handler = (e) => {
      e.preventDefault();
      const value = trigger.getAttribute(ATTRIBUTES.TRIGGER_VALUE);

      // Pause autoplay on user interaction
      if (state.isAutoplaying) {
        pauseAutoplay(instance, 'user');
      }

      activate(instance, value);
    };

    trigger.addEventListener('click', handler);
    instance.boundHandlers.triggerClicks.push({ trigger, handler });
  });

  // Prev button
  if (prevBtn) {
    instance.boundHandlers.prev = () => instance.prev();
    prevBtn.addEventListener('click', instance.boundHandlers.prev);
  }

  // Next button
  if (nextBtn) {
    instance.boundHandlers.next = () => instance.next();
    nextBtn.addEventListener('click', instance.boundHandlers.next);
  }

  // Play/pause button
  if (playPauseBtn) {
    instance.boundHandlers.playPause = () => {
      if (state.isAutoplaying && !state.isPaused) {
        instance.pause();
      } else {
        instance.play();
      }
    };
    playPauseBtn.addEventListener('click', instance.boundHandlers.playPause);
    playPauseBtn.setAttribute('aria-pressed', 'false');
  }
}

// Cleans up all event listeners and references
function cleanup(instance) {
  const { container, prevBtn, nextBtn, playPauseBtn, boundHandlers } = instance;

  // Remove trigger click handlers
  if (boundHandlers?.triggerClicks) {
    boundHandlers.triggerClicks.forEach(({ trigger, handler }) => {
      trigger.removeEventListener('click', handler);
    });
  }

  // Remove navigation handlers
  if (prevBtn && boundHandlers?.prev) {
    prevBtn.removeEventListener('click', boundHandlers.prev);
  }
  if (nextBtn && boundHandlers?.next) {
    nextBtn.removeEventListener('click', boundHandlers.next);
  }
  if (playPauseBtn && boundHandlers?.playPause) {
    playPauseBtn.removeEventListener('click', boundHandlers.playPause);
  }

  // Remove keyboard handler
  if (instance.keyboardHandler) {
    container.removeEventListener('keydown', instance.keyboardHandler);
  }

  // Cleanup autoplay
  cleanupAutoplay(instance);
}

// Initializes a tabs instance
function init(instance) {
  const { container, config } = instance;

  // Find and validate elements
  if (!findElements(instance)) {
    return false;
  }

  // Set CSS variables
  container.style.setProperty(CSS_VARS.TAB_COUNT, instance.triggers.length);
  instance.triggers.forEach((trigger, index) => {
    trigger.style.setProperty(CSS_VARS.TAB_INDEX, index);
  });
  instance.panels.forEach((panel, index) => {
    panel.style.setProperty(CSS_VARS.TAB_INDEX, index);
  });

  // Setup accessibility
  setupAccessibility(instance);

  // Determine and activate initial tab
  const initialValue = determineInitialValue(instance);
  activate(instance, initialValue, { silent: true, updateUrl: false });

  // Attach event listeners
  attachEventListeners(instance);

  // Setup keyboard navigation
  if (config.keyboard) {
    setupKeyboardNavigation(instance);
  }

  // Check for reduced motion
  if (prefersReducedMotion()) {
    container.classList.add(CLASSES.REDUCED_MOTION);
  }

  // Setup autoplay if enabled and reduced motion not preferred
  if (config.autoplay && !prefersReducedMotion()) {
    container.style.setProperty(
      CSS_VARS.AUTOPLAY_DURATION,
      config.autoplayDuration + 'ms'
    );
    setupAutoplay(instance);
    startAutoplay(instance);
  }

  // Store instance ID on container for lookup
  container.setAttribute('data-tabs-id', instance.id);

  return true;
}

// Main Tabs class
export class Tabs {
  constructor(container) {
    this.id = generateUniqueId();
    this.container = container;
    this.config = parseConfig(container);

    this.state = {
      activeValue: null,
      isAutoplaying: false,
      isPaused: false,
      autoplayStartTime: null,
      autoplayElapsed: 0,
      autoplayPausedOnValue: null,
    };

    this.events = new Map();
    this.boundHandlers = null;
    this.keyboardHandler = null;
    this.autoplay = null;

    // Element references (populated by findElements)
    this.triggers = [];
    this.panels = [];
    this.triggerMap = new Map();
    this.panelMap = new Map();
    this.prevBtn = null;
    this.nextBtn = null;
    this.playPauseBtn = null;

    const initialized = init(this);
    if (!initialized) {
      console.warn(`Tabs ${this.id}: Initialization failed.`);
    }
  }

  // Navigates to a tab by value
  goTo(value) {
    activate(this, value);
    return this;
  }

  // Navigates to the next tab
  next() {
    const { triggers, config, state } = this;
    const currentIndex = findTriggerIndex(triggers, state.activeValue);

    let nextIndex = currentIndex + 1;
    if (config.loop) {
      nextIndex = nextIndex % triggers.length;
    } else {
      nextIndex = Math.min(nextIndex, triggers.length - 1);
    }

    const nextValue = triggers[nextIndex].getAttribute(
      ATTRIBUTES.TRIGGER_VALUE
    );
    activate(this, nextValue);
    return this;
  }

  // Navigates to the previous tab
  prev() {
    const { triggers, config, state } = this;
    const currentIndex = findTriggerIndex(triggers, state.activeValue);

    let prevIndex = currentIndex - 1;
    if (config.loop) {
      prevIndex = (prevIndex + triggers.length) % triggers.length;
    } else {
      prevIndex = Math.max(prevIndex, 0);
    }

    const prevValue = triggers[prevIndex].getAttribute(
      ATTRIBUTES.TRIGGER_VALUE
    );
    activate(this, prevValue);
    return this;
  }

  // Starts autoplay
  play() {
    if (prefersReducedMotion()) return this;

    if (!this.autoplay) {
      setupAutoplay(this);
    }

    // Set autoplay duration CSS variable
    this.container.style.setProperty(
      CSS_VARS.AUTOPLAY_DURATION,
      this.config.autoplayDuration + 'ms'
    );

    this.autoplay.pausedByUser = false;
    startAutoplay(this);
    return this;
  }

  // Pauses autoplay
  pause() {
    pauseAutoplay(this, 'user');
    return this;
  }

  // Re-initializes after DOM changes
  refresh() {
    const currentValue = this.state.activeValue;
    const events = this.events;

    cleanup(this);

    this.config = parseConfig(this.container);
    this.state = {
      activeValue: null,
      isAutoplaying: false,
      isPaused: false,
      autoplayStartTime: null,
      autoplayElapsed: 0,
      autoplayPausedOnValue: null,
    };
    this.events = events; // Preserve event subscriptions
    this.boundHandlers = null;
    this.keyboardHandler = null;
    this.autoplay = null;
    this.triggers = [];
    this.panels = [];
    this.triggerMap = new Map();
    this.panelMap = new Map();

    init(this);

    // Try to restore previous active value
    if (currentValue && this.triggerMap.has(currentValue)) {
      activate(this, currentValue, { silent: true });
    }

    return this;
  }

  // Destroys the instance
  destroy() {
    instances.delete(this.id);
    cleanup(this);
    return null;
  }

  // Returns the current active value
  getActiveValue() {
    return this.state.activeValue;
  }

  // Subscribes to an event
  on(event, callback) {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event).push(callback);
    return this;
  }

  // Unsubscribes from an event
  off(event, callback) {
    if (!this.events.has(event)) return this;

    const callbacks = this.events.get(event);
    const index = callbacks.indexOf(callback);
    if (index > -1) {
      callbacks.splice(index, 1);
    }
    return this;
  }

  // Static method for manual initialization
  static init(container) {
    if (typeof container === 'string') {
      container = document.querySelector(container);
    }
    if (!container) {
      throw new Error('Tabs.init(): Container element not found');
    }
    return new Tabs(container);
  }
}

const instances = new Map();

// Auto-initializes all tabs containers
function autoInit() {
  const containers = document.querySelectorAll(SELECTORS.CONTAINER);

  containers.forEach((container) => {
    try {
      const tabs = new Tabs(container);
      if (tabs.id) {
        instances.set(tabs.id, tabs);
      }
    } catch (error) {
      console.warn('Tabs auto-initialization failed:', error);
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', autoInit);
} else {
  autoInit();
}

// Global API object
const TabsAPI = {
  // Initialize a new instance manually
  init(selector) {
    if (!selector) {
      // Re-run auto-init for any new containers
      autoInit();
      return;
    }

    const container =
      typeof selector === 'string'
        ? document.querySelector(selector)
        : selector;

    if (!container) {
      throw new Error('Tabs.init(): Container element not found');
    }

    const tabs = new Tabs(container);
    if (tabs.id) {
      instances.set(tabs.id, tabs);
    }
    return tabs;
  },

  // Get instance by ID or element
  get(idOrElement) {
    if (typeof idOrElement === 'string') {
      // Try as ID first
      if (instances.has(idOrElement)) {
        return instances.get(idOrElement);
      }
      // Try as selector
      const container = document.querySelector(idOrElement);
      if (container) {
        const id = container.getAttribute('data-tabs-id');
        return id ? instances.get(id) : null;
      }
      return null;
    }

    // Element
    const id = idOrElement.getAttribute('data-tabs-id');
    return id ? instances.get(id) : null;
  },

  // Get all instances
  getAll() {
    return Array.from(instances.values());
  },

  // Destroy instances
  destroy(selector) {
    if (!selector) {
      // Destroy all
      instances.forEach((tabs) => tabs.destroy());
      instances.clear();
      return;
    }

    const tabs = this.get(selector);
    if (tabs) {
      instances.delete(tabs.id);
      tabs.destroy();
    }
  },
};

// Expose to window
if (typeof window !== 'undefined') {
  window.Tabs = TabsAPI;
}
