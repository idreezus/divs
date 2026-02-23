// Main Carousel class and core functionality

import { CLASSES, CSS_VARS, EVENTS, SELECTORS } from './config';
import {
  generateUniqueId,
  parseConfig,
  prefersReducedMotion,
  emit,
  calculateDimensions,
  updateCSSProperties,
  warnUnreachableItems,
} from './utils';
import {
  detectActiveItem,
  handleScroll,
  scrollToItem,
  handleNext,
  handlePrev,
  setupResizeObserver,
  setupMarkers,
  updateUI,
} from './navigation';
import { setupKeyboardNavigation } from './keyboard';
import {
  setupAutoplay,
  startAutoplay,
  stopAutoplay,
  cleanupAutoplay,
} from './autoplay';
import type {
  CarouselInstance,
  CarouselConfig,
  CarouselState,
  BoundHandlers,
  BoundMarkerHandler,
  AutoplayState,
  DebouncedFunction,
  CarouselHTMLElement,
} from './types';

// Finds and validates all required and optional elements within the carousel container
function findElements(instance: CarouselInstance): boolean {
  const { container, id } = instance;

  // Find required track element (legacy backwards compat)
  const track = container.querySelector<HTMLElement>(`${SELECTORS.TRACK}, [data-carousel="track"]`);
  if (!track) {
    console.warn(
      `Carousel ${id}: Track element not found. Expected element with data-carousel-track.`
    );
    return false;
  }

  // Find required item elements (legacy backwards compat)
  const items = [...container.querySelectorAll<HTMLElement>(`${SELECTORS.ITEM}, [data-carousel="item"]`)];
  if (items.length === 0) {
    console.warn(
      `Carousel ${id}: No items found. Expected at least one element with data-carousel-item.`
    );
    return false;
  }

  // Find optional navigation buttons (legacy backwards compat)
  const prevBtns = [...container.querySelectorAll<HTMLElement>(`${SELECTORS.PREV_BTN}, [data-carousel="prev"]`)];
  const nextBtns = [...container.querySelectorAll<HTMLElement>(`${SELECTORS.NEXT_BTN}, [data-carousel="next"]`)];

  // Find optional markers (can be anywhere in container)
  const markers = [...container.querySelectorAll<HTMLElement>(SELECTORS.MARKER)];

  // Find optional counter elements
  const counterCurrentEls = [...container.querySelectorAll<HTMLElement>(SELECTORS.COUNTER_CURRENT)];
  const counterTotalEls = [...container.querySelectorAll<HTMLElement>(SELECTORS.COUNTER_TOTAL)];

  // Find autoplay-specific elements only when autoplay is configured
  let playPauseBtns: HTMLElement[] = [];
  let restartBtns: HTMLElement[] = [];

  if (instance.config.autoplay) {
    playPauseBtns = [...container.querySelectorAll<HTMLElement>(SELECTORS.PLAY_PAUSE_BTN)];
    restartBtns = [...container.querySelectorAll<HTMLElement>(SELECTORS.RESTART_BTN)];
  } else {
    if (container.querySelector(SELECTORS.PLAY_PAUSE_BTN)) {
      console.warn(
        `Carousel ${id}: Play/pause button found but autoplay is not enabled. Add data-carousel-autoplay to the container.`
      );
    }
    if (container.querySelector(SELECTORS.RESTART_BTN)) {
      console.warn(
        `Carousel ${id}: Restart button found but autoplay is not enabled. Add data-carousel-autoplay to the container.`
      );
    }
  }

  // Add data-carousel-id for easier debugging in devtools
  container.setAttribute('data-carousel-id', id);

  // Store all element references on the instance
  Object.assign(instance, {
    track,
    items,
    prevBtns,
    nextBtns,
    markers,
    playPauseBtns,
    restartBtns,
    counterCurrentEls,
    counterTotalEls,
  });

  return true;
}

