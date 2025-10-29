import { parseCoreConfig, parseCloningConfig, parseInteractionConfig } from '../config/parsers.js';
import { CONFIG } from '../config/config.js';
import { cloneItems, removeClones } from './cloning.js';
import { buildTimeline, rebuildTimeline } from './timeline.js';
import { attachHoverHandlers } from '../interaction/hover.js';

/**
 * Manages a single marquee instance with timeline, cloning, and interaction handlers.
 */
export class MarqueeInstance {
  constructor(container, options = {}) {
    if (!container || !(container instanceof Element)) {
      throw new Error('Marquee: container must be a valid DOM element');
    }

    if (!window.gsap) {
      console.error('Marquee: GSAP is required but not found. Load GSAP before initializing marquees.');
      return;
    }

    this.container = container;
    this.timeline = null;
    this.eventListeners = [];
    this.isHovering = false;
    this.wasPausedByEffect = false;
    this.pauseRampTimeline = null;
    this.baseTimeScale = 1;

    try {
      this.coreConfig = parseCoreConfig(container, options.core);
      this.cloningConfig = parseCloningConfig(container, options.cloning);
      this.interactionConfig = parseInteractionConfig(container, options.interaction);
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
        console.warn('Marquee: No items found with data-marquee-item="true"', this.container);
        return;
      }

      this.applyContainerStyles();
      cloneItems(this.container, originalItems, this.cloningConfig);
      buildTimeline(this);

      if (!this.timeline) {
        console.error('Marquee: Failed to create timeline', this.container);
        return;
      }

      this.baseTimeScale = this.timeline.timeScale();

      if (this.interactionConfig?.effectType) {
        attachHoverHandlers(this, this.interactionConfig);
      }

      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        this.timeline.timeScale(this.timeline.timeScale() * 0.1);
      }
    } catch (error) {
      console.error('Marquee: Initialization failed', error, this.container);
    }
  }

  // Applies flex layout and overflow styles to the container element
  applyContainerStyles() {
    this.container.style.display = 'flex';
    this.container.style.overflow = 'hidden';

    const isVertical = this.coreConfig.direction === 'vertical';
    this.container.style.flexDirection = isVertical ? 'column' : 'row';
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
    cloneItems(this.container, originalItems, this.cloningConfig);
    rebuildTimeline(this, preserveState);

    this.baseTimeScale = this.timeline ? this.timeline.timeScale() : 1;
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

    if (this.timeline) {
      if (typeof this.timeline.cleanup === 'function') {
        try {
          this.timeline.cleanup();
        } catch (e) {}
      }
      this.timeline.kill();
      this.timeline = null;
    }

    removeClones(this.container);
  }
}
