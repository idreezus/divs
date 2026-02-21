/*!
 * Carousel v1.1.0
 * A smooth scrolling slider that leverages native CSS for easy setup and styling.
 * 
 * A part of Divs by Idreezus, a component library
 * divs.idreezus.com
 * 
 * (c) 2026 Idrees Isse (https://github.com/idreezus)
 * Released under AGPL-3.0
 */

(function () {
  'use strict';

  const SELECTORS = {
    CONTAINER: '[data-carousel="container"]',
    TRACK: '[data-carousel="track"]',
    ITEM: '[data-carousel="item"]',
    PREV_BTN: '[data-carousel="prev"]',
    NEXT_BTN: '[data-carousel="next"]',
    DOT: '[data-carousel-dot]',
    PAGINATION_CURRENT: '[data-carousel-pagination-current]',
    PAGINATION_TOTAL: '[data-carousel-pagination-total]',
    PLAY_PAUSE_BTN: '[data-carousel-play-pause]',
  };

  // CSS classes applied to elements
  const CLASSES = {
    SCROLLING: 'carousel-scrolling', // Applied to track while user or programmatic scroll is active
    DISABLED: 'carousel-button-disabled', // Applied to buttons when at start/end edges
    ACTIVE: 'carousel-item-active', // Applied to the current active item
    ANIMATING: 'carousel-animating', // Applied to track during programmatic scroll
    SNAP_DISABLED: 'carousel-snap-disabled', // Applied to track to temporarily disable scroll-snap during button navigation
    DOT_ACTIVE: 'carousel-dot-active', // Applied to the current active pagination dot
    PLAYING: 'carousel-playing',
    REDUCED_MOTION: 'carousel-reduced-motion',
  };

  const DEFAULTS = {
    ALIGN: 'start',
    SCROLL_BY: 'item',
    AUTOPLAY_DURATION: 5000};

  // Timing constants in milliseconds
  const TIMING = {
    DEBOUNCE_RESIZE: 150,
    DEBOUNCE_SCROLL: 100,
    SNAP_DISABLE_DURATION: 50,
    SCROLL_END_FALLBACK: 800,
  };

  // Pixel tolerance for fractional pixel calculations
  const TOLERANCE = {
    EDGE_DETECTION: 1};

  // CSS custom property names
  const CSS_VARS = {
    INDEX: '--carousel-index',
    TOTAL: '--carousel-total',
    PROGRESS: '--carousel-progress',
    AUTOPLAY_PROGRESS: '--carousel-autoplay-progress',
    AUTOPLAY_DURATION: '--carousel-autoplay-duration',
  };

  // Event names for CustomEvents
  const EVENTS = {
    AUTOPLAY_START: 'autoplay-start',
    AUTOPLAY_STOP: 'autoplay-stop',
  };

  const CONFIG = {
    SELECTORS,
    CLASSES,
    TIMING,
    TOLERANCE,
    CSS_VARS};

  // Pure utility functions for the carousel library


  // Counter for generating unique carousel IDs
  let idCounter = 0;

  // Generates a unique ID for each carousel instance
  function generateUniqueId() {
    idCounter += 1;
    return `carousel-${idCounter}`;
  }

  // Parses configuration from data attributes on the container element
  function parseConfig(container) {
    const align = container.getAttribute('data-carousel-align') || DEFAULTS.ALIGN;
    const keyboard = container.getAttribute('data-carousel-keyboard') === 'true';
    const loop = container.getAttribute('data-carousel-loop') === 'true';
    const scrollBy = container.getAttribute('data-carousel-scroll-by') || DEFAULTS.SCROLL_BY;
    const autoplay = container.getAttribute('data-carousel-autoplay') === 'true';
    const autoplayDuration = parseInt(container.getAttribute('data-carousel-autoplay-duration'), 10) || DEFAULTS.AUTOPLAY_DURATION;
    const autoplayPauseHover = container.getAttribute('data-carousel-autoplay-pause-hover') === 'true';
    const autoplayPauseFocus = container.getAttribute('data-carousel-autoplay-pause-focus') !== 'false';

    return {
      align,
      keyboard,
      loop,
      scrollBy,
      autoplay,
      autoplayDuration,
      autoplayPauseHover,
      autoplayPauseFocus,
    };
  }

  // Checks if the user prefers reduced motion
  function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  // Creates a debounced version of a function
  function debounce(func, wait) {
    let timeout;

    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };

      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Calculates the reference point for snap alignment detection
  function calculateReferencePoint(
    scrollLeft,
    containerWidth,
    snapAlign,
    offsets = {}
  ) {
    const { startInset = 0, endInset = 0 } = offsets;
    switch (snapAlign) {
      case 'center':
        return scrollLeft + containerWidth / 2 + (startInset - endInset) / 2;
      case 'end':
        return scrollLeft + containerWidth - endInset;
      default: // 'start'
        return scrollLeft + startInset;
    }
  }

  // Gets the alignment point for a specific item based on snap alignment
  function getItemAlignmentPoint(item, snapAlign) {
    const marginStart = item.marginStart || 0;
    const marginEnd = item.marginEnd || 0;
    switch (snapAlign) {
      case 'center':
        return item.center + (marginEnd - marginStart) / 2;
      case 'end':
        return item.right + marginEnd;
      default: // 'start'
        return item.left - marginStart;
    }
  }

  // Finds the index of the active item based on scroll position
  function findActiveIndex(
    itemPositions,
    scrollLeft,
    containerWidth,
    snapAlign,
    options = {}
  ) {
    const { startInset = 0, endInset = 0 } = options;
    const referencePoint = calculateReferencePoint(
      scrollLeft,
      containerWidth,
      snapAlign,
      { startInset, endInset }
    );

    let closestIndex = 0;
    let minDistance = Infinity;

    itemPositions.forEach((item, index) => {
      const itemPoint = getItemAlignmentPoint(item, snapAlign);
      const distance = Math.abs(itemPoint - referencePoint);

      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = index;
      }
    });

    return closestIndex;
  }

  // Finds the target index when scrolling forward by one container width
  function findNextPageIndex(instance) {
    const { track, state, config } = instance;
    const { itemPositions, containerWidth, maxReachableIndex } = state;
    const targetLeft = track.scrollLeft + containerWidth;

    for (let i = state.currentIndex + 1; i < itemPositions.length; i++) {
      if (i > maxReachableIndex) return config.loop ? 0 : maxReachableIndex;
      if (itemPositions[i].left >= targetLeft) return i;
    }

    // Near the end
    return config.loop ? 0 : maxReachableIndex;
  }

  // Finds the target index when scrolling backward by one container width
  function findPrevPageIndex(instance) {
    const { track, state, config } = instance;
    const { itemPositions, containerWidth, maxReachableIndex } = state;
    const targetLeft = track.scrollLeft - containerWidth;

    for (let i = state.currentIndex - 1; i >= 0; i--) {
      if (itemPositions[i].left <= targetLeft) return i;
    }

    // Near the start
    return config.loop ? maxReachableIndex : 0;
  }

  // Returns the total number of navigable positions (snap groups)
  function calculateTotalSlides(instance) {
    return instance.state.totalPositions;
  }

  // Emits custom events both through the instance event system and as DOM events
  function emit(instance, event, data = {}) {
    const { events, container } = instance;

    // Call registered callbacks via instance.on()
    if (events.has(event)) {
      const callbacks = events.get(event);
      callbacks.forEach((callback) => {
        callback.call(instance, {
          type: event,
          target: instance,
          ...data,
        });
      });
    }

    // Dispatch native DOM custom event for addEventListener compatibility
    const customEvent = new CustomEvent(`carousel:${event}`, {
      detail: { carousel: instance, ...data },
      bubbles: true,
    });
    container.dispatchEvent(customEvent);
  }

  // Calculates and stores all dimensional measurements for the carousel
  function calculateDimensions(instance) {
    const { track, items, state, config } = instance;

    // Get computed styles to read CSS properties
    const trackStyle = getComputedStyle(track);

    const parseOffset = (value) => {
      if (!value || value === 'auto') {
        return { value: 0, specified: false };
      }
      const parsed = parseFloat(value);
      if (Number.isNaN(parsed)) {
        return { value: 0, specified: false };
      }
      return { value: parsed, specified: true };
    };

    // Read gap from CSS (try both gap and column-gap for compatibility)
    const gap = parseFloat(trackStyle.gap || trackStyle.columnGap) || 0;

    const paddingInlineStart = parseOffset(
      trackStyle.paddingInlineStart || trackStyle.paddingLeft
    );
    const paddingInlineEnd = parseOffset(
      trackStyle.paddingInlineEnd || trackStyle.paddingRight
    );
    const scrollPaddingInlineStart = parseOffset(
      trackStyle.scrollPaddingInlineStart || trackStyle.scrollPaddingLeft
    );
    const scrollPaddingInlineEnd = parseOffset(
      trackStyle.scrollPaddingInlineEnd || trackStyle.scrollPaddingRight
    );

    const startInset = scrollPaddingInlineStart.specified
      ? scrollPaddingInlineStart.value
      : paddingInlineStart.value;
    const endInset = scrollPaddingInlineEnd.specified
      ? scrollPaddingInlineEnd.value
      : paddingInlineEnd.value;

    // Measure container and scroll dimensions
    const containerWidth = track.clientWidth;
    const scrollWidth = track.scrollWidth;

    // Calculate basic position data for active item detection
    const trackRect = track.getBoundingClientRect();
    const itemPositions = items.map((item, index) => {
      const rect = item.getBoundingClientRect();
      const itemStyle = getComputedStyle(item);

      // Read scroll-margin for detection calculations
      const marginStartValue = parseFloat(
        itemStyle.scrollMarginInlineStart || itemStyle.scrollMarginLeft
      );
      const marginEndValue = parseFloat(
        itemStyle.scrollMarginInlineEnd || itemStyle.scrollMarginRight
      );
      const marginStart = Number.isNaN(marginStartValue) ? 0 : marginStartValue;
      const marginEnd = Number.isNaN(marginEndValue) ? 0 : marginEndValue;

      // Calculate left position relative to track, accounting for current scroll
      const left = rect.left - trackRect.left + track.scrollLeft;
      const width = rect.width;

      return {
        index,
        left,
        width,
        center: left + width / 2,
        right: left + width,
        marginStart,
        marginEnd,
      };
    });

    // Update state with measurements needed for detection
    Object.assign(state, {
      gap,
      containerWidth,
      scrollWidth,
      itemPositions,
      startInset,
      endInset,
    });

    // Store snap alignment on instance for reference
    instance.snapAlign = config.align;

    // Compute the highest index findActiveIndex can detect at max scroll
    const maxScroll = scrollWidth - containerWidth;
    let maxReachableIndex;
    if (maxScroll <= 0) {
      maxReachableIndex = 0;
    } else {
      maxReachableIndex = findActiveIndex(
        itemPositions, maxScroll, containerWidth, config.align,
        { startInset, endInset }
      );
    }

    const totalPositions = maxReachableIndex + 1;

    Object.assign(state, {
      maxReachableIndex,
      totalPositions,
    });
  }

  // Updates CSS custom properties on the carousel container
  function updateCSSProperties(instance) {
    const { container, track, items, state } = instance;
    const { currentIndex, scrollWidth, containerWidth } = state;

    // Set one-based index for display friendliness
    container.style.setProperty(CSS_VARS.INDEX, currentIndex + 1);

    // Set total navigable positions (snap groups)
    container.style.setProperty(CSS_VARS.TOTAL, state.totalPositions);

    // Calculate progress (0-1) based on scroll position
    const maxScroll = scrollWidth - containerWidth;
    const scrollLeft = track.scrollLeft;
    const progress =
      maxScroll > 0 ? Math.min(1, Math.max(0, scrollLeft / maxScroll)) : 0;
    container.style.setProperty(CSS_VARS.PROGRESS, progress);
  }

  // Logs a console warning when loop/autoplay is enabled with unreachable items
  function warnUnreachableItems(instance) {
    const { config, state, items, id } = instance;
    if (state.maxReachableIndex >= items.length - 1) return;
    if (!config.loop && !config.autoplay) return;

    const unreachableCount = items.length - 1 - state.maxReachableIndex;
    const features = [config.loop && 'loop', config.autoplay && 'autoplay'].filter(Boolean).join(' and ');
    console.warn(
      `Carousel ${id}: ${unreachableCount} item(s) (indices ${state.maxReachableIndex + 1}-${items.length - 1}) ` +
      `share the same scroll position as item ${state.maxReachableIndex} and cannot be individually activated. ` +
      `${features} will cycle through ${state.totalPositions} positions instead of ${items.length}. ` +
      `To make every item individually reachable, use wider items or add padding-inline-end to the track.`
    );
  }

  // Keyboard navigation support


  // Applies the active class to the current item and removes it from others
  function updateActiveClasses(instance) {
    const { items, state } = instance;
    const { CLASSES } = CONFIG;
    const { currentIndex } = state;

    items.forEach((item, index) => {
      item.classList.toggle(CLASSES.ACTIVE, index === currentIndex);
    });
  }

  // Sets up keyboard event listeners for navigation
  function setupKeyboardNavigation(instance) {
    const { container } = instance;

    // Make container focusable if not already
    if (!container.hasAttribute('tabindex')) {
      container.setAttribute('tabindex', '0');
    }

    // Create and store bound handler
    const handleKeydown = (event) => {
      // Only handle keys if focus is on container or its children
      if (!container.contains(event.target)) {
        return;
      }

      // Handle navigation keys
      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          instance.prev();
          break;

        case 'ArrowRight':
          event.preventDefault();
          instance.next();
          break;

        case 'Home':
          event.preventDefault();
          instance.goTo(0);
          break;

        case 'End':
          event.preventDefault();
          instance.goTo(instance.state.maxReachableIndex);
          break;
      }
    };

    // Store handler for cleanup
    instance.boundHandlers.keyboard = handleKeydown;

    // Attach listener to container
    container.addEventListener('keydown', handleKeydown);
  }

  // Navigation and pagination functionality


  // Detects which item is currently active based on scroll position
  function detectActiveItem(instance) {
    const { track, state, snapAlign } = instance;
    const { itemPositions, currentIndex, startInset = 0, endInset = 0 } = state;

    // Find the active index using scroll position
    const scrollLeft = track.scrollLeft;
    const activeIndex = findActiveIndex(
      itemPositions,
      scrollLeft,
      state.containerWidth,
      snapAlign,
      {
        startInset,
        endInset,
      }
    );

    // Only update if the active item has changed
    if (activeIndex !== currentIndex) {
      state.currentIndex = activeIndex;
      updateUI(instance);
      emit(instance, 'change', { index: activeIndex });
    }
  }

  // Updates the disabled state of navigation buttons based on current index
  function updateButtonStates(instance) {
    const { track, prevBtn, nextBtn, state, config } = instance;
    const { CLASSES, TOLERANCE } = CONFIG;

    // Edge detection still uses physical scroll position (for reach-start/reach-end events)
    const scrollLeft = track.scrollLeft;
    const maxScroll = state.scrollWidth - state.containerWidth;
    const atStart = scrollLeft <= TOLERANCE.EDGE_DETECTION;
    const atEnd = scrollLeft >= maxScroll - TOLERANCE.EDGE_DETECTION;

    // Button disabled state uses index (not scroll position)
    const atFirstPosition = state.currentIndex <= 0;
    const atLastPosition = state.currentIndex >= state.maxReachableIndex;

    if (config.loop) {
      if (prevBtn) { prevBtn.classList.remove(CLASSES.DISABLED); prevBtn.disabled = false; }
      if (nextBtn) { nextBtn.classList.remove(CLASSES.DISABLED); nextBtn.disabled = false; }
    } else {
      if (prevBtn) {
        prevBtn.classList.toggle(CLASSES.DISABLED, atFirstPosition);
        prevBtn.disabled = atFirstPosition;
      }
      if (nextBtn) {
        nextBtn.classList.toggle(CLASSES.DISABLED, atLastPosition);
        nextBtn.disabled = atLastPosition;
      }
    }

    // Edge events still fire based on physical scroll position
    if (atStart && !state.hasEmittedStart) {
      emit(instance, 'reach-start');
      state.hasEmittedStart = true;
    } else if (!atStart) {
      state.hasEmittedStart = false;
    }

    if (atEnd && !state.hasEmittedEnd) {
      emit(instance, 'reach-end');
      state.hasEmittedEnd = true;
    } else if (!atEnd) {
      state.hasEmittedEnd = false;
    }
  }

  // Handles scroll events on the track
  function handleScroll(instance) {
    const { track } = instance;
    const { CLASSES, TIMING } = CONFIG;

    track.classList.add(CLASSES.SCROLLING);
    emit(instance, 'scroll', { scrollLeft: track.scrollLeft });

    // Only run debounced detection for user-initiated scrolls.
    // For programmatic scrolls, currentIndex is already set by the caller.
    if (!instance.state.isProgrammaticScroll) {
      if (!instance.debouncedScrollHandler) {
        instance.debouncedScrollHandler = debounce(() => {
          detectActiveItem(instance);
          updateButtonStates(instance);
          track.classList.remove(CLASSES.SCROLLING);
        }, TIMING.DEBOUNCE_SCROLL);
      }
      instance.debouncedScrollHandler();
    }
  }

  // Calculates the index of the next item for navigation
  function calculateNextIndex(instance) {
    const { state, config } = instance;

    if (config.scrollBy === 'page') return findNextPageIndex(instance);

    const nextIndex = state.currentIndex + 1;
    if (nextIndex > state.maxReachableIndex) {
      return config.loop ? 0 : state.maxReachableIndex;
    }
    return nextIndex;
  }

  // Calculates the index of the previous item for navigation
  function calculatePrevIndex(instance) {
    const { state, config } = instance;

    if (config.scrollBy === 'page') return findPrevPageIndex(instance);

    const prevIndex = state.currentIndex - 1;
    if (prevIndex < 0) {
      return config.loop ? state.maxReachableIndex : 0;
    }
    return prevIndex;
  }

  // Scrolls to a specific item index with smooth animation
  function scrollToItem(instance, index) {
    const { track, items, state, snapAlign } = instance;
    const { CLASSES, TIMING } = CONFIG;

    const targetItem = items[index];
    if (!targetItem) {
      console.warn(`Carousel ${instance.id}: No item found at index ${index}`);
      return;
    }

    // Cancel any pending scroll cleanup from a previous scrollToItem call
    if (instance._scrollCleanup) {
      instance._scrollCleanup();
    }

    state.isProgrammaticScroll = true;
    track.classList.add(CLASSES.ANIMATING);
    track.classList.add(CLASSES.SNAP_DISABLED);

    // Re-enable scroll-snap after short delay
    setTimeout(() => {
      track.classList.remove(CLASSES.SNAP_DISABLED);
    }, TIMING.SNAP_DISABLE_DURATION);

    // One-shot scrollend listener to clear programmatic scroll flag
    const onScrollEnd = () => {
      clearTimeout(fallbackTimer);
      state.isProgrammaticScroll = false;
      track.classList.remove(CLASSES.ANIMATING);
      track.classList.remove(CLASSES.SCROLLING);
      instance._scrollCleanup = null;
    };
    track.addEventListener('scrollend', onScrollEnd, { once: true });

    // Fallback timeout: if scrollIntoView produces no scroll (item already in view),
    // scrollend won't fire. Clear the flag after a generous timeout.
    const fallbackTimer = setTimeout(() => {
      track.removeEventListener('scrollend', onScrollEnd);
      state.isProgrammaticScroll = false;
      track.classList.remove(CLASSES.ANIMATING);
      track.classList.remove(CLASSES.SCROLLING);
      instance._scrollCleanup = null;
    }, TIMING.SCROLL_END_FALLBACK);

    // Store cleanup function so a subsequent scrollToItem can cancel this one
    instance._scrollCleanup = () => {
      track.removeEventListener('scrollend', onScrollEnd);
      clearTimeout(fallbackTimer);
      state.isProgrammaticScroll = false;
      track.classList.remove(CLASSES.ANIMATING);
      instance._scrollCleanup = null;
    };

    targetItem.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: snapAlign,
    });
  }

  // Handles next button click
  function handleNext(instance) {
    const { state } = instance;
    if (state.isProgrammaticScroll) return;

    const targetIndex = calculateNextIndex(instance);
    if (targetIndex === state.currentIndex) return;

    // Set index directly (decoupled from scroll detection)
    state.currentIndex = targetIndex;
    updateUI(instance);
    emit(instance, 'change', { index: targetIndex });

    // Scroll as visual effect
    scrollToItem(instance, targetIndex);
  }

  // Handles previous button click
  function handlePrev(instance) {
    const { state } = instance;
    if (state.isProgrammaticScroll) return;

    const targetIndex = calculatePrevIndex(instance);
    if (targetIndex === state.currentIndex) return;

    state.currentIndex = targetIndex;
    updateUI(instance);
    emit(instance, 'change', { index: targetIndex });

    scrollToItem(instance, targetIndex);
  }

  // Sets up ResizeObserver to handle responsive behavior
  function setupResizeObserver(instance) {
    const { container, track } = instance;
    const { TIMING } = CONFIG;

    const debouncedResize = debounce(() => {
      if (container.offsetParent === null) return;

      const prevTotalPositions = instance.state.totalPositions;

      calculateDimensions(instance);

      // If the number of snap positions changed, re-setup pagination
      if (instance.state.totalPositions !== prevTotalPositions) {
        setupPagination(instance);
      }

      // Clamp currentIndex to new maxReachableIndex
      if (instance.state.currentIndex > instance.state.maxReachableIndex) {
        instance.state.currentIndex = instance.state.maxReachableIndex;
      }

      detectActiveItem(instance);
      updateButtonStates(instance);
    }, TIMING.DEBOUNCE_RESIZE);

    instance.debouncedResizeHandler = debouncedResize;

    const resizeObserver = new ResizeObserver(() => {
      debouncedResize();
    });

    resizeObserver.observe(container);
    resizeObserver.observe(track);
    instance.resizeObserver = resizeObserver;
  }

  // Sets up pagination dots if any exist in the container
  function setupPagination(instance) {
    const { dots: existingDots, container, items, id } = instance;
    const { CLASSES } = CONFIG;

    // Skip if no dots exist
    if (!existingDots || existingDots.length === 0) return;

    // Remove previously bound handlers before rebuilding dots
    if (instance.boundDotHandlers) {
      instance.boundDotHandlers.forEach(({ dot, handler }) => {
        dot.removeEventListener('click', handler);
      });
    }

    // Initialize handler storage
    instance.boundDotHandlers = [];

    const totalSlides = calculateTotalSlides(instance);

    // Converts any provided dot into a semantic button for accessibility
    const normalizeDotElement = (dot) => {
      if (dot.tagName && dot.tagName.toLowerCase() === 'button') {
        return dot;
      }

      const button = document.createElement('button');

      [...dot.attributes].forEach((attribute) => {
        button.setAttribute(attribute.name, attribute.value);
      });

      while (dot.firstChild) {
        button.appendChild(dot.firstChild);
      }

      dot.replaceWith(button);
      return button;
    };

    // Use first dot as template
    const templateDot = normalizeDotElement(existingDots[0]);
    const allDots = [templateDot];

    // Normalize remaining existing dots
    for (let i = 1; i < existingDots.length; i++) {
      allDots.push(normalizeDotElement(existingDots[i]));
    }

    // Get parent from first dot for appending clones
    const dotsParent = templateDot.parentElement;

    // Clone template to match total slides
    while (allDots.length < totalSlides) {
      const duplicate = templateDot.cloneNode(true);
      dotsParent.appendChild(duplicate);
      allDots.push(duplicate);
    }

    // Remove excess dots
    while (allDots.length > totalSlides) {
      const removed = allDots.pop();
      removed.remove();
    }

    // Prepare each dot with attributes, aria-label, and click handler
    const preparedDots = [];
    allDots.forEach((dot, index) => {
      dot.setAttribute('type', 'button');

      // Remove any pre-existing active class so scripted state controls visuals
      dot.classList.remove(CLASSES.DOT_ACTIVE);

      // Add accessible label
      dot.setAttribute(
        'aria-label',
        `Go to slide ${index + 1} of ${totalSlides}`
      );

      // Bind click handler (goTo handles autoplay stop)
      const handler = () => {
        instance.goTo(index);
      };
      dot.addEventListener('click', handler);
      instance.boundDotHandlers.push({ dot, handler });
      preparedDots.push(dot);
    });

    // Update dots reference on instance
    instance.dots = preparedDots;

    // Set initial active state
    updatePagination(instance);
  }

  // Updates pagination dots to reflect current active item
  function updatePagination(instance) {
    const { dots, container, state } = instance;
    const { CLASSES, SELECTORS } = CONFIG;
    const { currentIndex } = state;

    if (dots && dots.length > 0) {
      dots.forEach((dot, index) => {
        const isActive = index === currentIndex;
        dot.classList.toggle(CLASSES.DOT_ACTIVE, isActive);

        if (isActive) {
          dot.setAttribute('aria-current', 'true');
        } else {
          dot.removeAttribute('aria-current');
        }
      });
    }

    const currentEl = container.querySelector(SELECTORS.PAGINATION_CURRENT);
    if (currentEl) {
      currentEl.textContent = currentIndex + 1;
    }

    const totalEl = container.querySelector(SELECTORS.PAGINATION_TOTAL);
    if (totalEl) {
      totalEl.textContent = state.totalPositions;
    }
  }

  // Batches DOM updates using requestAnimationFrame for better performance
  function updateUI(instance) {
    const { rafPending } = instance;

    // Avoid scheduling multiple RAF callbacks
    if (rafPending) return;

    instance.rafPending = true;
    requestAnimationFrame(() => {
      updateActiveClasses(instance);
      updateButtonStates(instance);
      updatePagination(instance);
      updateCSSProperties(instance);
      instance.rafPending = false;
    });
  }

  // Autoplay behavior for carousel: timer, progress updates, pause/resume


  // RAF tick loop for autoplay progress
  function runAutoplayTick(instance) {
    const { state, config, autoplay } = instance;

    if (!state.isAutoplaying || state.isPaused) return;

    const elapsed = performance.now() - state.autoplayStartTime;
    const progress = Math.min(elapsed / config.autoplayDuration, 1);

    // Update progress on container
    instance.container.style.setProperty(CSS_VARS.AUTOPLAY_PROGRESS, progress.toString());

    // Update progress on active dot, reset inactive dots
    if (instance.dots?.length > 0) {
      instance.dots.forEach((dot, index) => {
        if (index === state.currentIndex) {
          dot.style.setProperty(CSS_VARS.AUTOPLAY_PROGRESS, progress.toString());
        } else {
          dot.style.setProperty(CSS_VARS.AUTOPLAY_PROGRESS, '0');
        }
      });
    }

    if (progress >= 1) {
      autoplay.advanceFn(instance);
      state.autoplayStartTime = performance.now();
    }

    autoplay.rafId = requestAnimationFrame(() => runAutoplayTick(instance));
  }

  // Checks if autoplay can resume from a temporary pause
  function canResume(instance) {
    const { autoplay, state } = instance;
    return (
      state.isAutoplaying &&
      autoplay.isVisible &&
      !autoplay.pausedByHover &&
      !autoplay.pausedByFocus
    );
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

    // Hover pause handlers (target the track, not container)
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
      instance.track.addEventListener('mouseenter', instance.autoplay.handleMouseEnter);
      instance.track.addEventListener('mouseleave', instance.autoplay.handleMouseLeave);
    }

    // Focus pause handlers (target the track, not container)
    if (config.autoplayPauseFocus) {
      instance.autoplay.handleFocusIn = () => {
        instance.autoplay.pausedByFocus = true;
        pauseAutoplay(instance, 'focus');
      };
      instance.autoplay.handleFocusOut = (e) => {
        // Only resume if focus leaves the track entirely
        if (!instance.track.contains(e.relatedTarget)) {
          instance.autoplay.pausedByFocus = false;
          if (canResume(instance)) {
            resumeAutoplay(instance);
          }
        }
      };
      instance.track.addEventListener('focusin', instance.autoplay.handleFocusIn);
      instance.track.addEventListener('focusout', instance.autoplay.handleFocusOut);
    }
  }

  // Starts autoplay timer with RAF progress updates
  function startAutoplay(instance) {
    const { container, state } = instance;

    state.isAutoplaying = true;
    state.isPaused = false;
    state.autoplayStartTime = performance.now();

    container.classList.add(CLASSES.PLAYING);

    // Update play/pause button
    if (instance.playPauseBtn) {
      instance.playPauseBtn.setAttribute('aria-pressed', 'true');
    }

    emit(instance, EVENTS.AUTOPLAY_START, { index: state.currentIndex });

    instance.autoplay.rafId = requestAnimationFrame(() =>
      runAutoplayTick(instance)
    );
  }

  // Temporarily pauses autoplay (for hover, focus, visibility)
  function pauseAutoplay(instance, reason = 'user') {
    const { state, container } = instance;

    if (!state.isAutoplaying || state.isPaused) return;

    state.isPaused = true;

    // Cancel RAF
    if (instance.autoplay.rafId) {
      cancelAnimationFrame(instance.autoplay.rafId);
      instance.autoplay.rafId = null;
    }

    container.classList.remove(CLASSES.PLAYING);

    // Update play/pause button
    if (instance.playPauseBtn) {
      instance.playPauseBtn.setAttribute('aria-pressed', 'false');
    }

    // Store elapsed time and active index so we can resume from this point
    const elapsed = performance.now() - state.autoplayStartTime;
    state.autoplayElapsed = elapsed;
    state.autoplayPausedOnIndex = state.currentIndex;
    const progress = Math.min(elapsed / instance.config.autoplayDuration, 1);

    emit(instance, EVENTS.AUTOPLAY_STOP, {
      index: state.currentIndex,
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
    // Resume from stored elapsed time only if still on the same slide, otherwise reset
    const sameSlide = state.autoplayPausedOnIndex === state.currentIndex;
    state.autoplayStartTime = sameSlide
      ? performance.now() - (state.autoplayElapsed || 0)
      : performance.now();

    container.classList.add(CLASSES.PLAYING);

    // Update play/pause button
    if (instance.playPauseBtn) {
      instance.playPauseBtn.setAttribute('aria-pressed', 'true');
    }

    emit(instance, EVENTS.AUTOPLAY_START, { index: state.currentIndex });

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

    container.classList.remove(CLASSES.PLAYING);

    // Update play/pause button
    if (instance.playPauseBtn) {
      instance.playPauseBtn.setAttribute('aria-pressed', 'false');
    }

    emit(instance, EVENTS.AUTOPLAY_STOP, {
      index: state.currentIndex,
      progress,
      reason,
    });

    // Reset progress on container
    container.style.setProperty(CSS_VARS.AUTOPLAY_PROGRESS, '0');

    // Reset progress on all dots
    if (instance.dots?.length > 0) {
      instance.dots.forEach((dot) => {
        dot.style.setProperty(CSS_VARS.AUTOPLAY_PROGRESS, '0');
      });
    }
  }

  // Cleans up autoplay listeners and observer
  function cleanupAutoplay(instance) {
    const { config, autoplay } = instance;

    if (!autoplay) return;

    // Cancel RAF
    if (autoplay.rafId) {
      cancelAnimationFrame(autoplay.rafId);
    }

    // Disconnect IntersectionObserver
    if (autoplay.observer) {
      autoplay.observer.disconnect();
    }

    // Remove hover listeners from track
    if (config.autoplayPauseHover && autoplay.handleMouseEnter) {
      instance.track.removeEventListener('mouseenter', autoplay.handleMouseEnter);
      instance.track.removeEventListener('mouseleave', autoplay.handleMouseLeave);
    }

    // Remove focus listeners from track
    if (config.autoplayPauseFocus && autoplay.handleFocusIn) {
      instance.track.removeEventListener('focusin', autoplay.handleFocusIn);
      instance.track.removeEventListener('focusout', autoplay.handleFocusOut);
    }

    instance.autoplay = null;
  }

  // Main Carousel class and core functionality


  // Finds and validates all required and optional elements within the carousel container
  function findElements(instance) {
    const { container, id } = instance;
    const { SELECTORS } = CONFIG;

    // Find required track element
    const track = container.querySelector(SELECTORS.TRACK);
    if (!track) {
      console.warn(
        `Carousel ${id}: Track element not found. Expected element with data-carousel="track".`
      );
      return false;
    }

    // Find required item elements
    const items = [...container.querySelectorAll(SELECTORS.ITEM)];
    if (items.length === 0) {
      console.warn(
        `Carousel ${id}: No items found. Expected at least one element with data-carousel="item".`
      );
      return false;
    }

    // Find optional navigation buttons (no warning if missing)
    const prevBtn = container.querySelector(SELECTORS.PREV_BTN);
    const nextBtn = container.querySelector(SELECTORS.NEXT_BTN);

    // Find optional pagination dots (can be anywhere in container)
    const dots = [...container.querySelectorAll(SELECTORS.DOT)];

    // Find optional play-pause button
    const playPauseBtn = container.querySelector(SELECTORS.PLAY_PAUSE_BTN);

    // Add data-carousel-id for easier debugging in devtools
    container.setAttribute('data-carousel-id', id);

    // Store all element references on the instance
    Object.assign(instance, {
      track,
      items,
      prevBtn,
      nextBtn,
      dots,
      playPauseBtn,
    });

    return true;
  }

  // Attaches event listeners for user interactions
  function attachEventListeners(instance) {
    const { track, prevBtn, nextBtn, id } = instance;

    // Create bound handlers and store them for later removal
    instance.boundHandlers = {
      scroll: () => {
        // User scroll while autoplay is running → stop autoplay
        if (!instance.state.isProgrammaticScroll && instance.state.isAutoplaying) {
          stopAutoplay(instance, 'user');
        }
        handleScroll(instance);
      },
      prev: () => instance.prev(),
      next: () => instance.next(),
    };

    // Attach scroll listener with passive flag for better performance
    track.addEventListener('scroll', instance.boundHandlers.scroll, {
      passive: true,
    });

    // Attach button listeners if buttons exist
    if (prevBtn) {
      prevBtn.addEventListener('click', instance.boundHandlers.prev);
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', instance.boundHandlers.next);
    }

    // Attach play-pause button handler
    if (instance.playPauseBtn) {
      instance.boundHandlers.playPause = () => {
        if (instance.state.isAutoplaying) {
          stopAutoplay(instance, 'user');
        } else {
          instance.play();
        }
      };
      instance.playPauseBtn.addEventListener('click', instance.boundHandlers.playPause);
    }
  }

  // Cleans up all event listeners, observers, and references
  function cleanup(instance) {
    const { prevBtn, nextBtn, track, container } = instance;

    // Cancel pending scroll cleanup
    if (instance._scrollCleanup) {
      instance._scrollCleanup();
    }

    // Clean up autoplay before removing other listeners
    cleanupAutoplay(instance);

    if (instance.playPauseBtn && instance.boundHandlers?.playPause) {
      instance.playPauseBtn.removeEventListener('click', instance.boundHandlers.playPause);
    }

    // Remove event listeners using stored bound handlers
    if (instance.boundHandlers) {
      track.removeEventListener('scroll', instance.boundHandlers.scroll);

      if (prevBtn) {
        prevBtn.removeEventListener('click', instance.boundHandlers.prev);
      }
      if (nextBtn) {
        nextBtn.removeEventListener('click', instance.boundHandlers.next);
      }

      // Remove keyboard listener if it exists
      if (instance.boundHandlers.keyboard) {
        container.removeEventListener('keydown', instance.boundHandlers.keyboard);
      }
    }

    // Remove pagination dot event listeners
    if (instance.boundDotHandlers) {
      instance.boundDotHandlers.forEach(({ dot, handler }) => {
        dot.removeEventListener('click', handler);
      });
    }

    // Disconnect ResizeObserver
    if (instance.resizeObserver) {
      instance.resizeObserver.disconnect();
      instance.resizeObserver = null;
    }

    // Clear all instance properties to help garbage collection
    Object.keys(instance).forEach((key) => {
      instance[key] = null;
    });
  }

  // Initializes the carousel instance
  function init(instance) {
    const { container, config } = instance;
    const { CLASSES, CSS_VARS } = CONFIG;

    // Find and validate elements first
    const elementsFound = findElements(instance);
    if (!elementsFound) {
      return false;
    }

    // Calculate initial dimensions
    calculateDimensions(instance);

    // Warn if loop/autoplay enabled with unreachable items
    warnUnreachableItems(instance);

    // Set initial CSS custom properties before first paint
    updateCSSProperties(instance);

    // Attach event listeners
    attachEventListeners(instance);

    // Set up responsive behavior
    setupResizeObserver(instance);

    // Set up pagination if dots exist
    setupPagination(instance);

    // Set up keyboard navigation if enabled
    if (config.keyboard) {
      setupKeyboardNavigation(instance);
    }

    // Set up autoplay if enabled and reduced motion is not preferred
    if (prefersReducedMotion()) {
      container.classList.add(CLASSES.REDUCED_MOTION);
    }
    if (config.autoplay && !prefersReducedMotion()) {
      container.style.setProperty(CSS_VARS.AUTOPLAY_DURATION, config.autoplayDuration + 'ms');
      setupAutoplay(instance, handleNext);
      startAutoplay(instance);
    }

    // Set initial UI state
    updateUI(instance);

    return true;
  }

  // Main Carousel class
  class Carousel {
    constructor(container) {
      const id = generateUniqueId();
      const config = parseConfig(container);

      // Initialize state object with all tracking properties
      const state = {
        currentIndex: 0,
        isProgrammaticScroll: false,
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
        isAutoplaying: false,
        isPaused: false,
        autoplayStartTime: null,
        autoplayElapsed: 0,
        autoplayPausedOnIndex: null,
      };

      // Store core properties on instance
      Object.assign(this, {
        container,
        id,
        config,
        state,
        events: new Map(),
        rafPending: false,
        boundHandlers: null,
        debouncedScrollHandler: null,
        autoplay: null,
      });

      // Initialize the carousel
      const initialized = init(this);
      if (!initialized) {
        console.warn(
          `Carousel ${id}: Initialization failed due to missing required elements.`
        );
      }
    }

    // Navigates to the next item
    next() {
      if (this.state.isAutoplaying) stopAutoplay(this, 'user');
      handleNext(this);
      return this;
    }

    // Navigates to the previous item
    prev() {
      if (this.state.isAutoplaying) stopAutoplay(this, 'user');
      handlePrev(this);
      return this;
    }

    // Navigates to a specific item by index
    goTo(index) {
      const { items, state } = this;

      if (index < 0 || index >= items.length) {
        console.warn(
          `Carousel ${this.id}: Invalid index ${index}. Must be between 0 and ${
          items.length - 1
        }.`
        );
        return this;
      }

      // Clamp to maxReachableIndex (indices beyond it share the last snap position)
      if (index > state.maxReachableIndex) {
        index = state.maxReachableIndex;
      }

      if (state.isAutoplaying) stopAutoplay(this, 'user');

      // Set index directly (decoupled)
      if (index !== state.currentIndex) {
        state.currentIndex = index;
        updateUI(this);
        emit(this, 'change', { index });
      }

      // Scroll as visual effect
      scrollToItem(this, index);
      return this;
    }

    // Starts autoplay fresh (always full duration)
    play() {
      const { CSS_VARS } = CONFIG;
      if (prefersReducedMotion()) return this;
      if (!this.autoplay) setupAutoplay(this, handleNext);
      this.container.style.setProperty(CSS_VARS.AUTOPLAY_DURATION, this.config.autoplayDuration + 'ms');
      startAutoplay(this);
      return this;
    }

    // Stops autoplay completely
    stop() {
      stopAutoplay(this, 'user');
      return this;
    }

    // Returns the current active item index
    getActiveIndex() {
      return this.state.currentIndex;
    }

    // Manually recalculates dimensions and updates UI
    refresh() {
      const prevTotalPositions = this.state.totalPositions;

      calculateDimensions(this);

      // Re-setup pagination if snap group count changed
      if (this.state.totalPositions !== prevTotalPositions) {
        setupPagination(this);
      }

      // Clamp currentIndex
      if (this.state.currentIndex > this.state.maxReachableIndex) {
        this.state.currentIndex = this.state.maxReachableIndex;
      }

      detectActiveItem(this);
      updateUI(this);
      return this;
    }

    // Destroys the carousel instance and cleans up all resources
    destroy() {
      cleanup(this);
      return null;
    }

    // Subscribes to a carousel event
    on(event, callback) {
      const { events } = this;
      if (!events.has(event)) {
        events.set(event, []);
      }
      events.get(event).push(callback);
      return this;
    }

    // Unsubscribes from a carousel event
    off(event, callback) {
      const { events } = this;
      if (!events.has(event)) return this;

      const callbacks = events.get(event);
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
        throw new Error('Carousel.init(): Container element not found');
      }
      return new Carousel(container);
    }
  }

  // Entry point for the carousel library


  // Global registry to store all initialized carousel instances
  const instances = new Map();

  // Auto-initializes all carousels on the page when DOM is ready
  function autoInit() {
    const containers = document.querySelectorAll(SELECTORS.CONTAINER);

    containers.forEach((container) => {
      try {
        const carousel = new Carousel(container);
        if (carousel.id) {
          instances.set(carousel.id, carousel);
        }
      } catch (error) {
        console.warn('Carousel auto-initialization failed:', error);
      }
    });

    if (instances.size > 0) ;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit);
  } else {
    autoInit();
  }

  if (typeof window !== 'undefined') {
    window.Carousel = Carousel;
    window.CarouselInstances = instances;
  }

})();
//# sourceMappingURL=carousel.js.map