// Attaches event listeners for user interactions
function attachEventListeners(instance: CarouselInstance): void {
  const { track } = instance;

  // Create bound handlers and store them for later removal
  instance.boundHandlers = {
    scroll: () => {
      handleScroll(instance);
    },
    prev: () => instance.prev(),
    next: () => instance.next(),
  };

  // Attach scroll listener with passive flag for better performance
  track!.addEventListener('scroll', instance.boundHandlers.scroll, {
    passive: true,
  });

  // Attach button listeners if buttons exist
  instance.prevBtns.forEach(btn => btn.addEventListener('click', instance.boundHandlers!.prev));
  instance.nextBtns.forEach(btn => btn.addEventListener('click', instance.boundHandlers!.next));

  // Autoplay-specific listeners (only when autoplay is configured)
  if (instance.config.autoplay) {
    if (instance.playPauseBtns.length > 0) {
      instance.boundHandlers.playPause = () => {
        if (instance.state.isAutoplaying) {
          stopAutoplay(instance, 'user');
        } else {
          instance.play();
        }
      };
      instance.playPauseBtns.forEach(btn => btn.addEventListener('click', instance.boundHandlers!.playPause!));
    }

    if (instance.restartBtns.length > 0) {
      instance.boundHandlers.restart = () => {
        instance.goTo(0);
        instance.play();
      };
      instance.restartBtns.forEach(btn => btn.addEventListener('click', instance.boundHandlers!.restart!));
    }
  }
}

// Cleans up all event listeners, observers, and references
function cleanup(instance: CarouselInstance): void {
  const { track, container } = instance;

  // Clean up autoplay before removing other listeners
  cleanupAutoplay(instance);

  if (instance.boundHandlers?.playPause) {
    instance.playPauseBtns?.forEach(btn => btn.removeEventListener('click', instance.boundHandlers!.playPause!));
  }

  if (instance.boundHandlers?.restart) {
    instance.restartBtns?.forEach(btn => btn.removeEventListener('click', instance.boundHandlers!.restart!));
  }

  // Remove event listeners using stored bound handlers
  if (instance.boundHandlers) {
    track!.removeEventListener('scroll', instance.boundHandlers.scroll);

    instance.prevBtns?.forEach(btn => btn.removeEventListener('click', instance.boundHandlers!.prev));
    instance.nextBtns?.forEach(btn => btn.removeEventListener('click', instance.boundHandlers!.next));

    // Remove keyboard listener if it exists
    if (instance.boundHandlers.keyboard) {
      container.removeEventListener('keydown', instance.boundHandlers.keyboard);
    }

    // Remove marker keyboard listener if it exists
    if (instance.boundHandlers.markerKeydown && instance.markerGroup) {
      instance.markerGroup.removeEventListener('keydown', instance.boundHandlers.markerKeydown);
    }
  }

  // Remove marker event listeners
  if (instance.boundMarkerHandlers) {
    instance.boundMarkerHandlers.forEach(({ marker, handler }) => {
      marker.removeEventListener('click', handler);
    });
  }

  // Remove inline styles from track and items
  if (instance.track) {
    instance.track.style.removeProperty('scroll-behavior');
  }
  if (instance.items) {
    instance.items.forEach((item) => item.style.removeProperty('scroll-snap-align'));
  }

  // Remove live region element
  instance.liveRegion?.remove();

  // Disconnect ResizeObserver
  if (instance.resizeObserver) {
    instance.resizeObserver.disconnect();
    instance.resizeObserver = null;
  }

  if (instance.container) {
    delete (instance.container as CarouselHTMLElement)._carousel;
  }

  instance.debouncedScrollHandler?.cancel();
  instance.debouncedResizeHandler?.cancel();

  // Clear all instance properties to help garbage collection
  Object.keys(instance).forEach((key) => {
    (instance as Record<string, unknown>)[key] = null;
  });
}

