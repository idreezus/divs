// Core tabs library with Tabs class and initialization logic

import {
  selectors,
  attributes,
  classes,
  cssProps,
  defaults,
  events,
} from './config';
import {
  setupAutoplay,
  startAutoplay,
  stopAutoplay,
  cleanupAutoplay,
} from './autoplay';
import {
  emit,
  normalizeValue,
  generateUniqueId,
  prefersReducedMotion,
  getUrlParam,
  setUrlParam,
  detectOrientation,
  detectDirection,
} from './utils';
import type {
  TabsInstance,
  TabsConfig,
  TabsState,
  BoundHandlers,
  AutoplayState,
  ActivateOptions,
  TabsHTMLElement,
  TabElement,
} from './types';

// Finds the index of a trigger by its normalized value
function findTriggerIndex(triggers: HTMLElement[], targetValue: string | null): number {
  return triggers.findIndex(
    (trigger) => (trigger as TabElement)._tabValue === targetValue
  );
}

// Parses configuration from data attributes on the container
function parseConfig(container: HTMLElement): TabsConfig {
  return {
    groupName: container.getAttribute(attributes.groupName) || null,
    defaultValue: container.getAttribute(attributes.default) || null,
    autoplay: container.getAttribute(attributes.autoplay) === 'true',
    autoplayDuration:
      parseInt(container.getAttribute(attributes.autoplayDuration) || '', 10) ||
      defaults.autoplayDuration,
    autoplayPauseHover:
      container.getAttribute(attributes.autoplayPauseHover) === 'true',
    autoplayPauseFocus:
      container.getAttribute(attributes.autoplayPauseFocus) !== 'false',
  };
}

// Detects orientation and direction from CSS layout of the tablist
function detectLayout(instance: TabsInstance): void {
  const { tablist, state } = instance;
  state.orientation = detectOrientation(tablist);
  state.direction = detectDirection(tablist);
  tablist.setAttribute('aria-orientation', state.orientation);
}

