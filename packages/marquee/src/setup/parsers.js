// Parsing helpers for marquee configuration based on data-* attributes.
// These functions convert string attributes into normalized config objects.

import { CONFIG } from './config.js';


// Parses a float attribute with a fallback default and optional clamp.
function parseFloatAttribute(element, attributeName, fallback, min) {
  // Purpose: Read numeric attributes safely for durations and ratios.
  const raw = element.getAttribute(attributeName);
  if (raw === null) return fallback;
  const value = parseFloat(raw);
  if (Number.isNaN(value)) return fallback;
  if (typeof min === 'number' && value < min) return min;
  return value;
}

// Parses an integer attribute with a fallback default and optional clamp.
function parseIntAttribute(element, attributeName, fallback, min, max) {
  // Purpose: Read integer-like attributes (counts, repeats) safely.
  const raw = element.getAttribute(attributeName);
  if (raw === null) return fallback;
  const value = parseInt(raw, 10);
  if (Number.isNaN(value)) return fallback;
  if (typeof min === 'number' && value < min) return min;
  if (typeof max === 'number' && value > max) return max;
  return value;
}

// Reads direction from computed flex-direction CSS property
// Defaults to horizontal when flex-direction is 'row' or unspecified
function parseDirection(element) {
  const computedStyle = window.getComputedStyle(element);
  const flexDirection = computedStyle.flexDirection;

  // Warn about reverse directions - should use data-marquee-reverse instead
  if (flexDirection === 'row-reverse' || flexDirection === 'column-reverse') {
    if (!element.hasAttribute(CONFIG.core.attributes.reverseWarned)) {
      console.warn(
        'Marquee: Detected flex-direction "' + flexDirection + '". For reverse animation, use ' + CONFIG.core.attributes.reverse + '="true" instead of CSS reverse directions.',
        element
      );
      element.setAttribute(CONFIG.core.attributes.reverseWarned, 'true');
    }
  }

  const isVertical = flexDirection === 'column' || flexDirection === 'column-reverse';
  return isVertical ? 'vertical' : 'horizontal';
}

// Builds core loop configuration from attributes
export function parseCoreConfig(element) {
  const { attributes, defaults } = CONFIG.core;
  const reverseAttr = element.getAttribute(attributes.reverse);

  return {
    direction: parseDirection(element),
    speed: parseFloatAttribute(element, attributes.speed, defaults.speed, 0),
    repeat: parseIntAttribute(element, attributes.repeat, defaults.repeat),
    paused: defaults.paused,
    reversed: reverseAttr === 'true',
  };
}

// Builds cloning configuration from attributes.
export function parseCloningConfig(element) {
  // Purpose: Control auto-clone behavior and clone count.
  const { attributes, defaults } = CONFIG.cloning;
  const autoCloneRaw = element.getAttribute(attributes.autoClone);
  const autoClone =
    autoCloneRaw === null ? defaults.autoClone : autoCloneRaw !== 'false';

  const rawCloneCount = element.getAttribute(attributes.cloneCount);
  const requestedCount = rawCloneCount ? parseInt(rawCloneCount, 10) : null;

  // Warn if user tries to exceed maximum
  if (requestedCount !== null && !isNaN(requestedCount) && requestedCount > 10) {
    console.warn(
      'Marquee: Clone count capped at 10 for performance. Requested:',
      requestedCount,
      '→ Using: 10. To improve performance with many items, reduce data-marquee-clones.',
      element
    );
  }

  return {
    autoClone,
    cloneCount: parseIntAttribute(
      element,
      attributes.cloneCount,
      defaults.cloneCount,
      1,
      10
    ),
  };
}

// Builds interaction configuration from attributes.
export function parseInteractionConfig(element) {
  // Purpose: Normalize hover effects (pause/slow) and ramp parameters.
  const { attributes, defaults } = CONFIG.interaction;
  const effectRaw = element.getAttribute(attributes.effect);
  const effectType =
    effectRaw === 'pause' || effectRaw === 'slow' ? effectRaw : null;

  const triggerRaw = element.getAttribute(attributes.effectTrigger);
  const triggerArea =
    triggerRaw === 'items' || triggerRaw === 'container'
      ? triggerRaw
      : defaults.triggerArea;

  const rampRatio = element.getAttribute(attributes.rampRatio);
  const rampRatioValue =
    rampRatio === null ? null : Math.max(0, parseFloat(rampRatio));

  const result = {
    effectType,
    triggerArea,
    rampRatioWhileHoveringForPause: defaults.rampRatioWhileHoveringForPause,
    rampRatioWhileHoveringForSlow: defaults.rampRatioWhileHoveringForSlow,
    totalPauseRampDuration: parseFloatAttribute(
      element,
      attributes.pauseDuration,
      defaults.totalPauseRampDuration,
      0
    ),
    slowRampInDuration: parseFloatAttribute(
      element,
      attributes.slowDurationIn,
      defaults.slowRampInDuration,
      0
    ),
    slowRampOutDuration: parseFloatAttribute(
      element,
      attributes.slowDurationOut,
      defaults.slowRampOutDuration,
      0
    ),
    slowRampInEase:
      element.getAttribute(attributes.slowEaseIn) || defaults.slowRampInEase,
    slowRampOutEase:
      element.getAttribute(attributes.slowEaseOut) || defaults.slowRampOutEase,
  };

  // Apply rampRatio override based on effect
  if (rampRatioValue !== null && !Number.isNaN(rampRatioValue)) {
    if (result.effectType === 'pause') {
      result.rampRatioWhileHoveringForPause = rampRatioValue;
    } else {
      result.rampRatioWhileHoveringForSlow = rampRatioValue;
    }
  }

  return result;
}

// Builds observer configuration from attributes.
export function parseObserverConfig(element) {
  // Purpose: Control intersection observer behavior.
  const { attributes, defaults } = CONFIG.observers;
  const intersectionRaw = element.getAttribute(attributes.intersection);
  const intersection =
    intersectionRaw === null ? defaults.intersection : intersectionRaw !== 'false';

  return {
    intersection,
    threshold: defaults.threshold,
    rootMargin: defaults.rootMargin,
  };
}