// Initializes the carousel instance
function init(instance: CarouselInstance): boolean {
  const { container, config } = instance;

  // Find and validate elements first
  const elementsFound = findElements(instance);
  if (!elementsFound) {
    return false;
  }

  // Force instant scrolling when user prefers reduced motion
  if (prefersReducedMotion()) {
    instance.track!.style.scrollBehavior = 'auto';
  }

  // Set semantic roles on track and items (only if not already set by author)
  if (!instance.track!.hasAttribute('role')) {
    instance.track!.setAttribute('role', 'list');
  }
  instance.items.forEach((item) => {
    if (!item.hasAttribute('role')) {
      item.setAttribute('role', 'listitem');
    }
    item.style.scrollSnapAlign = config.align;
  });

  // Add accessible label to restart buttons
  instance.restartBtns.forEach(btn => {
    if (!btn.hasAttribute('aria-label')) btn.setAttribute('aria-label', 'Restart autoplay');
  });

  // Calculate initial dimensions
  calculateDimensions(instance);

  // Warn if loop/autoplay enabled with unreachable items
  warnUnreachableItems(instance);

  // Set initial CSS custom properties before first paint
  updateCSSProperties(instance);

  // Create live region for screen reader announcements
  const liveRegion = document.createElement('div');
  Object.assign(liveRegion.style, {
    position: 'absolute',
    width: '1px',
    height: '1px',
    padding: '0',
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0,0,0,0)',
    whiteSpace: 'nowrap',
    border: '0',
  });
  liveRegion.setAttribute('aria-live', 'polite');
  liveRegion.setAttribute('aria-atomic', 'true');
  container.appendChild(liveRegion);
  instance.liveRegion = liveRegion;

  // Attach event listeners
  attachEventListeners(instance);

  // Set up responsive behavior
  setupResizeObserver(instance);

  // Set up markers if they exist
  setupMarkers(instance);

  // Set up keyboard navigation if enabled
  if (config.keyboard) {
    setupKeyboardNavigation(instance);
  }

  // Set up autoplay if enabled and reduced motion is not preferred
  if (prefersReducedMotion()) {
    container.classList.add(CLASSES.REDUCED_MOTION);
  }
  if (config.autoplay && !prefersReducedMotion()) {
    if (instance.state.totalPositions <= 1) {
      console.warn(
        `Carousel ${instance.id}: Autoplay has nothing to cycle through (only 1 item). Add more items or remove data-carousel-autoplay.`
      );
    }
    container.style.setProperty(CSS_VARS.AUTOPLAY_DURATION, config.autoplayDuration + 'ms');
    setupAutoplay(instance, handleNext);
    instance.autoplay!.onStop = () => updateUI(instance);
    startAutoplay(instance);
  }

  // Set initial UI state
  updateUI(instance);

  return true;
}

// Main Carousel class
export class Carousel {
  container!: HTMLElement;
  id!: string;
  config!: CarouselConfig;
  state!: CarouselState;
  rafPending!: boolean;
  boundHandlers!: BoundHandlers | null;
  debouncedScrollHandler!: DebouncedFunction | null;
  track!: HTMLElement | null;
  liveRegion!: HTMLElement | null;
  markerGroup!: HTMLElement | null;
  items!: HTMLElement[];
  prevBtns!: HTMLElement[];
  nextBtns!: HTMLElement[];
  markers!: HTMLElement[];
  playPauseBtns!: HTMLElement[];
  restartBtns!: HTMLElement[];
  counterCurrentEls!: HTMLElement[];
  counterTotalEls!: HTMLElement[];
  snapAlign!: 'start' | 'center' | 'end';
  debouncedResizeHandler!: DebouncedFunction | null;
  resizeObserver!: ResizeObserver | null;
  boundMarkerHandlers!: BoundMarkerHandler[];
  autoplay!: AutoplayState | null;

