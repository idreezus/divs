/*!
 * ScrollFade v1.0.0
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

  // Selectors for querying DOM elements
  // Presence-based: attribute exists and value !== "false"
  const selectors = {
    container:
      '[data-scroll-fade-container]:not([data-scroll-fade-container="false"])',
    prev: '[data-scroll-fade-prev]:not([data-scroll-fade-prev="false"])',
    next: '[data-scroll-fade-next]:not([data-scroll-fade-next="false"])',
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

  // Parses configuration from container data attributes
  function parseConfig(container) {
    const orientation =
      container.getAttribute(attributes.orientation) || defaults.orientation;

    const stepAttr = container.getAttribute(attributes.step);
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
      this.config = parseConfig(container);

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
      // Validate container has overflow CSS
      this.validateOverflow();

      // Check initial scrollability
      this.state.isScrollable = isScrollable(
        this.container,
        this.config.orientation
      );

      // Create and inject shadow elements
      this.createShadowElements();

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
      const style = getComputedStyle(this.container);
      const prop =
        this.config.orientation === 'horizontal' ? 'overflowX' : 'overflowY';
      const overflow = style[prop];

      if (overflow !== 'auto' && overflow !== 'scroll') {
        console.warn(
          `ScrollFade: Container should have overflow-${this.config.orientation === 'horizontal' ? 'x' : 'y'}: auto or scroll.`,
          this.container
        );
      }
    }

    createShadowElements() {
      const isRtl = getTextDirection() === 'rtl';
      const isHorizontal = this.config.orientation === 'horizontal';

      // Create start shadow
      this.startShadow = document.createElement('div');
      this.startShadow.setAttribute('data-scroll-fade', 'start');
      this.startShadow.setAttribute('aria-hidden', 'true');
      this.startShadow.style.position = 'absolute';
      this.startShadow.style.pointerEvents = 'none';

      // Create end shadow
      this.endShadow = document.createElement('div');
      this.endShadow.setAttribute('data-scroll-fade', 'end');
      this.endShadow.setAttribute('aria-hidden', 'true');
      this.endShadow.style.position = 'absolute';
      this.endShadow.style.pointerEvents = 'none';

      // Apply edge positions based on orientation and RTL
      if (isHorizontal) {
        if (isRtl) {
          // RTL: start is right, end is left
          this.startShadow.style.right = '0';
          this.endShadow.style.left = '0';
        } else {
          // LTR: start is left, end is right
          this.startShadow.style.left = '0';
          this.endShadow.style.right = '0';
        }
        this.startShadow.style.top = '0';
        this.endShadow.style.top = '0';
      } else {
        // Vertical: start is top, end is bottom
        this.startShadow.style.top = '0';
        this.startShadow.style.left = '0';
        this.endShadow.style.bottom = '0';
        this.endShadow.style.left = '0';
      }

      // Append to container
      this.container.appendChild(this.startShadow);
      this.container.appendChild(this.endShadow);
    }

    setupObservers() {
      // ResizeObserver for dynamic scrollability changes
      this.resizeObserver = new ResizeObserver(() => {
        this.recalculate();
      });
      this.resizeObserver.observe(this.container);

      // IntersectionObserver to pause when not visible
      this.intersectionObserver = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          this.state.isVisible = entry.isIntersecting;
        },
        { threshold: 0 }
      );
      this.intersectionObserver.observe(this.container);
    }

    bindHandlers() {
      this.boundHandlers = {
        scroll: () => this.handleScroll(),
      };

      this.container.addEventListener('scroll', this.boundHandlers.scroll, {
        passive: true,
      });
    }

    wireNavigationButtons() {
      // Find prev button
      this.prevBtn = document.querySelector(selectors.prev);
      if (
        this.prevBtn &&
        this.prevBtn.closest(selectors.container) !== this.container
      ) ;

      // Find next button
      this.nextBtn = document.querySelector(selectors.next);

      if (this.prevBtn) {
        this.prevBtn.addEventListener('click', () => this.scrollPrev());
      }

      if (this.nextBtn) {
        this.nextBtn.addEventListener('click', () => this.scrollNext());
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

      // Recalculate state
      this.state.isScrollable = isScrollable(
        this.container,
        this.config.orientation
      );
      this.state.isAtStart = isAtStart(this.container, this.config.orientation);
      this.state.isAtEnd = isAtEnd(this.container, this.config.orientation);

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
      const step = getScrollStep(this.container, this.config);
      const isRtl = getTextDirection() === 'rtl';
      const isHorizontal = this.config.orientation === 'horizontal';

      if (isHorizontal) {
        // In RTL, "prev" scrolls right (positive)
        const scrollAmount = isRtl ? step : -step;
        this.container.scrollBy({
          left: scrollAmount,
          behavior: 'smooth',
        });
      } else {
        this.container.scrollBy({
          top: -step,
          behavior: 'smooth',
        });
      }
    }

    scrollNext() {
      const step = getScrollStep(this.container, this.config);
      const isRtl = getTextDirection() === 'rtl';
      const isHorizontal = this.config.orientation === 'horizontal';

      if (isHorizontal) {
        // In RTL, "next" scrolls left (negative)
        const scrollAmount = isRtl ? -step : step;
        this.container.scrollBy({
          left: scrollAmount,
          behavior: 'smooth',
        });
      } else {
        this.container.scrollBy({
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
          ? getMaxScroll(this.container, this.config.orientation)
          : 0;
        this.container.scrollTo({
          left: scrollTarget,
          behavior: 'smooth',
        });
      } else {
        this.container.scrollTo({
          top: 0,
          behavior: 'smooth',
        });
      }

      return this;
    }

    scrollToEnd() {
      const isHorizontal = this.config.orientation === 'horizontal';
      const isRtl = getTextDirection() === 'rtl';
      const maxScroll = getMaxScroll(this.container, this.config.orientation);

      if (isHorizontal) {
        const scrollTarget = isRtl ? 0 : maxScroll;
        this.container.scrollTo({
          left: scrollTarget,
          behavior: 'smooth',
        });
      } else {
        this.container.scrollTo({
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

      // Remove event listeners
      if (this.boundHandlers) {
        this.container.removeEventListener('scroll', this.boundHandlers.scroll);
      }

      // Remove navigation button listeners (by removing references)
      // Note: We can't remove click listeners without storing bound references
      // For simplicity, we just null the references
      this.prevBtn = null;
      this.nextBtn = null;

      // Remove shadow elements from DOM
      if (this.startShadow && this.startShadow.parentNode) {
        this.startShadow.parentNode.removeChild(this.startShadow);
      }
      if (this.endShadow && this.endShadow.parentNode) {
        this.endShadow.parentNode.removeChild(this.endShadow);
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