// Finds and validates all elements within the tabs container
function findElements(instance: TabsInstance): boolean {
  const { container, id } = instance;

  // Scope to this container to support nested tabs
  const scopedQuery = (selector: string): HTMLElement[] => {
    return [...container.querySelectorAll(selector)].filter((el) => {
      return el.closest(selectors.container) === container;
    }) as HTMLElement[];
  };

  // Find tablist
  const tablist = container.querySelector(selectors.list) as HTMLElement | null;
  if (!tablist) {
    console.error(
      `Tabs ${id}: No tablist found. Expected an element with [data-tabs-list].`
    );
    return false;
  }

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

    (trigger as TabElement)._tabValue = value;

    // Warn if trigger is an <a> tag
    if (trigger.tagName.toLowerCase() === 'a') {
      console.warn(
        `Tabs ${id}: Trigger "${value}" is an <a> tag. Use <button> for keyboard and ARIA support.`
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

    (panel as TabElement)._tabValue = value;
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

  // Find optional play/pause button
  const playPauseBtn = container.querySelector(selectors.playPauseBtn);

  // Store references
  Object.assign(instance, {
    tablist,
    triggers,
    panels,
    triggerMap,
    panelMap,
    playPauseBtn,
  });

  return true;
}

// Sets up ARIA attributes for tablist, triggers, and panels
function setupAccessibility(instance: TabsInstance): void {
  const { tablist, triggers, panels, id } = instance;

  // Set tablist role and orientation
  tablist.setAttribute('role', 'tablist');

  triggers.forEach((trigger) => {
    const value = (trigger as TabElement)._tabValue;
    const triggerId = trigger.id || `${id}-trigger-${value}`;
    const panelId = `${id}-panel-${value}`;

    trigger.setAttribute('role', 'tab');
    trigger.id = triggerId;
    trigger.setAttribute('aria-controls', panelId);
  });

  panels.forEach((panel) => {
    const value = (panel as TabElement)._tabValue;
    const panelId = panel.id || `${id}-panel-${value}`;
    const triggerId = `${id}-trigger-${value}`;

    panel.setAttribute('role', 'tabpanel');
    panel.id = panelId;
    panel.setAttribute('aria-labelledby', triggerId);
    panel.setAttribute('tabindex', '0');
  });
}

// Updates ARIA states when active tab changes
function updateAriaStates(instance: TabsInstance): void {
  const { triggers, panels, state } = instance;

  triggers.forEach((trigger) => {
    const isActive = (trigger as TabElement)._tabValue === state.activeValue;

    trigger.setAttribute('aria-selected', isActive.toString());
    trigger.setAttribute('tabindex', isActive ? '0' : '-1');
  });

  panels.forEach((panel) => {
    const isActive = (panel as TabElement)._tabValue === state.activeValue;

    panel.setAttribute('aria-hidden', (!isActive).toString());
  });
}

// Sets up keyboard navigation for triggers
function setupKeyboardNavigation(instance: TabsInstance): void {
  const { container } = instance;

  const handleKeydown = (e: KeyboardEvent): void => {
    // Only handle if a trigger within this container has focus
    const focusedTrigger = document.activeElement as HTMLElement;
    if (
      !instance.triggers.includes(focusedTrigger) ||
      focusedTrigger.closest(selectors.container) !== container
    ) {
      return;
    }

    const { orientation, direction } = instance.state;
    const isHorizontal = orientation === 'horizontal';
    const isRtl = direction === 'rtl';

    // Determine prev/next keys based on orientation and direction
    let prevKey: string;
    let nextKey: string;

    if (isHorizontal) {
      prevKey = isRtl ? 'ArrowRight' : 'ArrowLeft';
      nextKey = isRtl ? 'ArrowLeft' : 'ArrowRight';
    } else {
      prevKey = 'ArrowUp';
      nextKey = 'ArrowDown';
    }

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
    }
  };

  instance.boundHandlers.keyboard = handleKeydown;
  container.addEventListener('keydown', handleKeydown);
}

// Moves focus by a given direction (-1 or +1), always wrapping
function moveFocus(instance: TabsInstance, direction: number): void {
  const { triggers, state } = instance;
  const currentIndex = triggers.indexOf(document.activeElement as HTMLElement);

  if (currentIndex === -1) return;

  const nextIndex = (currentIndex + direction + triggers.length) % triggers.length;

  triggers[nextIndex].focus();

  // Stop autoplay on keyboard interaction
  if (state.isAutoplaying) {
    stopAutoplay(instance, 'user');
  }

  // Always activate on focus (automatic activation)
  activate(instance, (triggers[nextIndex] as TabElement)._tabValue!);
}

// Focuses trigger at a specific index
function focusTriggerAt(instance: TabsInstance, index: number): void {
  const { triggers, state } = instance;

  triggers[index].focus();

  if (state.isAutoplaying) {
    stopAutoplay(instance, 'user');
  }

  // Always activate on focus
  activate(instance, (triggers[index] as TabElement)._tabValue!);
}

// Determines the initial active value
function determineInitialValue(instance: TabsInstance): string {
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
  return (triggers[0] as TabElement)._tabValue!;
}

// Scrolls active trigger into view for programmatic activation
function scrollTriggerIntoView(instance: TabsInstance, value: string): void {
  const activeTriggers = instance.triggerMap.get(value);
  if (!activeTriggers?.length) return;

  const behavior = prefersReducedMotion() ? 'instant' : 'smooth';
  const isVertical = instance.state.orientation === 'vertical';

  activeTriggers[0].scrollIntoView({
    behavior: behavior as ScrollBehavior,
    block: isVertical ? 'nearest' : 'center',
    inline: isVertical ? 'center' : 'nearest',
  });
}

// Activates a tab by its value
function activate(instance: TabsInstance, value: string, options: ActivateOptions = {}): boolean {
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
  container.style.setProperty(cssProps.activeIndex, String(newIndex));

  // Set direction CSS variable (1 = forward, -1 = backward, 0 = initial)
  const direction =
    previousIndex === -1 ? 0 : newIndex > previousIndex ? 1 : -1;
  container.style.setProperty(cssProps.direction, String(direction));

  // Update state
  state.activeValue = normalized;

  // Update URL
  if (updateUrl && config.groupName) {
    setUrlParam(config.groupName, normalized);
  }

  // Clear any pending transition cleanup
  if (instance._transitionTimer !== null) clearTimeout(instance._transitionTimer);

  // Add transitioning class
  container.classList.add(classes.transitioning);

  // Update trigger states
  triggers.forEach((trigger) => {
    const triggerValue = (trigger as TabElement)._tabValue;
    const isActive = triggerValue === normalized;

    trigger.classList.toggle(classes.active, isActive);

    // Reset progress on inactive triggers
    if (!isActive) {
      trigger.style.setProperty(cssProps.progress, '0');
    }
  });

  // Update panel states
  panels.forEach((panel) => {
    const panelValue = (panel as TabElement)._tabValue;
    const isActive = panelValue === normalized;
    const wasActive = panelValue === previousValue;

    // Remove previous transition classes
    panel.classList.remove(classes.panelEntering, classes.panelLeaving);

    if (isActive) {
      panel.classList.add(classes.active, classes.panelEntering);
    } else if (wasActive) {
      panel.classList.add(classes.panelLeaving);
      panel.classList.remove(classes.active);
    } else {
      panel.classList.remove(classes.active);
    }
  });

  // Remove transition classes after animation
  instance._transitionTimer = setTimeout(() => {
    container.classList.remove(classes.transitioning);
    panels.forEach((panel) => {
      panel.classList.remove(classes.panelEntering, classes.panelLeaving);
    });
  }, defaults.transitionDuration);

  // Update ARIA states
  updateAriaStates(instance);

  // Scroll active trigger into view for programmatic activation
  scrollTriggerIntoView(instance, normalized);

  // Emit change event
  if (!silent) {
    emit(instance, events.change, {
      value: normalized,
      previousValue,
    });
  }

  return true;
}

// Checks tablist scroll position and updates classes on the container
function updateScrollClasses(instance: TabsInstance): void {
  const { tablist, container, state } = instance;
  const isVertical = state.orientation === 'vertical';

  const scrollPos = isVertical ? tablist.scrollTop : tablist.scrollLeft;
  const scrollSize = isVertical ? tablist.scrollHeight : tablist.scrollWidth;
  const clientSize = isVertical ? tablist.clientHeight : tablist.clientWidth;

  // Threshold of 1px to account for subpixel rounding
  const atStart = scrollPos <= 1;
  const atEnd = scrollPos + clientSize >= scrollSize - 1;

  container.classList.toggle(classes.atStart, atStart);
  container.classList.toggle(classes.atEnd, atEnd);
}

// Sets up scroll position detection on the tablist
function setupScrollDetection(instance: TabsInstance): void {
  const { tablist } = instance;

  const handleScroll = () => updateScrollClasses(instance);

  tablist.addEventListener('scroll', handleScroll, { passive: true });
  instance.boundHandlers.scroll = handleScroll;

  // ResizeObserver for content/container size changes and layout re-detection
  const observer = new ResizeObserver(() => {
    detectLayout(instance);
    updateScrollClasses(instance);
  });
  observer.observe(tablist);
  instance.boundHandlers.resizeObserver = observer;

  // Initial check
  updateScrollClasses(instance);
}

// Attaches click handlers to triggers and play/pause button
function attachEventListeners(instance: TabsInstance): void {
  const { triggers, playPauseBtn, state } = instance;

  // Trigger click handlers
  triggers.forEach((trigger) => {
    const handler = (e: Event): void => {
      e.preventDefault();
      // Stop autoplay on user interaction
      if (state.isAutoplaying) {
        stopAutoplay(instance, 'user');
      }

      activate(instance, (trigger as TabElement)._tabValue!);
    };

    trigger.addEventListener('click', handler);
    instance.boundHandlers.triggerClicks.push({ trigger, handler });
  });

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
function cleanup(instance: TabsInstance): void {
  const { container, tablist, playPauseBtn, boundHandlers } = instance;

  // Cancel pending transition timer
  if (instance._transitionTimer !== null) clearTimeout(instance._transitionTimer);

  // Remove trigger click handlers
  if (boundHandlers?.triggerClicks) {
    boundHandlers.triggerClicks.forEach(({ trigger, handler }) => {
      trigger.removeEventListener('click', handler);
    });
  }

  // Remove play/pause handler
  if (playPauseBtn && boundHandlers?.playPause) {
    playPauseBtn.removeEventListener('click', boundHandlers.playPause);
  }

  // Remove keyboard handler
  if (boundHandlers?.keyboard) {
    container.removeEventListener('keydown', boundHandlers.keyboard);
  }

  // Remove scroll handler
  if (tablist && boundHandlers?.scroll) {
    tablist.removeEventListener('scroll', boundHandlers.scroll);
  }

  // Disconnect ResizeObserver
  if (boundHandlers?.resizeObserver) {
    boundHandlers.resizeObserver.disconnect();
  }

  // Cleanup autoplay
  cleanupAutoplay(instance);
}

// Resets DOM to pre-initialization state
function resetDOM(instance: TabsInstance): void {
  const { id, container, tablist, triggers, panels, playPauseBtn } = instance;

  // Container: remove attributes and classes
  container.removeAttribute(attributes.id);
  container.classList.remove(
    classes.transitioning,
    classes.playing,
    classes.atStart,
    classes.atEnd
  );
  container.style.removeProperty(cssProps.tabCount);
  container.style.removeProperty(cssProps.activeIndex);
  container.style.removeProperty(cssProps.direction);
  container.style.removeProperty(cssProps.autoplayDuration);

  // Tablist: remove role and aria-orientation
  if (tablist) {
    tablist.removeAttribute('role');
    tablist.removeAttribute('aria-orientation');
  }

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

    trigger.classList.remove(classes.active);
    trigger.style.removeProperty(cssProps.tabIndex);
    trigger.style.removeProperty(cssProps.progress);
    delete (trigger as TabElement)._tabValue;
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
      classes.panelEntering,
      classes.panelLeaving
    );
    panel.style.removeProperty(cssProps.tabIndex);
    delete (panel as TabElement)._tabValue;
  });

  // Play/pause button: remove aria-pressed
  if (playPauseBtn) {
    playPauseBtn.removeAttribute('aria-pressed');
  }

  // Remove instance reference from element
  delete (container as TabsHTMLElement)._tabs;
}

