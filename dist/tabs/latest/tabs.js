/*!
 * Tabs v1.0.0-beta
 * An accessible, keyboard-navigable tabs component with autoplay support.
 *
 * A part of Divs by Idreezus, a component library
 * divs.idreezus.com
 *
 * (c) 2026 Idrees Isse (https://github.com/idreezus)
 * Released under AGPL-3.0
 */

var Tabs = (function (exports) {
  'use strict';

  // Configuration constants for the tabs library

  // Builds a presence-based selector with opt-out support
  const sel = (attr) => `[${attr}]:not([${attr}="false"])`;

  // Raw attribute names for marker (presence-based) elements
  const selectorAttrs = {
    container: 'data-tabs-container',
    prevBtn: 'data-tabs-prev',
    nextBtn: 'data-tabs-next',
    playPauseBtn: 'data-tabs-play-pause',
  };

  // DOM query selectors (marker attrs auto-derived, value attrs manual)
  const selectors = {
    ...Object.fromEntries(
      Object.entries(selectorAttrs).map(([k, v]) => [k, sel(v)])
    ),
    trigger: '[data-tabs-trigger-id]',
    panel: '[data-tabs-panel-id]',
  };

  // Attribute names for configuration
  const attributes = {
    // Container configuration
    groupName: 'data-tabs-group-name',
    default: 'data-tabs-default',
    orientation: 'data-tabs-orientation',
    activateOnFocus: 'data-tabs-activate-on-focus',
    loop: 'data-tabs-loop',
    keyboard: 'data-tabs-keyboard',
    id: 'data-tabs-id',

    // Content linking
    triggerId: 'data-tabs-trigger-id',
    panelId: 'data-tabs-panel-id',

    // Autoplay configuration
    autoplay: 'data-tabs-autoplay',
    autoplayDuration: 'data-tabs-autoplay-duration',
    autoplayPauseHover: 'data-tabs-autoplay-pause-hover',
    autoplayPauseFocus: 'data-tabs-autoplay-pause-focus',
  };

  // CSS classes applied to elements
  const classes = {
    // State classes
    active: 'tabs-active',
    inactive: 'tabs-inactive',
    transitioning: 'tabs-transitioning',

    // Panel transition classes
    panelEntering: 'tabs-panel-entering',
    panelLeaving: 'tabs-panel-leaving',

    // Button state classes
    buttonDisabled: 'tabs-button-disabled',

    // Autoplay state classes
    playing: 'tabs-playing',

    // Accessibility
    reducedMotion: 'tabs-reduced-motion',
  };

  // CSS custom properties
  const cssProps = {
    progress: '--tabs-progress',
    tabCount: '--tabs-count',
    tabIndex: '--tabs-index',
    activeIndex: '--tabs-active-index',
    autoplayDuration: '--tabs-autoplay-duration',
    direction: '--tabs-direction'};

  // Default configuration values
  const defaults = {
    orientation: 'horizontal',
    autoplayDuration: 5000,
    transitionDuration: 200,
  };

  // Event names for CustomEvents
  const events = {
    change: 'change',
    autoplayStart: 'autoplay-start',
    autoplayStop: 'autoplay-stop',
  };

  // Shared utility functions for the tabs library

  // Emits DOM CustomEvent on the container element
  function emit(instance, eventName, data = {}) {
    const { container } = instance;

    const customEvent = new CustomEvent(`tabs:${eventName}`, {
      detail: { tabs: instance, ...data },
      bubbles: true,
    });
    container.dispatchEvent(customEvent);
  }

  // Normalizes a value string to lowercase, hyphenated format
  function normalizeValue(value) {
    if (!value) return '';
    return value.toLowerCase().replace(/\s+/g, '-');
  }

  let idCounter = 0;

  // Generates a unique ID for each tabs instance
  function generateUniqueId() {
    idCounter += 1;
    return `tabs-${idCounter}`;
  }

  // Checks if user prefers reduced motion
  function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  // Reads URL parameter for a given key
  function getUrlParam(key) {
    if (!key) return null;
    const params = new URLSearchParams(window.location.search);
    return params.get(key);
  }

  // Updates URL parameter using replaceState
  function setUrlParam(key, value) {
    if (!key) return;
    const url = new URL(window.location.href);
    url.searchParams.set(key, value);
    window.history.replaceState({}, '', url.toString());
  }

  // Autoplay behavior for tabs: timer, progress updates, pause/resume


  // Shared RAF tick loop for autoplay progress
  function runAutoplayTick(instance) {
    const { state, config, triggerMap, autoplay } = instance;

    if (!state.isAutoplaying || state.isPaused) return;

    const elapsed = performance.now() - state.autoplayStartTime;
    const progress = Math.min(elapsed / config.autoplayDuration, 1);

    // Update --tabs-progress on active trigger(s)
    const activeTriggers = triggerMap.get(state.activeValue);
    if (activeTriggers) {
      activeTriggers.forEach((trigger) => {
        trigger.style.setProperty(cssProps.progress, progress.toString());
      });
    }

    if (progress >= 1) {
      autoplay.advanceFn(instance);
      state.autoplayStartTime = performance.now();
    }

    autoplay.rafId = requestAnimationFrame(() => runAutoplayTick(instance));
  }

  // Sets up autoplay with IntersectionObserver and pause handlers
  function setupAutoplay(instance, advanceFn) {
    const { container, config } = instance;

    instance.autoplay = {
      rafId: null,
      observer: null,
      advanceFn,
      isVisible: true,
      pausedByHover: false,
      pausedByFocus: false,
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
      container.addEventListener(
        'mouseenter',
        instance.autoplay.handleMouseEnter
      );
      container.addEventListener(
        'mouseleave',
        instance.autoplay.handleMouseLeave
      );
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
    const { autoplay, state } = instance;
    return (
      state.isAutoplaying &&
      autoplay.isVisible &&
      !autoplay.pausedByHover &&
      !autoplay.pausedByFocus
    );
  }

  // Starts autoplay timer with RAF progress updates
  function startAutoplay(instance) {
    const { container, state } = instance;

    state.isAutoplaying = true;
    state.isPaused = false;
    state.autoplayStartTime = performance.now();

    container.classList.add(classes.playing);

    // Update play/pause button
    if (instance.playPauseBtn) {
      instance.playPauseBtn.setAttribute('aria-pressed', 'true');
    }

    emit(instance, events.autoplayStart, { value: state.activeValue });

    instance.autoplay.rafId = requestAnimationFrame(() =>
      runAutoplayTick(instance)
    );
  }

  // Pauses autoplay temporarily (hover, focus, visibility)
  function pauseAutoplay(instance, reason = 'user') {
    const { state, container } = instance;

    if (!state.isAutoplaying || state.isPaused) return;

    state.isPaused = true;

    // Cancel RAF
    if (instance.autoplay.rafId) {
      cancelAnimationFrame(instance.autoplay.rafId);
      instance.autoplay.rafId = null;
    }

    container.classList.remove(classes.playing);

    // Update play/pause button
    if (instance.playPauseBtn) {
      instance.playPauseBtn.setAttribute('aria-pressed', 'false');
    }

    // Store elapsed time and active tab so we can resume from this point
    const elapsed = performance.now() - state.autoplayStartTime;
    state.autoplayElapsed = elapsed;
    state.autoplayPausedOnValue = state.activeValue;
    const progress = Math.min(elapsed / instance.config.autoplayDuration, 1);

    emit(instance, events.autoplayStop, {
      value: state.activeValue,
      progress,
      reason,
    });
  }

  // Resumes autoplay from where it was paused
  function resumeAutoplay(instance) {
    const { state, container } = instance;

    if (!state.isAutoplaying || !state.isPaused) return;
    if (!canResume(instance)) return;

    state.isPaused = false;
    // Resume from stored elapsed time only if still on the same tab, otherwise reset
    const sameTab = state.autoplayPausedOnValue === state.activeValue;
    state.autoplayStartTime = sameTab
      ? performance.now() - (state.autoplayElapsed || 0)
      : performance.now();

    container.classList.add(classes.playing);

    // Update play/pause button
    if (instance.playPauseBtn) {
      instance.playPauseBtn.setAttribute('aria-pressed', 'true');
    }

    emit(instance, events.autoplayStart, { value: state.activeValue });

    instance.autoplay.rafId = requestAnimationFrame(() =>
      runAutoplayTick(instance)
    );
  }

  // Stops autoplay completely
  function stopAutoplay(instance, reason = 'user') {
    const { state, container } = instance;

    if (!state.isAutoplaying) return;

    // Compute progress before resetting
    const elapsed = performance.now() - state.autoplayStartTime;
    const progress = Math.min(elapsed / instance.config.autoplayDuration, 1);

    state.isAutoplaying = false;
    state.isPaused = false;

    if (instance.autoplay?.rafId) {
      cancelAnimationFrame(instance.autoplay.rafId);
      instance.autoplay.rafId = null;
    }

    container.classList.remove(classes.playing);

    // Update play/pause button
    if (instance.playPauseBtn) {
      instance.playPauseBtn.setAttribute('aria-pressed', 'false');
    }

    emit(instance, events.autoplayStop, {
      value: state.activeValue,
      progress,
      reason,
    });

    // Reset progress on all triggers
    instance.triggers.forEach((trigger) => {
      trigger.style.setProperty(cssProps.progress, '0');
    });
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

  // Core tabs library with Tabs class and initialization logic


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

  // Entry point for tabs library - auto-initialization only


  // Auto-initializes all tabs containers
  function autoInit() {
    const containers = document.querySelectorAll(selectors.container);

    containers.forEach((container) => {
      // Skip if already initialized
      if (container._tabs) return;

      try {
        new Tabs(container);
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

  exports.Tabs = Tabs;

  return exports;

})({});
//# sourceMappingURL=tabs.js.map
