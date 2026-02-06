// Core ScrollFade class implementation

import { selectors, attributes, classes, events } from './config.js';
import {
  generateUniqueId,
  parseConfig,
  emit,
  getTextDirection,
  isScrollable,
  isAtStart,
  isAtEnd,
  getMaxScroll,
  getScrollStep,
} from './utils.js';

export class ScrollFade {
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
