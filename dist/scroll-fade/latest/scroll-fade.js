/*!
 * ScrollFade v0.1.0
 * A library for managing scroll indicators (gradient fades) based on a container's scroll position.
 *
 * A part of Divs by Idreezus, a component library
 * divs.idreezus.com
 *
 * (c) 2026 Idrees Isse (https://github.com/idreezus)
 * Released under AGPL-3.0
 */

var ScrollFade = (function (exports) {
  'use strict';

  // Configuration constants for the scroll-fade library

  // Builds a presence-based selector with opt-out support
  const sel = (attr) => `[${attr}]:not([${attr}="false"])`;

  // Raw attribute names for marker (presence-based) elements
  const selectorAttrs = {
    container: 'data-scroll-fade-container',
    list: 'data-scroll-fade-list',
    prev: 'data-scroll-fade-prev',
    next: 'data-scroll-fade-next',
  };

  // DOM query selectors (marker attrs auto-derived, value attrs manual)
  const selectors = {
    ...Object.fromEntries(
      Object.entries(selectorAttrs).map(([k, v]) => [k, sel(v)])
    ),
    start: '[data-scroll-fade="start"]',
    end: '[data-scroll-fade="end"]',
  };

  // Attribute names for configuration
  const attributes = {
    // Container configuration
    orientation: 'data-scroll-fade-orientation',
    step: 'data-scroll-fade-step',
    id: 'data-scroll-fade-id',
  };

  // CSS classes applied to elements
  const classes = {
    // Shadow visibility
    hidden: 'scroll-fade-hidden',

    // Button state
    buttonDisabled: 'scroll-fade-button-disabled',
  };

  // Event names for CustomEvents (prefixed with 'scroll-fade:' when dispatched)
  const events = {
    reachStart: 'reach-start',
    reachEnd: 'reach-end',
    show: 'show',
    hide: 'hide',
  };

  // Default configuration values
  const defaults = {
    orientation: 'horizontal',
    step: null, // Defaults to container clientWidth/clientHeight
  };

  // Internal constants
  const EDGE_THRESHOLD = 1; // pixels

  // Shared utility functions for the scroll-fade library


  let idCounter = 0;

  // Generates a unique ID for each scroll-fade instance
  function generateUniqueId() {
    idCounter += 1;
    return `scroll-fade-${idCounter}`;
  }

  // Parses configuration from element data attributes
  function parseConfig(element) {
    const orientation =
      element.getAttribute(attributes.orientation) || defaults.orientation;

    const stepAttr = element.getAttribute(attributes.step);
    const step = stepAttr ? parseInt(stepAttr, 10) : defaults.step;

    return {
      orientation,
      step,
    };
  }

  // Emits DOM CustomEvent on the container element
  function emit(instance, eventName, data = {}) {
    const { container } = instance;

    const customEvent = new CustomEvent(`scroll-fade:${eventName}`, {
      detail: { scrollFade: instance, ...data },
      bubbles: true,
    });
    container.dispatchEvent(customEvent);
  }

  // Gets text direction using Intl.Locale API for RTL detection
  function getTextDirection() {
    try {
      const locale = new Intl.Locale(navigator.language);
      if (locale.getTextInfo) {
        return locale.getTextInfo().direction;
      }
    } catch {
      // Fallback if Intl.Locale.getTextInfo is not supported
    }

    // Fallback: check document direction
    const dir = document.documentElement.getAttribute('dir');
    if (dir) return dir;

    // Final fallback: check computed style
    return getComputedStyle(document.documentElement).direction || 'ltr';
  }

  // Checks if the container has scrollable content
  function isScrollable(container, orientation) {
    if (orientation === 'horizontal') {
      return container.scrollWidth > container.clientWidth;
    }
    return container.scrollHeight > container.clientHeight;
  }

  // Gets the current scroll position
  function getScrollPosition(container, orientation) {
    if (orientation === 'horizontal') {
      return container.scrollLeft;
    }
    return container.scrollTop;
  }

  // Calculates the maximum scroll value
  function getMaxScroll(container, orientation) {
    if (orientation === 'horizontal') {
      return container.scrollWidth - container.clientWidth;
    }
    return container.scrollHeight - container.clientHeight;
  }

  // Checks if scroll is at the start (within threshold)
  function isAtStart(container, orientation) {
    const position = getScrollPosition(container, orientation);
    return position <= EDGE_THRESHOLD;
  }

  // Checks if scroll is at the end (within threshold)
  function isAtEnd(container, orientation) {
    const position = getScrollPosition(container, orientation);
    const maxScroll = getMaxScroll(container, orientation);
    return position >= maxScroll - EDGE_THRESHOLD;
  }

  // Gets the scroll step value (configured or default to container size)
  function getScrollStep(container, config) {
    if (config.step !== null) {
      return config.step;
    }

    // Default to container client size
    if (config.orientation === 'horizontal') {
      return container.clientWidth;
    }
    return container.clientHeight;
  }

  // Core ScrollFade class implementation


  class ScrollFade {
    constructor(container) {
      this.id = generateUniqueId();
      this.container = container;
      this.list = null;
      this.config = null;

      this.state = {
        isAtStart: true,
        isAtEnd: false,
        isVisible: true,
        isScrollable: false,
      };

      // Element references
      this.startShadow = null;
      this.endShadow = null;
      this.prevBtn = null;
      this.nextBtn = null;

      // Bound handlers for cleanup
      this.boundHandlers = null;

      // Observers
      this.resizeObserver = null;
      this.intersectionObserver = null;

      // RAF tracking
      this.rafId = null;

      // Initialize
      const initialized = this.init();
      if (initialized) {
        this.container._scrollFade = this;
        this.container.setAttribute(attributes.id, this.id);
      }
    }

    init() {
      // Find required elements within container
      if (!this.findElements()) {
        return false;
      }

      // Parse config from list element
      this.config = parseConfig(this.list);

      // Validate list has overflow CSS
      this.validateOverflow();

      // Check initial scrollability
      this.state.isScrollable = isScrollable(this.list, this.config.orientation);

      // Setup observers
      this.setupObservers();

      // Bind event handlers
      this.bindHandlers();

      // Wire navigation buttons if present
      this.wireNavigationButtons();

      // Update initial state and fire events
      this.updateState(true);

      return true;
    }

    validateOverflow() {
      const style = getComputedStyle(this.list);
      const prop =
        this.config.orientation === 'horizontal' ? 'overflowX' : 'overflowY';
      const overflow = style[prop];

      if (overflow !== 'auto' && overflow !== 'scroll') {
        console.warn(
          `ScrollFade: List element should have overflow-${this.config.orientation === 'horizontal' ? 'x' : 'y'}: auto or scroll.`,
          this.list
        );
      }
    }

    findElements() {
      // Find scrollable list element
      this.list = this.container.querySelector(selectors.list);
      if (!this.list) {
        console.error(
          `ScrollFade: No list element found. Expected [data-scroll-fade-list] inside container.`,
          this.container
        );
        return false;
      }

      // Find shadow elements (user provides these in markup)
      this.startShadow = this.container.querySelector(selectors.start);
      this.endShadow = this.container.querySelector(selectors.end);

      if (!this.startShadow || !this.endShadow) {
        console.warn(
          `ScrollFade: Shadow elements not found. Expected [data-scroll-fade="start"] and [data-scroll-fade="end"].`,
          this.container
        );
      }

      return true;
    }

    setupObservers() {
      // ResizeObserver for dynamic scrollability changes
      this.resizeObserver = new ResizeObserver(() => {
        this.recalculate();
      });
      this.resizeObserver.observe(this.list);

      // IntersectionObserver to pause when not visible
      this.intersectionObserver = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          this.state.isVisible = entry.isIntersecting;
        },
        { threshold: 0 }
      );
      this.intersectionObserver.observe(this.list);
    }

    bindHandlers() {
      this.boundHandlers = {
        scroll: () => this.handleScroll(),
      };

      this.list.addEventListener('scroll', this.boundHandlers.scroll, {
        passive: true,
      });
    }

    wireNavigationButtons() {
      // Find buttons scoped to this container
      this.prevBtn = this.container.querySelector(selectors.prev);
      this.nextBtn = this.container.querySelector(selectors.next);

      if (this.prevBtn) {
        this.boundHandlers.prev = () => this.scrollPrev();
        this.prevBtn.addEventListener('click', this.boundHandlers.prev);
      }

      if (this.nextBtn) {
        this.boundHandlers.next = () => this.scrollNext();
        this.nextBtn.addEventListener('click', this.boundHandlers.next);
      }
    }

    handleScroll() {
      // Skip if not visible (IntersectionObserver optimization)
      if (!this.state.isVisible) return;

      // Use RAF for smooth updates
      if (this.rafId) {
        cancelAnimationFrame(this.rafId);
      }

      this.rafId = requestAnimationFrame(() => {
        this.updateState(false);
      });
    }

    updateState(isInitial) {
      const wasAtStart = this.state.isAtStart;
      const wasAtEnd = this.state.isAtEnd;
      const wasScrollable = this.state.isScrollable;

      // Recalculate state using list element
      this.state.isScrollable = isScrollable(this.list, this.config.orientation);
      this.state.isAtStart = isAtStart(this.list, this.config.orientation);
      this.state.isAtEnd = isAtEnd(this.list, this.config.orientation);

      // If not scrollable, both shadows should be hidden
      if (!this.state.isScrollable) {
        this.updateShadowVisibility('start', false, isInitial);
        this.updateShadowVisibility('end', false, isInitial);
        this.updateButtonStates();
        return;
      }

      // Update start shadow visibility
      const startVisible = !this.state.isAtStart;
      const startWasVisible = wasScrollable && !wasAtStart;

      if (isInitial || startVisible !== startWasVisible) {
        this.updateShadowVisibility('start', startVisible, isInitial);
      }

      // Update end shadow visibility
      const endVisible = !this.state.isAtEnd;
      const endWasVisible = wasScrollable && !wasAtEnd;

      if (isInitial || endVisible !== endWasVisible) {
        this.updateShadowVisibility('end', endVisible, isInitial);
      }

      // Emit reach events
      if (!isInitial) {
        if (this.state.isAtStart && !wasAtStart) {
          emit(this, events.reachStart);
        }
        if (this.state.isAtEnd && !wasAtEnd) {
          emit(this, events.reachEnd);
        }
      } else {
        // Fire initial reach events if at edge
        if (this.state.isAtStart) {
          emit(this, events.reachStart);
        }
        if (this.state.isAtEnd) {
          emit(this, events.reachEnd);
        }
      }

      // Update button states
      this.updateButtonStates();
    }

    updateShadowVisibility(edge, visible, isInitial) {
      const shadow = edge === 'start' ? this.startShadow : this.endShadow;

      if (visible) {
        shadow.classList.remove(classes.hidden);
      } else {
        shadow.classList.add(classes.hidden);
      }

      // Emit show/hide event
      const eventName = visible ? events.show : events.hide;
      emit(this, eventName, { edge });
    }

    updateButtonStates() {
      if (this.prevBtn) {
        if (this.state.isAtStart || !this.state.isScrollable) {
          this.prevBtn.classList.add(classes.buttonDisabled);
          this.prevBtn.setAttribute('aria-disabled', 'true');
        } else {
          this.prevBtn.classList.remove(classes.buttonDisabled);
          this.prevBtn.removeAttribute('aria-disabled');
        }
      }

      if (this.nextBtn) {
        if (this.state.isAtEnd || !this.state.isScrollable) {
          this.nextBtn.classList.add(classes.buttonDisabled);
          this.nextBtn.setAttribute('aria-disabled', 'true');
        } else {
          this.nextBtn.classList.remove(classes.buttonDisabled);
          this.nextBtn.removeAttribute('aria-disabled');
        }
      }
    }

    scrollPrev() {
      const step = getScrollStep(this.list, this.config);
      const isRtl = getTextDirection() === 'rtl';
      const isHorizontal = this.config.orientation === 'horizontal';

      if (isHorizontal) {
        // In RTL, "prev" scrolls right (positive)
        const scrollAmount = isRtl ? step : -step;
        this.list.scrollBy({
          left: scrollAmount,
          behavior: 'smooth',
        });
      } else {
        this.list.scrollBy({
          top: -step,
          behavior: 'smooth',
        });
      }
    }

    scrollNext() {
      const step = getScrollStep(this.list, this.config);
      const isRtl = getTextDirection() === 'rtl';
      const isHorizontal = this.config.orientation === 'horizontal';

      if (isHorizontal) {
        // In RTL, "next" scrolls left (negative)
        const scrollAmount = isRtl ? -step : step;
        this.list.scrollBy({
          left: scrollAmount,
          behavior: 'smooth',
        });
      } else {
        this.list.scrollBy({
          top: step,
          behavior: 'smooth',
        });
      }
    }

    recalculate() {
      this.updateState(false);
    }

    // Public API

    scrollToStart() {
      const isHorizontal = this.config.orientation === 'horizontal';
      const isRtl = getTextDirection() === 'rtl';

      if (isHorizontal) {
        const scrollTarget = isRtl
          ? getMaxScroll(this.list, this.config.orientation)
          : 0;
        this.list.scrollTo({
          left: scrollTarget,
          behavior: 'smooth',
        });
      } else {
        this.list.scrollTo({
          top: 0,
          behavior: 'smooth',
        });
      }

      return this;
    }

    scrollToEnd() {
      const isHorizontal = this.config.orientation === 'horizontal';
      const isRtl = getTextDirection() === 'rtl';
      const maxScroll = getMaxScroll(this.list, this.config.orientation);

      if (isHorizontal) {
        const scrollTarget = isRtl ? 0 : maxScroll;
        this.list.scrollTo({
          left: scrollTarget,
          behavior: 'smooth',
        });
      } else {
        this.list.scrollTo({
          top: maxScroll,
          behavior: 'smooth',
        });
      }

      return this;
    }

    refresh() {
      // Disconnect observers
      if (this.resizeObserver) {
        this.resizeObserver.disconnect();
      }
      if (this.intersectionObserver) {
        this.intersectionObserver.disconnect();
      }

      // Reconnect observers
      this.setupObservers();

      // Recalculate state
      this.updateState(false);

      return this;
    }

    destroy() {
      // Cancel any pending RAF
      if (this.rafId) {
        cancelAnimationFrame(this.rafId);
      }

      // Disconnect observers
      if (this.resizeObserver) {
        this.resizeObserver.disconnect();
      }
      if (this.intersectionObserver) {
        this.intersectionObserver.disconnect();
      }

      // Remove scroll listener from list
      if (this.boundHandlers && this.list) {
        this.list.removeEventListener('scroll', this.boundHandlers.scroll);
      }

      // Remove navigation button listeners
      if (this.prevBtn && this.boundHandlers?.prev) {
        this.prevBtn.removeEventListener('click', this.boundHandlers.prev);
      }
      if (this.nextBtn && this.boundHandlers?.next) {
        this.nextBtn.removeEventListener('click', this.boundHandlers.next);
      }
      this.prevBtn = null;
      this.nextBtn = null;

      // Clean up shadow classes (don't remove elements - user owns them)
      if (this.startShadow) {
        this.startShadow.classList.remove(classes.hidden);
      }
      if (this.endShadow) {
        this.endShadow.classList.remove(classes.hidden);
      }

      // Remove instance reference from container
      delete this.container._scrollFade;

      // Remove instance ID attribute
      this.container.removeAttribute(attributes.id);
    }
  }

  // ScrollFade entry point with auto-initialization


  // Auto-initialize all scroll-fade containers
  function autoInit() {
    const containers = document.querySelectorAll(selectors.container);

    containers.forEach((container) => {
      // Skip already initialized containers
      if (container._scrollFade) return;

      try {
        new ScrollFade(container);
      } catch (error) {
        console.warn('ScrollFade auto-initialization failed:', error);
      }
    });
  }

  // Run auto-init when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit);
  } else {
    autoInit();
  }

  exports.ScrollFade = ScrollFade;

  return exports;

})({});
//# sourceMappingURL=scroll-fade.js.map
