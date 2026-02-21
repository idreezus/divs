// Core tabs library with Tabs class and initialization logic

import {
  selectors,
  attributes,
  classes,
  cssProps,
  defaults,
  events,
} from './config.js';
import {
  setupAutoplay,
  startAutoplay,
  stopAutoplay,
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

// Internal registry for instance lookup (used by destroy)
const instances = new Map();

// Finds the index of a trigger by its normalized value
function findTriggerIndex(triggers, targetValue) {
  return triggers.findIndex((trigger) => {
    const value = normalizeValue(
      trigger.getAttribute(attributes.triggerId)
    );
    return value === targetValue;
  });
}

// Parses configuration from data attributes on the container
function parseConfig(container) {
  return {
    groupName: container.getAttribute(attributes.groupName) || null,
    defaultValue: container.getAttribute(attributes.default) || null,
    orientation:
      container.getAttribute(attributes.orientation) || defaults.orientation,
    activateOnFocus:
      container.getAttribute(attributes.activateOnFocus) !== 'false',
    loop: container.getAttribute(attributes.loop) === 'true',
    keyboard: container.getAttribute(attributes.keyboard) !== 'false',
    autoplay: container.getAttribute(attributes.autoplay) === 'true',
    autoplayDuration:
      parseInt(container.getAttribute(attributes.autoplayDuration), 10) ||
      defaults.autoplayDuration,
    autoplayPauseHover:
      container.getAttribute(attributes.autoplayPauseHover) === 'true',
    autoplayPauseFocus:
      container.getAttribute(attributes.autoplayPauseFocus) !== 'false',
  };
}

// Finds and validates all elements within the tabs container
function findElements(instance) {
  const { container, id } = instance;

  // Scope to this container to support nested tabs
  const scopedQuery = (selector) => {
    return [...container.querySelectorAll(selector)].filter((el) => {
      return el.closest(selectors.container) === container;
    });
  };

  // Find triggers and panels
  const triggers = scopedQuery(selectors.trigger);
  const panels = scopedQuery(selectors.panel);

  if (triggers.length === 0) {
    console.error(
      `Tabs ${id}: No triggers found. Expected elements with [data-tabs-trigger-id].`
    );
    return false;
  }

  if (panels.length === 0) {
    console.error(
      `Tabs ${id}: No panels found. Expected elements with [data-tabs-panel-id].`
    );
    return false;
  }

  // Build trigger and panel maps
  const triggerMap = new Map();
  const panelMap = new Map();
  let hasErrors = false;

  triggers.forEach((trigger) => {
    const rawValue = trigger.getAttribute(attributes.triggerId);
    const value = normalizeValue(rawValue);

    if (!value) {
      console.error(`Tabs ${id}: Trigger has empty data-tabs-trigger-id.`);
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
    const rawValue = panel.getAttribute(attributes.panelId);
    const value = normalizeValue(rawValue);

    if (!value) {
      console.error(`Tabs ${id}: Panel has empty data-tabs-panel-id.`);
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
  const prevBtn = container.querySelector(selectors.prevBtn);
  const nextBtn = container.querySelector(selectors.nextBtn);
  const playPauseBtn = container.querySelector(selectors.playPauseBtn);

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
    const value = normalizeValue(trigger.getAttribute(attributes.triggerId));
    const triggerId = trigger.id || `${id}-trigger-${value}`;
    const panelId = `${id}-panel-${value}`;

    trigger.setAttribute('role', 'tab');
    trigger.id = triggerId;
    trigger.setAttribute('aria-controls', panelId);
  });

  panels.forEach((panel) => {
    const value = normalizeValue(panel.getAttribute(attributes.panelId));
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
    const value = normalizeValue(trigger.getAttribute(attributes.triggerId));
    const isActive = value === state.activeValue;

    trigger.setAttribute('aria-selected', isActive.toString());
    trigger.setAttribute('tabindex', isActive ? '0' : '-1');
  });

  panels.forEach((panel) => {
    const value = normalizeValue(panel.getAttribute(attributes.panelId));
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
      focusedTrigger.closest(selectors.container) !== container
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
          const value = focusedTrigger.getAttribute(attributes.triggerId);
          activate(instance, value);
        }
        break;
    }
  };

  instance.boundHandlers.keyboard = handleKeydown;
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

  // Stop autoplay on keyboard interaction
  if (state.isAutoplaying) {
    stopAutoplay(instance, 'user');
  }

  // Activate if activate-on-focus is true
  if (config.activateOnFocus) {
    const value = triggers[nextIndex].getAttribute(attributes.triggerId);
    activate(instance, value);
  }
}

// Focuses trigger at a specific index
function focusTriggerAt(instance, index) {
  const { triggers, config, state } = instance;

  triggers[index].focus();

  if (state.isAutoplaying) {
    stopAutoplay(instance, 'user');
  }

  if (config.activateOnFocus) {
    const value = triggers[index].getAttribute(attributes.triggerId);
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
  const firstValue = triggers[0].getAttribute(attributes.triggerId);
  return normalizeValue(firstValue);
}

// Activates a tab by its value
function activate(instance, value, options = {}) {
  const { silent = false, updateUrl = true } = options;
  const normalized = normalizeValue(value);
  const { state, config, triggerMap, triggers, panels, container } = instance;

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
  container.style.setProperty(cssProps.activeIndex, newIndex);

  // Set direction CSS variable (1 = forward, -1 = backward, 0 = initial)
  const direction =
    previousIndex === -1 ? 0 : newIndex > previousIndex ? 1 : -1;
  container.style.setProperty(cssProps.direction, direction);

  // Update state
  state.activeValue = normalized;

  // Update URL
  if (updateUrl && config.groupName) {
    setUrlParam(config.groupName, normalized);
  }

  // Add transitioning class
  container.classList.add(classes.transitioning);

  // Update trigger states
  triggers.forEach((trigger) => {
    const value = normalizeValue(
      trigger.getAttribute(attributes.triggerId)
    );
    const isActive = value === normalized;

    trigger.classList.toggle(classes.active, isActive);
    trigger.classList.toggle(classes.inactive, !isActive);

    // Reset progress on inactive triggers
    if (!isActive) {
      trigger.style.setProperty(cssProps.progress, '0');
    }
  });

  // Update panel states
  panels.forEach((panel) => {
    const value = normalizeValue(panel.getAttribute(attributes.panelId));
    const isActive = value === normalized;
    const wasActive = value === previousValue;

    // Remove previous transition classes
    panel.classList.remove(classes.panelEntering, classes.panelLeaving);

    if (isActive) {
      panel.classList.add(classes.active, classes.panelEntering);
      panel.classList.remove(classes.inactive);
    } else if (wasActive) {
      panel.classList.add(classes.inactive, classes.panelLeaving);
      panel.classList.remove(classes.active);
    } else {
      panel.classList.add(classes.inactive);
      panel.classList.remove(classes.active);
    }
  });

  // Remove transition classes after animation
  setTimeout(() => {
    container.classList.remove(classes.transitioning);
    panels.forEach((panel) => {
      panel.classList.remove(classes.panelEntering, classes.panelLeaving);
    });
  }, defaults.transitionDuration);

  // Update ARIA states
  updateAriaStates(instance);

  // Update navigation button states
  updateButtonStates(instance);

  // Emit change event
  if (!silent) {
    emit(instance, events.change, {
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
    prevBtn?.classList.remove(classes.buttonDisabled);
    nextBtn?.classList.remove(classes.buttonDisabled);
    return;
  }

  const currentIndex = findTriggerIndex(triggers, state.activeValue);

  if (prevBtn) {
    prevBtn.classList.toggle(classes.buttonDisabled, currentIndex === 0);
  }
  if (nextBtn) {
    nextBtn.classList.toggle(
      classes.buttonDisabled,
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
    keyboard: null,
  };

  // Trigger click handlers
  triggers.forEach((trigger) => {
    const handler = (e) => {
      e.preventDefault();
      const value = trigger.getAttribute(attributes.triggerId);

      // Stop autoplay on user interaction
      if (state.isAutoplaying) {
        stopAutoplay(instance, 'user');
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
      if (state.isAutoplaying) {
        stopAutoplay(instance, 'user');
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
  if (boundHandlers?.keyboard) {
    container.removeEventListener('keydown', boundHandlers.keyboard);
  }

  // Cleanup autoplay
  cleanupAutoplay(instance);
}

// Resets DOM to pre-initialization state
function resetDOM(instance) {
  const { id, container, triggers, panels, prevBtn, nextBtn, playPauseBtn } =
    instance;

  // Container: remove attributes and classes
  container.removeAttribute(attributes.id);
  container.removeAttribute('aria-orientation');
  container.classList.remove(
    classes.transitioning,
    classes.playing,
    classes.reducedMotion
  );
  container.style.removeProperty(cssProps.tabCount);
  container.style.removeProperty(cssProps.activeIndex);
  container.style.removeProperty(cssProps.direction);
  container.style.removeProperty(cssProps.autoplayDuration);

  // Triggers: remove ARIA, classes, CSS vars, generated IDs
  triggers.forEach((trigger) => {
    trigger.removeAttribute('role');
    trigger.removeAttribute('aria-selected');
    trigger.removeAttribute('aria-controls');
    trigger.removeAttribute('tabindex');

    // Only reset ID if we generated it (starts with instance ID prefix)
    if (trigger.id.startsWith(`${id}-trigger-`)) {
      trigger.id = '';
    }

    trigger.classList.remove(classes.active, classes.inactive);
    trigger.style.removeProperty(cssProps.tabIndex);
    trigger.style.removeProperty(cssProps.progress);
  });

  // Panels: remove ARIA, classes, CSS vars, generated IDs
  panels.forEach((panel) => {
    panel.removeAttribute('role');
    panel.removeAttribute('aria-labelledby');
    panel.removeAttribute('aria-hidden');
    panel.removeAttribute('tabindex');

    // Only reset ID if we generated it (starts with instance ID prefix)
    if (panel.id.startsWith(`${id}-panel-`)) {
      panel.id = '';
    }

    panel.classList.remove(
      classes.active,
      classes.inactive,
      classes.panelEntering,
      classes.panelLeaving
    );
    panel.style.removeProperty(cssProps.tabIndex);
  });

  // Navigation buttons: remove disabled class
  if (prevBtn) {
    prevBtn.classList.remove(classes.buttonDisabled);
  }
  if (nextBtn) {
    nextBtn.classList.remove(classes.buttonDisabled);
  }

  // Play/pause button: remove aria-pressed
  if (playPauseBtn) {
    playPauseBtn.removeAttribute('aria-pressed');
  }

  // Remove instance reference from element
  delete container._tabs;
}

// Advances to next tab without stopping autoplay (used by autoplay tick)
function advanceToNextTab(instance) {
  const { triggers, config, state } = instance;
  const currentIndex = findTriggerIndex(triggers, state.activeValue);

  let nextIndex = currentIndex + 1;
  if (config.loop) {
    nextIndex = nextIndex % triggers.length;
  } else {
    nextIndex = Math.min(nextIndex, triggers.length - 1);
  }

  const nextValue = triggers[nextIndex].getAttribute(attributes.triggerId);
  activate(instance, nextValue);
}

// Initializes a tabs instance
function init(instance) {
  const { container, config } = instance;

  // Find and validate elements
  if (!findElements(instance)) {
    return false;
  }

  // Set CSS variables
  container.style.setProperty(cssProps.tabCount, instance.triggers.length);
  instance.triggers.forEach((trigger, index) => {
    trigger.style.setProperty(cssProps.tabIndex, index);
  });
  instance.panels.forEach((panel, index) => {
    panel.style.setProperty(cssProps.tabIndex, index);
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
    container.classList.add(classes.reducedMotion);
  }

  // Setup autoplay if enabled and reduced motion not preferred
  if (config.autoplay && !prefersReducedMotion()) {
    container.style.setProperty(
      cssProps.autoplayDuration,
      config.autoplayDuration + 'ms'
    );
    setupAutoplay(instance, advanceToNextTab);
    startAutoplay(instance);
  }

  // Store instance ID on container for lookup
  container.setAttribute(attributes.id, instance.id);

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

    this.boundHandlers = null;
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
    if (initialized) {
      this.container._tabs = this;
      instances.set(this.id, this);
    } else {
      console.warn(`Tabs ${this.id}: Initialization failed.`);
    }
  }

  // Navigates to a tab by value
  goTo(value) {
    if (this.state.isAutoplaying) stopAutoplay(this, 'user');
    activate(this, value);
    return this;
  }

  // Navigates to the next tab
  next() {
    if (this.state.isAutoplaying) stopAutoplay(this, 'user');
    advanceToNextTab(this);
    return this;
  }

  // Navigates to the previous tab
  prev() {
    if (this.state.isAutoplaying) stopAutoplay(this, 'user');

    const { triggers, config, state } = this;
    const currentIndex = findTriggerIndex(triggers, state.activeValue);

    let prevIndex = currentIndex - 1;
    if (config.loop) {
      prevIndex = (prevIndex + triggers.length) % triggers.length;
    } else {
      prevIndex = Math.max(prevIndex, 0);
    }

    const prevValue = triggers[prevIndex].getAttribute(attributes.triggerId);
    activate(this, prevValue);
    return this;
  }

  // Starts autoplay
  play() {
    if (prefersReducedMotion()) return this;

    if (!this.autoplay) {
      setupAutoplay(this, advanceToNextTab);
    }

    // Set autoplay duration CSS variable
    this.container.style.setProperty(
      cssProps.autoplayDuration,
      this.config.autoplayDuration + 'ms'
    );

    startAutoplay(this);
    return this;
  }

  // Stops autoplay
  stop() {
    stopAutoplay(this, 'user');
    return this;
  }

  // Re-initializes after DOM changes
  refresh() {
    const currentValue = this.state.activeValue;

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
    this.boundHandlers = null;
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

  // Destroys the instance and resets DOM to pre-init state
  destroy() {
    instances.delete(this.id);
    cleanup(this);
    resetDOM(this);
  }

  // Returns the current active value
  getActiveValue() {
    return this.state.activeValue;
  }
}
