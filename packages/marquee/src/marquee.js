import { horizontalLoop, verticalLoop } from './utils/seamlessLoop.js';
import { computeMedianGap } from './spacing.js';
import { CONFIG } from './config/config.js';
import { buildConfigFromElement } from './config/parsers.js';

// Stores all active marquee instances
// Using WeakMap prevents memory leaks since instances are automatically garbage collected when elements are removed
const instances = new WeakMap();

// Manages a single marquee instance
class MarqueeInstance {
  // Creates and initializes a new marquee from a container element
  constructor(containerElement) {
    this.container = containerElement;
    this.timeline = null;
    this.eventListeners = [];
    this.baseTimeScale = 1; // baseline magnitude to restore to after interaction
    this.wasPausedByEffect = false; // tracks if a pause was caused by the interaction effect
    this.isHovering = false; // tracks whether a pointer is currently inside the trigger area
    this.pauseRampTimeline = null; // small internal timeline used to ramp to a pause
    this.resizeObserver = null; // observes container size changes
    this.mutationObserver = null; // observes DOM/text changes that affect layout
    this._rebuildTimer = null; // debounce timer id

    // Build full configuration from data attributes on the container
    const { core, cloning, interaction } = buildConfigFromElement(
      this.container
    );
    this.coreConfig = core;
    this.cloningConfig = cloning;

    // Find all items marked for animation within this container
    const items = this.findMarqueeItems();

    if (items.length === 0) {
      console.warn(
        `Marquee container has no items with ${CONFIG.core.attributes.item} attribute:`,
        containerElement
      );
      return;
    }

    // Clone items to fill the container for seamless looping
    // This happens before styling to ensure clones get the same treatment
    this.handleAutoCloning(items, cloning);

    // Find all items again after cloning (includes both originals and clones)
    const allItems = this.findMarqueeItems();

    // Apply required CSS to prevent items from shrinking in flex layout
    this.applyRequiredStyles(allItems);

    // Build the timeline directly; helper manages its own refresh on resize
    this.buildTimeline();

    // Respect user's reduced motion preferences for accessibility (initial check)
    this.handleReducedMotion();

    // Store interaction settings from parsed configuration
    this.interactionSettings = interaction;

    // Attach interaction handlers if an effect is selected
    if (this.interactionSettings.effectType) {
      this.attachInteractionEventHandlers(this.interactionSettings);
    }

    // No external observers required; internal helper handles refresh
  }

  // Finds all child elements marked as marquee items
  findMarqueeItems() {
    return Array.from(
      this.container.querySelectorAll(`[${CONFIG.core.attributes.item}="true"]`)
    );
  }

  // Clones items multiple times to ensure the container is filled for seamless looping
  // Clones are appended in order after originals: [1,2,3,4,5] becomes [1,2,3,4,5,1,2,3,4,5,1,2,3,4,5]
  // This prevents gaps when there aren't enough items to create a continuous loop
  handleAutoCloning(originalItems, cloningConfig) {
    // Check if auto-cloning is disabled via attribute
    const autoCloneAttribute = this.container.getAttribute(
      CONFIG.cloning.attributes.autoClone
    );
    const autoCloneEnabled =
      autoCloneAttribute === null
        ? cloningConfig?.autoClone ?? CONFIG.cloning.defaults.autoClone
        : autoCloneAttribute !== 'false';
    if (!autoCloneEnabled) {
      return;
    }

    // Get number of times to clone (default is 3)
    const cloneCountAttribute = this.container.getAttribute(
      CONFIG.cloning.attributes.cloneCount
    );
    const cloneCount = cloneCountAttribute
      ? parseInt(cloneCountAttribute, 10)
      : cloningConfig?.cloneCount ?? CONFIG.cloning.defaults.cloneCount;

    if (isNaN(cloneCount) || cloneCount < 1) {
      return;
    }

    // Clone the entire set of items multiple times
    // This creates natural looping order: original items followed by clones in sequence
    for (let cloneSetIndex = 0; cloneSetIndex < cloneCount; cloneSetIndex++) {
      originalItems.forEach((originalItem) => {
        const clonedItem = originalItem.cloneNode(true);

        // Add aria-hidden for accessibility
        // Screen readers should only announce the original items, not the clones
        clonedItem.setAttribute('aria-hidden', 'true');

        // Append clone to the container
        // Clones are added in order after originals
        this.container.appendChild(clonedItem);
      });
    }
  }