// Advances to next tab without stopping autoplay (used by autoplay tick)
function advanceToNextTab(instance: TabsInstance): void {
  const { triggers, state } = instance;
  const currentIndex = findTriggerIndex(triggers, state.activeValue);
  const nextIndex = (currentIndex + 1) % triggers.length;

  activate(instance, (triggers[nextIndex] as TabElement)._tabValue!);
}

// Initializes a tabs instance
function init(instance: TabsInstance): boolean {
  const { container, config } = instance;

  // Find and validate elements
  if (!findElements(instance)) {
    return false;
  }

  // Set CSS variables
  container.style.setProperty(cssProps.tabCount, String(instance.triggers.length));
  instance.triggers.forEach((trigger, index) => {
    trigger.style.setProperty(cssProps.tabIndex, String(index));
  });
  instance.panels.forEach((panel, index) => {
    panel.style.setProperty(cssProps.tabIndex, String(index));
  });

  // Detect orientation and direction from CSS
  detectLayout(instance);

  // Setup accessibility
  setupAccessibility(instance);

  // Determine and activate initial tab
  const initialValue = determineInitialValue(instance);
  activate(instance, initialValue, { silent: true, updateUrl: false });

  // Attach event listeners
  attachEventListeners(instance);

  // Setup keyboard navigation (always enabled per ARIA spec)
  setupKeyboardNavigation(instance);

  // Setup scroll position detection on tablist
  setupScrollDetection(instance);

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
  id!: string;
  container!: HTMLElement;
  config!: TabsConfig;
  state!: TabsState;
  boundHandlers!: BoundHandlers;
  autoplay!: AutoplayState | null;
  _transitionTimer!: ReturnType<typeof setTimeout> | null;
  tablist!: HTMLElement;
  triggers!: HTMLElement[];
  panels!: HTMLElement[];
  triggerMap!: Map<string, HTMLElement[]>;
  panelMap!: Map<string, HTMLElement>;
  playPauseBtn!: HTMLElement | null;

  constructor(container: HTMLElement) {
    this.id = generateUniqueId();
    this.container = container;
    this.config = parseConfig(container);

    this.state = {
      activeValue: null,
      orientation: 'horizontal',
      direction: 'ltr',
      isAutoplaying: false,
      isPaused: false,
      autoplayStartTime: null,
      autoplayElapsed: 0,
      autoplayPausedOnValue: null,
    };

    this.boundHandlers = {
      triggerClicks: [],
      scroll: null,
      resizeObserver: null,
      playPause: null,
      keyboard: null,
    };
    this.autoplay = null;
    this._transitionTimer = null;

    // Element references (populated by findElements)
    this.tablist = null as unknown as HTMLElement;
    this.triggers = [];
    this.panels = [];
    this.triggerMap = new Map();
    this.panelMap = new Map();
    this.playPauseBtn = null;

    const initialized = init(this as unknown as TabsInstance);
    if (initialized) {
      (this.container as TabsHTMLElement)._tabs = this;
    } else {
      console.warn(`Tabs ${this.id}: Initialization failed.`);
    }
  }

  // Navigates to a tab by value
  goTo(value: string): this {
    if (this.state.isAutoplaying) stopAutoplay(this as unknown as TabsInstance, 'user');
    activate(this as unknown as TabsInstance, value);
    return this;
  }

  // Navigates to the next tab
  next(): this {
    if (this.state.isAutoplaying) stopAutoplay(this as unknown as TabsInstance, 'user');
    advanceToNextTab(this as unknown as TabsInstance);
    return this;
  }

  // Navigates to the previous tab
  prev(): this {
    if (this.state.isAutoplaying) stopAutoplay(this as unknown as TabsInstance, 'user');

    const { triggers, state } = this;
    const currentIndex = findTriggerIndex(triggers, state.activeValue);
    const prevIndex = (currentIndex - 1 + triggers.length) % triggers.length;

    activate(this as unknown as TabsInstance, (triggers[prevIndex] as TabElement)._tabValue!);
    return this;
  }

  // Starts autoplay
  play(): this {
    if (prefersReducedMotion()) return this;

    if (!this.autoplay) {
      setupAutoplay(this as unknown as TabsInstance, advanceToNextTab);
    }

    // Set autoplay duration CSS variable
    this.container.style.setProperty(
      cssProps.autoplayDuration,
      this.config.autoplayDuration + 'ms'
    );

    startAutoplay(this as unknown as TabsInstance);
    return this;
  }

  // Stops autoplay
  stop(): this {
    stopAutoplay(this as unknown as TabsInstance, 'user');
    return this;
  }

  // Re-initializes after DOM changes
  refresh(): this {
    const currentValue = this.state.activeValue;

    cleanup(this as unknown as TabsInstance);

    this.config = parseConfig(this.container);
    this.state = {
      activeValue: null,
      orientation: 'horizontal',
      direction: 'ltr',
      isAutoplaying: false,
      isPaused: false,
      autoplayStartTime: null,
      autoplayElapsed: 0,
      autoplayPausedOnValue: null,
    };
    this.boundHandlers = {
      triggerClicks: [],
      scroll: null,
      resizeObserver: null,
      playPause: null,
      keyboard: null,
    };
    this.autoplay = null;
    this._transitionTimer = null;
    this.tablist = null as unknown as HTMLElement;
    this.triggers = [];
    this.panels = [];
    this.triggerMap = new Map();
    this.panelMap = new Map();

    init(this as unknown as TabsInstance);

    // Try to restore previous active value
    if (currentValue && this.triggerMap.has(currentValue)) {
      activate(this as unknown as TabsInstance, currentValue, { silent: true });
    }

    return this;
  }

  // Destroys the instance and resets DOM to pre-init state
  destroy(): void {
    cleanup(this as unknown as TabsInstance);
    resetDOM(this as unknown as TabsInstance);
  }

  // Returns the current active value
  getActiveValue(): string | null {
    return this.state.activeValue;
  }
}