  constructor(container: HTMLElement) {
    const id = generateUniqueId();
    const config = parseConfig(container);

    // Initialize state object with all tracking properties
    const state: CarouselState = {
      currentIndex: 0,
      itemPositions: [],
      gap: 0,
      containerWidth: 0,
      scrollWidth: 0,
      startInset: 0,
      endInset: 0,
      maxReachableIndex: 0,
      totalPositions: 0,
      hasEmittedStart: false,
      hasEmittedEnd: false,
    };

    // Store core properties on instance
    Object.assign(this, {
      container,
      id,
      config,
      state,
      rafPending: false,
      boundHandlers: null,
      debouncedScrollHandler: null,
    });

    // Initialize the carousel
    const initialized = init(this as unknown as CarouselInstance);
    (container as CarouselHTMLElement)._carousel = this;
    if (!initialized) {
      console.warn(
        `Carousel ${id}: Initialization failed due to missing required elements.`
      );
    }
  }

  // Navigates to the next item
  next(): this {
    if (this.autoplay) stopAutoplay(this as unknown as CarouselInstance, 'user');
    handleNext(this as unknown as CarouselInstance);
    return this;
  }

  // Navigates to the previous item
  prev(): this {
    if (this.autoplay) stopAutoplay(this as unknown as CarouselInstance, 'user');
    handlePrev(this as unknown as CarouselInstance);
    return this;
  }

  // Navigates to a specific item by index
  goTo(targetIndex: number): this {
    const { items, state } = this;

    if (targetIndex < 0 || targetIndex >= items.length) {
      console.warn(
        `Carousel ${this.id}: Invalid index ${targetIndex}. Must be between 0 and ${
          items.length - 1
        }.`
      );
      return this;
    }

    // Clamp to maxReachableIndex (indices beyond it share the last snap position)
    let index = targetIndex;
    if (index > state.maxReachableIndex) {
      index = state.maxReachableIndex;
    }

    if (this.autoplay) stopAutoplay(this as unknown as CarouselInstance, 'user');

    // Set index directly (decoupled)
    if (index !== state.currentIndex) {
      state.currentIndex = index;
      updateUI(this as unknown as CarouselInstance);
      emit(this as unknown as CarouselInstance, EVENTS.SNAPCHANGE, { index });
    }

    // Scroll as visual effect
    scrollToItem(this as unknown as CarouselInstance, index);
    return this;
  }

  // Starts autoplay fresh (always full duration)
  play(): this {
    if (!this.config.autoplay) {
      console.warn(
        `Carousel ${this.id}: Autoplay is not enabled. Add data-carousel-autoplay to the container.`
      );
      return this;
    }
    if (prefersReducedMotion()) return this;
    if (!this.autoplay) {
      setupAutoplay(this as unknown as CarouselInstance, handleNext);
      this.autoplay!.onStop = () => updateUI(this as unknown as CarouselInstance);
    }
    this.container.style.setProperty(CSS_VARS.AUTOPLAY_DURATION, this.config.autoplayDuration + 'ms');
    startAutoplay(this as unknown as CarouselInstance);
    return this;
  }

  // Stops autoplay completely
  stop(): this {
    stopAutoplay(this as unknown as CarouselInstance, 'user');
    return this;
  }

  // Returns the current active item index
  getActiveIndex(): number {
    return this.state.currentIndex;
  }

  // Manually recalculates dimensions and updates UI
  refresh(): this {
    const prevTotalPositions = this.state.totalPositions;

    calculateDimensions(this as unknown as CarouselInstance);

    // Re-setup markers if snap group count changed
    if (this.state.totalPositions !== prevTotalPositions) {
      setupMarkers(this as unknown as CarouselInstance);
    }

    // Clamp currentIndex
    if (this.state.currentIndex > this.state.maxReachableIndex) {
      this.state.currentIndex = this.state.maxReachableIndex;
    }

    detectActiveItem(this as unknown as CarouselInstance);
    updateUI(this as unknown as CarouselInstance);
    return this;
  }

  // Destroys the carousel instance and cleans up all resources
  destroy(): null {
    cleanup(this as unknown as CarouselInstance);
    return null;
  }

  // Static method for manual initialization
  static init(container: string | HTMLElement): Carousel {
    if (typeof container === 'string') {
      container = document.querySelector(container) as HTMLElement;
    }
    if (!container) {
      throw new Error('Carousel.init(): Container element not found');
    }
    return new Carousel(container);
  }
}