  // Applies critical CSS to ensure items don't compress in flex layout
  // flexShrink: 0 prevents items from shrinking and breaking the animation
  applyRequiredStyles(items) {
    items.forEach((item) => {
      item.style.flexShrink = '0';
      item.style.willChange = 'transform';
    });
  }

  // Builds the GSAP timeline once; the helper will refresh itself on resize
  buildTimeline() {
    if (this.timeline) {
      if (typeof this.timeline.cleanup === 'function') {
        try {
          this.timeline.cleanup();
        } catch (e) {}
      }
      this.timeline.kill();
      this.timeline = null;
    }

    const allItems = this.findMarqueeItems();
    this.applyRequiredStyles(allItems);

    const isVertical = this.coreConfig.direction === 'vertical';
    const originalItems = Array.from(
      this.container.querySelectorAll(
        `[${CONFIG.core.attributes.item}="true"]:not([aria-hidden="true"])`
      )
    );
    const itemsForGap = originalItems.length > 1 ? originalItems : allItems;
    const medianGap = computeMedianGap(this.container, itemsForGap, isVertical);

    const loopConfig = {
      speed: this.coreConfig.speed,
      repeat: this.coreConfig.repeat,
      paused: this.coreConfig.paused,
      reversed: this.coreConfig.reversed,
      // Only apply explicit seam padding for horizontal; vertical computes spacing via geometry + refresh
      ...(isVertical ? {} : { paddingRight: medianGap }),
    };

    this.timeline = isVertical
      ? verticalLoop(allItems, loopConfig)
      : horizontalLoop(allItems, loopConfig);
  }

  // Rebuilds the GSAP timeline using current DOM measurements and preserves visual state
  rebuildTimeline(isInitialBuild = false) {
    // Capture previous playback state to restore after rebuild
    const previousTimeline = this.timeline;
    const wasPaused = previousTimeline
      ? previousTimeline.paused()
      : !this.coreConfig?.paused;
    const previousTime = previousTimeline ? previousTimeline.time() : 0;
    const previousScale = previousTimeline ? previousTimeline.timeScale() : 1;

    // Clean up the previous helper's internal listeners if provided
    if (
      previousTimeline &&
      typeof previousTimeline._cleanupResize === 'function'
    ) {
      try {
        previousTimeline._cleanupResize();
      } catch (e) {
        // Intentionally ignore cleanup errors
      }
    }
    if (previousTimeline) {
      previousTimeline.kill();
      this.timeline = null;
    }

    // Gather items and ensure required styles
    const allItems = this.findMarqueeItems();
    this.applyRequiredStyles(allItems);

    // Direction and seam gap measurement using only original (non-clone) items when available
    const isVertical = this.coreConfig.direction === 'vertical';
    const originalItems = Array.from(
      this.container.querySelectorAll(
        `[${CONFIG.core.attributes.item}="true"]:not([aria-hidden="true"])`
      )
    );
    const itemsForGap = originalItems.length > 1 ? originalItems : allItems;
    const medianGap = computeMedianGap(this.container, itemsForGap, isVertical);

    // Build loop configuration with explicit seam padding based on measured gap
    const loopConfig = {
      speed: this.coreConfig.speed,
      repeat: this.coreConfig.repeat,
      paused: this.coreConfig.paused,
      reversed: this.coreConfig.reversed,
      ...(isVertical
        ? { paddingBottom: medianGap }
        : { paddingRight: medianGap }),
    };

    // Create timeline
    this.timeline = isVertical
      ? verticalLoop(allItems, loopConfig)
      : horizontalLoop(allItems, loopConfig);

    // Restore visual frame and playback characteristics
    if (!isInitialBuild) {
      const newDuration = this.timeline.duration();
      const safeDuration = newDuration > 0 ? newDuration : 0;
      const wrappedTime = safeDuration
        ? ((previousTime % safeDuration) + safeDuration) % safeDuration
        : 0;
      this.timeline.time(wrappedTime, true);
      this.timeline.timeScale(previousScale);
      if (!wasPaused) {
        this.timeline.play();
      } else {
        this.timeline.pause();
      }
    }
  }

