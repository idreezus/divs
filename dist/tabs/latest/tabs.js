/*!
 * Tabs v1.0.0
 * An accessible, keyboard-navigable tabs component with autoplay support.
 *
 * A part of Divs by Idreezus, a component library
 * divs.idreezus.com
 *
 * (c) 2025 Idrees Isse (https://github.com/idreezus)
 * Released under AGPL-3.0
 */

var Tabs = (function (exports) {
  'use strict';

  // Configuration constants for the tabs library

  // Selectors for querying DOM elements
  const SELECTORS = {
    CONTAINER: '[data-tabs="container"]',
    TRIGGER: '[data-tabs-trigger-value]',
    PANEL: '[data-tabs-panel-value]',
    PREV_BTN: '[data-tabs="prev"]',
    NEXT_BTN: '[data-tabs="next"]',
    PLAY_PAUSE_BTN: '[data-tabs="play-pause"]',
  };

  // Attribute names for configuration
  const ATTRIBUTES = {
    // Container configuration
    GROUP_NAME: 'data-tabs-group-name',
    DEFAULT: 'data-tabs-default',
    ORIENTATION: 'data-tabs-orientation',
    ACTIVATE_ON_FOCUS: 'data-tabs-activate-on-focus',
    LOOP: 'data-tabs-loop',
    KEYBOARD: 'data-tabs-keyboard',

    // Content linking
    TRIGGER_VALUE: 'data-tabs-trigger-value',
    PANEL_VALUE: 'data-tabs-panel-value',

    // Autoplay configuration
    AUTOPLAY: 'data-tabs-autoplay',
    AUTOPLAY_DURATION: 'data-tabs-autoplay-duration',
    AUTOPLAY_PAUSE_HOVER: 'data-tabs-autoplay-pause-hover',
    AUTOPLAY_PAUSE_FOCUS: 'data-tabs-autoplay-pause-focus',
  };

  // CSS classes applied to elements
  const CLASSES = {
    // State classes
    ACTIVE: 'tabs-active',
    INACTIVE: 'tabs-inactive',
    TRANSITIONING: 'tabs-transitioning',

    // Panel transition classes
    PANEL_ENTERING: 'tabs-panel-entering',
    PANEL_LEAVING: 'tabs-panel-leaving',

    // Button state classes
    BUTTON_DISABLED: 'tabs-button-disabled',

    // Autoplay state classes
    AUTOPLAY_ACTIVE: 'tabs-autoplay-active',
    AUTOPLAY_PAUSED: 'tabs-autoplay-paused',

    // Accessibility
    REDUCED_MOTION: 'tabs-reduced-motion',
  };

  // CSS custom properties
  const CSS_VARS = {
    PROGRESS: '--tabs-progress',
  };

  // Default configuration values
  const DEFAULTS = {
    ORIENTATION: 'horizontal',
    AUTOPLAY_DURATION: 5000};

  // Timing constants in milliseconds
  const TIMING = {
    TRANSITION_DURATION: 200,
  };

  // Autoplay behavior for tabs: timer, progress updates, pause/resume


  // Sets up autoplay with IntersectionObserver and pause handlers
  function setupAutoplay(instance) {
    const { container, config } = instance;

    instance.autoplay = {
      rafId: null,
      observer: null,
      isVisible: true,
      pausedByHover: false,
      pausedByFocus: false,
      pausedByUser: false,
    };

    // IntersectionObserver to pause when out of viewport
    instance.autoplay.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          instance.autoplay.isVisible = entry.isIntersecting;
          if (!entry.isIntersecting) {
            pauseAutoplay(instance, 'visibility');
          } else if (canResume(instance)) {
            resumeAutoplay(instance);
          }
        });
      },
      { threshold: 0.5 }
    );
    instance.autoplay.observer.observe(container);

    // Hover pause handlers
    if (config.autoplayPauseHover) {
      instance.autoplay.handleMouseEnter = () => {
        instance.autoplay.pausedByHover = true;
        pauseAutoplay(instance, 'hover');
      };
      instance.autoplay.handleMouseLeave = () => {
        instance.autoplay.pausedByHover = false;
        if (canResume(instance)) {
          resumeAutoplay(instance);
        }
      };
      container.addEventListener('mouseenter', instance.autoplay.handleMouseEnter);
      container.addEventListener('mouseleave', instance.autoplay.handleMouseLeave);
    }

    // Focus pause handlers
    if (config.autoplayPauseFocus) {
      instance.autoplay.handleFocusIn = () => {
        instance.autoplay.pausedByFocus = true;
        pauseAutoplay(instance, 'focus');
      };
      instance.autoplay.handleFocusOut = (e) => {
        // Only resume if focus leaves the container entirely
        if (!container.contains(e.relatedTarget)) {
          instance.autoplay.pausedByFocus = false;
          if (canResume(instance)) {
            resumeAutoplay(instance);
          }
        }
      };
      container.addEventListener('focusin', instance.autoplay.handleFocusIn);
      container.addEventListener('focusout', instance.autoplay.handleFocusOut);
    }
  }

  // Checks if autoplay can resume based on all pause conditions
  function canResume(instance) {
    const { autoplay } = instance;
    return (
      autoplay.isVisible &&
      !autoplay.pausedByHover &&
      !autoplay.pausedByFocus &&
      !autoplay.pausedByUser
    );
  }

  // Starts autoplay timer with RAF progress updates
  function startAutoplay(instance) {
    const { container, config, state, triggerMap } = instance;

    state.isAutoplaying = true;
    state.isPaused = false;
    state.autoplayStartTime = performance.now();

    container.classList.add(CLASSES.AUTOPLAY_ACTIVE);
    container.classList.remove(CLASSES.AUTOPLAY_PAUSED);

    // Update play/pause button
    if (instance.playPauseBtn) {
      instance.playPauseBtn.setAttribute('aria-pressed', 'true');
    }

    emitAutoplayEvent(instance, 'autoplay-start', { value: state.activeValue });

    // RAF loop for progress updates
    function tick() {
      if (!state.isAutoplaying || state.isPaused) return;

      const elapsed = performance.now() - state.autoplayStartTime;
      const progress = Math.min(elapsed / config.autoplayDuration, 1);

      // Update --tabs-progress on active trigger(s)
      const activeTriggers = triggerMap.get(state.activeValue);
      if (activeTriggers) {
        activeTriggers.forEach((trigger) => {
          trigger.style.setProperty(CSS_VARS.PROGRESS, progress.toString());
        });
      }

      if (progress >= 1) {
        // Advance to next tab and restart timer
        instance.next();
        state.autoplayStartTime = performance.now();
      }

      instance.autoplay.rafId = requestAnimationFrame(tick);
    }

    instance.autoplay.rafId = requestAnimationFrame(tick);
  }

  // Pauses autoplay
  function pauseAutoplay(instance, reason = 'user') {
    const { state, container } = instance;

    if (!state.isAutoplaying || state.isPaused) return;

    state.isPaused = true;

    // Track user-initiated pause separately
    if (reason === 'user' || reason === 'keyboard') {
      instance.autoplay.pausedByUser = true;
    }

    // Cancel RAF
    if (instance.autoplay.rafId) {
      cancelAnimationFrame(instance.autoplay.rafId);
      instance.autoplay.rafId = null;
    }

    container.classList.add(CLASSES.AUTOPLAY_PAUSED);

    // Update play/pause button
    if (instance.playPauseBtn) {
      instance.playPauseBtn.setAttribute('aria-pressed', 'false');
    }

    // Get current progress for event
    const elapsed = performance.now() - state.autoplayStartTime;
    const progress = Math.min(elapsed / instance.config.autoplayDuration, 1);

    emitAutoplayEvent(instance, 'autoplay-pause', {
      value: state.activeValue,
      progress,
    });
  }

  // Resumes autoplay (resets timer to 0)
  function resumeAutoplay(instance) {
    const { state, container } = instance;

    if (!state.isAutoplaying || !state.isPaused) return;
    if (!canResume(instance)) return;

    state.isPaused = false;
    state.autoplayStartTime = performance.now(); // Reset timer to 0

    container.classList.remove(CLASSES.AUTOPLAY_PAUSED);

    // Update play/pause button
    if (instance.playPauseBtn) {
      instance.playPauseBtn.setAttribute('aria-pressed', 'true');
    }

    emitAutoplayEvent(instance, 'autoplay-start', { value: state.activeValue });

    // Restart RAF loop
    function tick() {
      if (!state.isAutoplaying || state.isPaused) return;

      const elapsed = performance.now() - state.autoplayStartTime;
      const progress = Math.min(elapsed / instance.config.autoplayDuration, 1);

      const activeTriggers = instance.triggerMap.get(state.activeValue);
      if (activeTriggers) {
        activeTriggers.forEach((trigger) => {
          trigger.style.setProperty(CSS_VARS.PROGRESS, progress.toString());
        });
      }

      if (progress >= 1) {
        instance.next();
        state.autoplayStartTime = performance.now();
      }

      instance.autoplay.rafId = requestAnimationFrame(tick);
    }

    instance.autoplay.rafId = requestAnimationFrame(tick);
  }

  // Cleans up autoplay listeners and observer
  function cleanupAutoplay(instance) {
    const { container, config, autoplay } = instance;

    if (!autoplay) return;

    // Cancel RAF
    if (autoplay.rafId) {
      cancelAnimationFrame(autoplay.rafId);
    }

    // Disconnect IntersectionObserver
    if (autoplay.observer) {
      autoplay.observer.disconnect();
    }

    // Remove hover listeners
    if (config.autoplayPauseHover && autoplay.handleMouseEnter) {
      container.removeEventListener('mouseenter', autoplay.handleMouseEnter);
      container.removeEventListener('mouseleave', autoplay.handleMouseLeave);
    }

    // Remove focus listeners
    if (config.autoplayPauseFocus && autoplay.handleFocusIn) {
      container.removeEventListener('focusin', autoplay.handleFocusIn);
      container.removeEventListener('focusout', autoplay.handleFocusOut);
    }

    instance.autoplay = null;
  }

  // Helper to emit autoplay events via the instance's event system
  function emitAutoplayEvent(instance, eventName, data) {
    const { events, container } = instance;

    // Instance event callbacks
    if (events.has(eventName)) {
      events.get(eventName).forEach((callback) => {
        callback.call(instance, { type: eventName, target: instance, ...data });
      });
    }

    // DOM CustomEvent
    const customEvent = new CustomEvent(`tabs:${eventName}`, {
      detail: { tabs: instance, ...data },
      bubbles: true,
    });
    container.dispatchEvent(customEvent);
  }

  // Core tabs library with initialization, keyboard navigation, accessibility, and entry point


  // ============================================================================
  // Utility Functions
  // ============================================================================

  let idCounter = 0;

  // Generates a unique ID for each tabs instance
  function generateUniqueId() {
    idCounter += 1;
    return `tabs-${idCounter}`;
  }

  // Normalizes a value string to lowercase, hyphenated format
  function normalizeValue(value) {
    if (!value) return '';
    return value.toLowerCase().replace(/\s+/g, '-');
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

  // Emits events via instance callbacks and DOM CustomEvent
  function emit(instance, eventName, data = {}) {
    const { events, container } = instance;

    // Instance event callbacks
    if (events.has(eventName)) {
      events.get(eventName).forEach((callback) => {
        callback.call(instance, { type: eventName, target: instance, ...data });
      });
    }

    // DOM CustomEvent for addEventListener compatibility
    const customEvent = new CustomEvent(`tabs:${eventName}`, {
      detail: { tabs: instance, ...data },
      bubbles: true,
    });
    container.dispatchEvent(customEvent);
  }

  // Checks if user prefers reduced motion
  function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  // Reads URL parameter for a given group name
  function getUrlParam(groupName) {
    if (!groupName) return null;
    const params = new URLSearchParams(window.location.search);
    return params.get(groupName);
  }

  // Updates URL parameter using replaceState
  function setUrlParam(groupName, value) {
    if (!groupName) return;
    const url = new URL(window.location.href);
    url.searchParams.set(groupName, value);
    window.history.replaceState({}, '', url.toString());
  }

  // ============================================================================
  // Element Discovery & Validation
  // ============================================================================

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

  // ============================================================================
  // Accessibility Setup
  // ============================================================================

  // Sets up ARIA attributes for triggers and panels
  function setupAccessibility(instance) {
    const { triggers, panels, id, config } = instance;

    // Set orientation on container
    instance.container.setAttribute('aria-orientation', config.orientation);

    triggers.forEach((trigger, index) => {
      const value = normalizeValue(trigger.getAttribute(ATTRIBUTES.TRIGGER_VALUE));
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
      const value = normalizeValue(trigger.getAttribute(ATTRIBUTES.TRIGGER_VALUE));
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

  // ============================================================================
  // Keyboard Navigation
  // ============================================================================

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

  // ============================================================================
  // Tab Activation
  // ============================================================================

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

    const currentIndex = triggers.findIndex((trigger) => {
      const value = normalizeValue(trigger.getAttribute(ATTRIBUTES.TRIGGER_VALUE));
      return value === state.activeValue;
    });

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

  // ============================================================================
  // Event Listeners
  // ============================================================================

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

  // ============================================================================
  // Cleanup
  // ============================================================================

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

    // Clear all properties
    Object.keys(instance).forEach((key) => {
      instance[key] = null;
    });
  }

  // ============================================================================
  // Initialization
  // ============================================================================

  // Initializes a tabs instance
  function init(instance) {
    const { container, config } = instance;

    // Find and validate elements
    if (!findElements(instance)) {
      return false;
    }

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
      setupAutoplay(instance);
      startAutoplay(instance);
    }

    // Store instance ID on container for lookup
    container.setAttribute('data-tabs-id', instance.id);

    return true;
  }

  // ============================================================================
  // Tabs Class
  // ============================================================================

  class Tabs {
    constructor(container) {
      this.id = generateUniqueId();
      this.container = container;
      this.config = parseConfig(container);

      this.state = {
        activeValue: null,
        isAutoplaying: false,
        isPaused: false,
        autoplayStartTime: null,
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
      const currentIndex = triggers.findIndex((trigger) => {
        const value = normalizeValue(
          trigger.getAttribute(ATTRIBUTES.TRIGGER_VALUE)
        );
        return value === state.activeValue;
      });

      let nextIndex = currentIndex + 1;

      if (config.loop) {
        nextIndex = nextIndex % triggers.length;
      } else {
        nextIndex = Math.min(nextIndex, triggers.length - 1);
      }

      const nextValue = triggers[nextIndex].getAttribute(ATTRIBUTES.TRIGGER_VALUE);
      activate(this, nextValue);
      return this;
    }

    // Navigates to the previous tab
    prev() {
      const { triggers, config, state } = this;
      const currentIndex = triggers.findIndex((trigger) => {
        const value = normalizeValue(
          trigger.getAttribute(ATTRIBUTES.TRIGGER_VALUE)
        );
        return value === state.activeValue;
      });

      let prevIndex = currentIndex - 1;

      if (config.loop) {
        prevIndex = (prevIndex + triggers.length) % triggers.length;
      } else {
        prevIndex = Math.max(prevIndex, 0);
      }

      const prevValue = triggers[prevIndex].getAttribute(ATTRIBUTES.TRIGGER_VALUE);
      activate(this, prevValue);
      return this;
    }

    // Starts autoplay
    play() {
      if (prefersReducedMotion()) return this;

      if (!this.autoplay) {
        setupAutoplay(this);
      }

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

  // ============================================================================
  // Global Registry & Auto-initialization
  // ============================================================================

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

  exports.Tabs = Tabs;

  return exports;

})({});
//# sourceMappingURL=tabs.js.map
