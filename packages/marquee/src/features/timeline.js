import { horizontalLoop, verticalLoop } from '../utils/seamlessLoop.js';
import { computeMedianGap } from './spacing.js';
import { CONFIG } from '../setup/config.js';

// Creates a new GSAP timeline for the marquee animation
export function buildTimeline(instance) {
  try {
    cleanupPreviousTimeline(instance);

    const allItems = instance.findMarqueeItems();

    if (allItems.length === 0) {
      console.warn('Marquee: No items to animate');
      return;
    }

    const isVertical = instance.coreConfig.direction === 'vertical';

    applyStyles(allItems);
    resetTransforms(allItems);

    const originalItems = Array.from(
      instance.container.querySelectorAll(
        `[${CONFIG.core.attributes.item}="true"]:not([aria-hidden="true"])`
      )
    );

    const itemsForGap = originalItems.length > 1 ? originalItems : allItems;
    const medianGap = computeMedianGap(instance.container, itemsForGap, isVertical);

    const loopConfig = {
      speed: instance.coreConfig.speed,
      repeat: instance.coreConfig.repeat,
      paused: instance.coreConfig.paused,
      reversed: instance.coreConfig.reversed,
      ...(isVertical ? { paddingBottom: medianGap } : { paddingRight: medianGap }),
      onDirectionChange: () => {
        if (instance.checkDirectionChange()) {
          instance.refreshDirection();
        }
      },
    };

    instance.timeline = isVertical
      ? verticalLoop(allItems, loopConfig)
      : horizontalLoop(allItems, loopConfig);
  } catch (error) {
    console.error('Marquee: Failed to build timeline', error);
  }
}

// Rebuilds the timeline while optionally preserving playback position and state
export function rebuildTimeline(instance, preserveState = true) {
  const previousTimeline = instance.timeline;
  const wasPaused = previousTimeline ? previousTimeline.paused() : !instance.coreConfig?.paused;
  const previousTime = previousTimeline ? previousTimeline.time() : 0;
  const previousScale = previousTimeline ? previousTimeline.timeScale() : 1;

  cleanupPreviousTimeline(instance);

  const allItems = instance.findMarqueeItems();
  applyStyles(allItems);
  resetTransforms(allItems);

  const isVertical = instance.coreConfig.direction === 'vertical';
  const originalItems = Array.from(
    instance.container.querySelectorAll(
      `[${CONFIG.core.attributes.item}="true"]:not([aria-hidden="true"])`
    )
  );

  const itemsForGap = originalItems.length > 1 ? originalItems : allItems;
  const medianGap = computeMedianGap(instance.container, itemsForGap, isVertical);

  const loopConfig = {
    speed: instance.coreConfig.speed,
    repeat: instance.coreConfig.repeat,
    paused: instance.coreConfig.paused,
    reversed: instance.coreConfig.reversed,
    ...(isVertical ? { paddingBottom: medianGap } : { paddingRight: medianGap }),
    onDirectionChange: () => {
      if (instance.checkDirectionChange()) {
        instance.refreshDirection();
      }
    },
  };

  instance.timeline = isVertical
    ? verticalLoop(allItems, loopConfig)
    : horizontalLoop(allItems, loopConfig);

  if (preserveState) {
    const newDuration = instance.timeline.duration();
    const safeDuration = newDuration > 0 ? newDuration : 0;
    const wrappedTime = safeDuration
      ? ((previousTime % safeDuration) + safeDuration) % safeDuration
      : 0;

    instance.timeline.time(wrappedTime, true);
    instance.timeline.timeScale(previousScale);

    if (!wasPaused) {
      instance.timeline.play();
    } else {
      instance.timeline.pause();
    }
  }
}

// Kills and removes the previous timeline if it exists
function cleanupPreviousTimeline(instance) {
  if (instance.timeline) {
    if (typeof instance.timeline.cleanup === 'function') {
      try {
        instance.timeline.cleanup();
      // eslint-disable-next-line no-unused-vars
      } catch (_e) {}
    }
    instance.timeline.kill();
    instance.timeline = null;
  }
}

// Applies performance and layout styles to marquee items
function applyStyles(items) {
  items.forEach((item) => {
    item.style.flexShrink = '0';
    item.style.willChange = 'transform';
  });
}

// Resets all GSAP transform properties to prevent accumulation between rebuilds
function resetTransforms(items) {
  if (window.gsap) {
    window.gsap.set(items, {
      x: 0,
      y: 0,
      xPercent: 0,
      yPercent: 0,
    });
  }
}