  // No external observers; helper handles its own refresh
  setupObservers() {}

  // (legacy pause-on-hover removed)

  // Checks if user has requested reduced motion and adjusts animation accordingly
  // This respects accessibility preferences for users who experience motion sickness
  handleReducedMotion() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      if (this.timeline) {
        // Slow down animation significantly rather than stopping completely
        // This maintains visual functionality while reducing motion intensity
        this.timeline.timeScale(0.1);
        this.baseTimeScale = 0.1;
      }
    } else {
      this.baseTimeScale = 1;
    }
  }

  // Reads interaction-related attributes and returns a normalized settings object
  // This function prefers clarity over brevity to keep the model easy for beginners to understand
  readInteractionSettingsFromAttributes() {
    // Start with defaults
    const settings = { ...DEFAULT_INTERACTION_SETTINGS };

    // Effect selection: "pause" | "slow"; if not provided, no interaction effect is active
    const effectAttr = this.container.getAttribute(
      CONFIG.interaction.attributes.effect
    );
    const effectType =
      effectAttr === 'pause' || effectAttr === 'slow' ? effectAttr : null;
    settings.effectType = effectType;

    // Trigger area: where interaction should apply (container vs items)
    const triggerAttr = this.container.getAttribute(
      CONFIG.interaction.attributes.effectTrigger
    );
    if (triggerAttr === 'container' || triggerAttr === 'items') {
      settings.triggerArea = triggerAttr;
    }

    // Ramp ratio: the intermediate hover speed fraction
    // For pause: used as an optional mid-ramp target before pausing
    // For slow: used as the sustained hover speed
    const rampAttr = this.container.getAttribute(
      CONFIG.interaction.attributes.rampRatio
    );
    if (rampAttr !== null) {
      const parsed = parseFloat(rampAttr);
      if (!isNaN(parsed) && parsed >= 0) {
        if (settings.effectType === 'pause') {
          settings.rampRatioWhileHoveringForPause = parsed;
        } else if (settings.effectType === 'slow') {
          settings.rampRatioWhileHoveringForSlow = parsed;
        } else {
          // If effect isn't chosen yet, prefer applying to slow default for predictability
          settings.rampRatioWhileHoveringForSlow = parsed;
        }
      }
    }

    // Pause effect total ramp duration until fully paused
    const pauseDurationAttr = this.container.getAttribute(
      CONFIG.interaction.attributes.pauseDuration
    );
    if (pauseDurationAttr !== null) {
      const parsed = parseFloat(pauseDurationAttr);
      if (!isNaN(parsed) && parsed >= 0) {
        settings.totalPauseRampDuration = parsed;
      }
    }

    // Slow effect ramp durations
    const slowInAttr = this.container.getAttribute(
      CONFIG.interaction.attributes.slowDurationIn
    );
    if (slowInAttr !== null) {
      const parsed = parseFloat(slowInAttr);
      if (!isNaN(parsed) && parsed >= 0) {
        settings.slowRampInDuration = parsed;
      }
    }
    const slowOutAttr = this.container.getAttribute(
      CONFIG.interaction.attributes.slowDurationOut
    );
    if (slowOutAttr !== null) {
      const parsed = parseFloat(slowOutAttr);
      if (!isNaN(parsed) && parsed >= 0) {
        settings.slowRampOutDuration = parsed;
      }
    }

    // Slow effect eases
    const easeInAttr = this.container.getAttribute(
      CONFIG.interaction.attributes.slowEaseIn
    );
    if (easeInAttr) {
      settings.slowRampInEase = easeInAttr;
    }
    const easeOutAttr = this.container.getAttribute(
      CONFIG.interaction.attributes.slowEaseOut
    );
    if (easeOutAttr) {
      settings.slowRampOutEase = easeOutAttr;
    }

    return settings;
  }

  // Returns +1 or -1 based on current timeline direction. Defaults to +1 if unknown.
  getPlaybackDirectionSign() {
    if (!this.timeline) return 1;
    const current = this.timeline.timeScale();
    return current < 0 ? -1 : 1;
  }

  // Tweens the timeline timeScale smoothly with overwrite protection
  smoothlyChangeSpeed(targetTimeScale, durationSeconds, easeName) {
    if (!this.timeline || !window.gsap) return;
    window.gsap.to(this.timeline, {
      timeScale: targetTimeScale,
      duration: Math.max(0, durationSeconds || 0),
      ease: easeName || 'power2.out',
      overwrite: 'auto',
    });
  }

  // Starts the pause effect: ramps down and pauses smoothly within the total duration.
  startPauseEffectWithSmoothRamp(settings) {
    if (!this.timeline) return;
    // Prevent re-triggering if already paused by effect
    if (this.wasPausedByEffect && this.timeline.paused()) return;

    const sign = this.getPlaybackDirectionSign();
    const base = Math.abs(this.baseTimeScale) || 1;
    const allowedMax = base; // never exceed baseline when reducing motion
    const midRatio = Math.max(
      0,
      Math.min(settings.rampRatioWhileHoveringForPause, allowedMax)
    );
    const total = Math.max(0, settings.totalPauseRampDuration);

    // If total is 0, pause instantly
    if (total === 0) {
      this.smoothlyChangeSpeed(0, 0, settings.slowRampInEase);
      this.timeline.pause();
      this.wasPausedByEffect = true;
      return;
    }

    // Build a compact ramp timeline instead of delayedCalls so that leaving mid-ramp can kill it cleanly
    // Two stages inside the total time: optional midRatio phase, then to 0
    const stage1 = midRatio > 0 ? Math.max(0, total * 0.6) : 0;
    const stage2 = Math.max(0, total - stage1);

    // Kill any existing ramp timeline to avoid stacking
    if (this.pauseRampTimeline) {
      this.pauseRampTimeline.kill();
      this.pauseRampTimeline = null;
    }

    if (window.gsap) {
      const rampTl = window.gsap.timeline();
      if (stage1 > 0) {
        rampTl.to(this.timeline, {
          timeScale: sign * midRatio,
          duration: stage1,
          ease: settings.slowRampInEase,
          overwrite: 'auto',
        });
      }
      rampTl.to(this.timeline, {
        timeScale: 0,
        duration: stage2,
        ease: settings.slowRampOutEase || settings.slowRampInEase,
        overwrite: 'auto',
      });
      rampTl.eventCallback('onComplete', () => {
        if (this.isHovering && this.timeline) {
          this.timeline.pause();
          this.wasPausedByEffect = true;
        }
        this.pauseRampTimeline = null;
      });
      this.pauseRampTimeline = rampTl;
    }
  }

  // Ends the pause effect: resumes playback and returns to baseline magnitude smoothly
  endPauseEffectResumeSmoothly(settings) {
    if (!this.timeline) return;
    // Ensure no late pause occurs by killing any in-flight ramp timeline
    if (this.pauseRampTimeline) {
      this.pauseRampTimeline.kill();
      this.pauseRampTimeline = null;
    }
    if (this.wasPausedByEffect && this.timeline.paused()) {
      this.timeline.play();
    }
    this.wasPausedByEffect = false;

    const sign = this.getPlaybackDirectionSign();
    const base = Math.abs(this.baseTimeScale) || 1;
    this.smoothlyChangeSpeed(
      sign * base,
      settings.slowRampOutDuration,
      settings.slowRampOutEase
    );
  }

  // Starts the slow effect: ramps to a sustained slower speed
  startSlowEffectSmoothly(settings) {
    if (!this.timeline) return;
    const sign = this.getPlaybackDirectionSign();
    const base = Math.abs(this.baseTimeScale) || 1;
    const allowedMax = base; // do not go faster than baseline
    const target = Math.max(
      0,
      Math.min(settings.rampRatioWhileHoveringForSlow, allowedMax)
    );
    this.smoothlyChangeSpeed(
      sign * target,
      settings.slowRampInDuration,
      settings.slowRampInEase
    );
  }

  // Ends the slow effect: ramps back to baseline speed
  endSlowEffectSmoothly(settings) {
    if (!this.timeline) return;
    const sign = this.getPlaybackDirectionSign();
    const base = Math.abs(this.baseTimeScale) || 1;
    this.smoothlyChangeSpeed(
      sign * base,
      settings.slowRampOutDuration,
      settings.slowRampOutEase
    );
  }

  // Attaches event listeners according to the selected effect and trigger area
  attachInteractionEventHandlers(settings) {
    const onEnter = () => {
      this.isHovering = true;
      if (settings.effectType === 'pause') {
        this.startPauseEffectWithSmoothRamp(settings);
      } else if (settings.effectType === 'slow') {
        this.startSlowEffectSmoothly(settings);
      }
    };

    const onLeave = () => {
      this.isHovering = false;
      if (settings.effectType === 'pause') {
        this.endPauseEffectResumeSmoothly(settings);
      } else if (settings.effectType === 'slow') {
        this.endSlowEffectSmoothly(settings);
      }
    };

    if (settings.triggerArea === 'items') {
      const items = this.findMarqueeItems();
      items.forEach((el) => {
        el.addEventListener('mouseenter', onEnter);
        el.addEventListener('mouseleave', onLeave);
        this.eventListeners.push({
          type: 'mouseenter',
          handler: onEnter,
          target: el,
        });
        this.eventListeners.push({
          type: 'mouseleave',
          handler: onLeave,
          target: el,
        });
      });
    } else {
      // container (default)
      this.container.addEventListener('mouseenter', onEnter);
      this.container.addEventListener('mouseleave', onLeave);
      this.eventListeners.push({
        type: 'mouseenter',
        handler: onEnter,
        target: this.container,
      });
      this.eventListeners.push({
        type: 'mouseleave',
        handler: onLeave,
        target: this.container,
      });
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

  // Cleans up timeline and event listeners to prevent memory leaks
  destroy() {
    if (this.timeline) {
      if (typeof this.timeline.cleanup === 'function') {
        try {
          this.timeline.cleanup();
        } catch (e) {
          // ignore cleanup errors
        }
      }
      this.timeline.kill();
      this.timeline = null;
    }

    // Remove all event listeners that were added
    this.eventListeners.forEach(({ type, handler }) => {
      this.container.removeEventListener(type, handler);
    });
    this.eventListeners = [];

    // No external observers to disconnect
  }
}

// Finds and initializes all marquees on the page
function initMarquees() {
  // Query all elements with data-marquee attribute (matches both "true" and "vertical")
  const containers = document.querySelectorAll('[data-marquee]');

  containers.forEach((container) => {
    // Skip if this container already has an instance
    if (instances.has(container)) {
      return;
    }

    // Create new instance and store it
    const instance = new MarqueeInstance(container);
    instances.set(container, instance);
  });
}

// Retrieves the marquee instance for a given element
// Useful for manual control via JavaScript
function getMarquee(element) {
  return instances.get(element);
}

// Auto-initialize marquees when DOM is ready
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMarquees);
  } else {
    // DOM is already loaded, initialize immediately
    initMarquees();
  }
}

// Expose public API on window object for easy access
window.Marquee = {
  init: initMarquees,
  get: getMarquee,
};
