import { parseCoreConfig, parseCloningConfig, parseInteractionConfig, parseObserverConfig } from './setup/parsers.js';
import { CONFIG } from './setup/config.js';
import { cloneItems, removeClones } from './features/cloning.js';
import { buildTimeline, rebuildTimeline } from './features/timeline.js';
import { attachHoverHandlers } from './features/hover.js';
import { setupIntersectionObserver } from './features/observer.js';

/**
 * Manages a single marquee instance with timeline, cloning, and interaction handlers.
 */
export class MarqueeInstance {
  constructor(container, options = {}) {
    if (!container || !(container instanceof window.Element)) {
      throw new Error('Marquee: container must be a valid DOM element');
    }

    if (!window.gsap) {
      console.error(
        'Marquee: GSAP is required but not found.\n' +
        'Load GSAP before the marquee library:\n' +
        '<script src="https://cdn.jsdelivr.net/npm/gsap@3/dist/gsap.min.js"></script>'
      );
      return;
    }

    this.container = container;
    this.timeline = null;
    this.eventListeners = [];
    this.isHovering = false;
    this.wasPausedByEffect = false;
    this.pauseRampTimeline = null;
    this.baseTimeScale = 1;
    this.currentDirection = null;
    this.intersectionObserver = null;

    try {
      this.coreConfig = parseCoreConfig(container, options.core);
      this.cloningConfig = parseCloningConfig(container, options.cloning);
      this.interactionConfig = parseInteractionConfig(container, options.interaction);
      this.observerConfig = parseObserverConfig(container, options.observers);
    } catch (error) {
      console.error('Marquee: Failed to parse configuration', error);
      return;
    }

    this.initialize();
  }

  // Sets up container, clones items, builds timeline, and attaches interaction handlers
  initialize() {
    try {
      const originalItems = this.getOriginalItems();

      if (originalItems.length === 0) {
        console.warn(
          'Marquee: No items found with data-marquee-item="true".\n' +
          'Add the attribute to child elements:\n' +
          '<div data-marquee-item="true">Item content</div>',
          this.container
        );
        return;
      }

      this.validateContainerStyles();
      this.applyContainerStyles();
      const isVertical = this.coreConfig.direction === 'vertical';
      cloneItems(this.container, originalItems, this.cloningConfig, isVertical);

      // If intersection observer is enabled, start timeline paused
      if (this.observerConfig.intersection) {
        this.coreConfig.paused = true;
      }

      buildTimeline(this);

      if (!this.timeline) {
        console.error(
          'Marquee: Failed to create timeline. Possible causes:\n' +
          '- Items are hidden (display: none)\n' +
          '- Items have zero width/height\n' +
          '- Invalid CSS on container or items',
          this.container
        );
        return;
      }

      this.baseTimeScale = this.timeline.timeScale();

      // Apply reduced motion before setting up observer
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        this.timeline.timeScale(this.timeline.timeScale() * 0.1);
      }

      // Setup intersection observer after timeline is built
      if (this.observerConfig.intersection && this.timeline) {
        setupIntersectionObserver(this, this.observerConfig);
      }

      if (this.interactionConfig?.effectType) {
        attachHoverHandlers(this, this.interactionConfig);
      }

      // Store initial direction for change detection
      this.currentDirection = this.coreConfig.direction;
    } catch (error) {
      console.error('Marquee: Initialization failed', error, this.container);
    }
  }

  // Checks if CSS direction has changed and returns true if different
  checkDirectionChange() {
    const computedStyle = window.getComputedStyle(this.container);
    const flexDirection = computedStyle.flexDirection;
    const isVertical = flexDirection === 'column' || flexDirection === 'column-reverse';
    const newDirection = isVertical ? 'vertical' : 'horizontal';

    return newDirection !== this.currentDirection;
  }

  // Manually refresh direction and rebuild if changed
  refreshDirection() {
    if (this.checkDirectionChange()) {
      const computedStyle = window.getComputedStyle(this.container);
      const flexDirection = computedStyle.flexDirection;
      const isVertical = flexDirection === 'column' || flexDirection === 'column-reverse';
      const newDirection = isVertical ? 'vertical' : 'horizontal';

      this.currentDirection = newDirection;
      this.coreConfig.direction = newDirection;
      this.rebuild(true);
    }
  }

  // Validates container CSS and warns about missing required styles
  validateContainerStyles() {
    if (this.container.hasAttribute(CONFIG.internalFlags.attributes.stylesValidated)) {
      return;
    }

    const computed = window.getComputedStyle(this.container);

    if (computed.display !== 'flex' && computed.display !== 'inline-flex') {
      console.warn('Marquee: Container should have display: flex. Add it to your CSS or let the library apply it.', this.container);
    }

    // Mark as validated to avoid repeated warnings
    this.container.setAttribute(CONFIG.internalFlags.attributes.stylesValidated, 'true');
  }

  // Applies flex layout and overflow styles only if not already set
  applyContainerStyles() {
    const computed = window.getComputedStyle(this.container);

    if (computed.display !== 'flex' && computed.display !== 'inline-flex') {
      this.container.style.display = 'flex';
    }

    if (computed.overflow !== 'hidden') {
      this.container.style.overflow = 'hidden';
    }

    // Don't force flex-direction - it's read from CSS in parseDirection
  }

  // Returns only non-cloned marquee items
  getOriginalItems() {
    return Array.from(
      this.container.querySelectorAll(
        `[${CONFIG.core.attributes.item}="true"]:not([aria-hidden="true"])`
      )
    );
  }

  // Returns all marquee items including clones
  findMarqueeItems() {
    return Array.from(
      this.container.querySelectorAll(`[${CONFIG.core.attributes.item}="true"]`)
    );
  }

  // Removes old clones, recreates them, and rebuilds timeline with optional state preservation
  rebuild(preserveState = true) {
    if (this.pauseRampTimeline) {
      this.pauseRampTimeline.kill();
      this.pauseRampTimeline = null;
    }

    this.wasPausedByEffect = false;
    this.isHovering = false;

    removeClones(this.container);
    const originalItems = this.getOriginalItems();
    const isVertical = this.coreConfig.direction === 'vertical';
    cloneItems(this.container, originalItems, this.cloningConfig, isVertical);
    rebuildTimeline(this, preserveState);

    this.baseTimeScale = this.timeline ? this.timeline.timeScale() : 1;

    // Re-setup intersection observer if it was enabled
    if (this.observerConfig.intersection && this.timeline) {
      if (this.intersectionObserver) {
        this.intersectionObserver.disconnect();
      }
      setupIntersectionObserver(this, this.observerConfig);
    }
  }

  // Resumes the marquee animation
  play() {
    if (this.timeline) {
      this.timeline.play();
    }
  }

  // Pauses the marquee animation
  pause() {
    if (this.timeline) {
      this.timeline.pause();
    }
  }

  // Cleans up all event listeners, timelines, and cloned elements
  destroy() {
    this.eventListeners.forEach(({ type, handler, target }) => {
      target.removeEventListener(type, handler);
    });
    this.eventListeners = [];

    if (this.pauseRampTimeline) {
      this.pauseRampTimeline.kill();
      this.pauseRampTimeline = null;
    }

    // Cleanup intersection observer
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
      this.intersectionObserver = null;
    }

    if (this.timeline) {
      if (typeof this.timeline.cleanup === 'function') {
        try {
          this.timeline.cleanup();
        // eslint-disable-next-line no-unused-vars
        } catch (_e) {}
      }
      this.timeline.kill();
      this.timeline = null;
    }

    removeClones(this.container);
  }
}
