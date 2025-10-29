// Parsing helpers for marquee configuration based on data-* attributes.
// These functions convert string attributes into normalized config objects.

import { CONFIG } from './config.js';

// Parses a boolean attribute where presence implies true unless explicitly set to "false".
function parseBooleanAttribute(element, attributeName) {
  // Purpose: Interpret boolean-like attributes in a predictable way.
  if (!element.hasAttribute(attributeName)) return false;
  const raw = element.getAttribute(attributeName);
  if (raw === null) return true;
  const normalized = String(raw).trim().toLowerCase();
  if (normalized === 'false' || normalized === '0' || normalized === 'no') {
    return false;
  }
  return true;
}

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
function parseIntAttribute(element, attributeName, fallback, min) {
  // Purpose: Read integer-like attributes (counts, repeats) safely.
  const raw = element.getAttribute(attributeName);
  if (raw === null) return fallback;
  const value = parseInt(raw, 10);
  if (Number.isNaN(value)) return fallback;
  if (typeof min === 'number' && value < min) return min;
  return value;
}

// Reads direction from computed flex-direction CSS property
// Defaults to horizontal when flex-direction is 'row' or unspecified
function parseDirection(element) {
  const computedStyle = window.getComputedStyle(element);
  const flexDirection = computedStyle.flexDirection;

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
    repeat: defaults.repeat,
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
  return {
    autoClone,
    cloneCount: parseIntAttribute(
      element,
      attributes.cloneCount,
      defaults.cloneCount,
      1
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
