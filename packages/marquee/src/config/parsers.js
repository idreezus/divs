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

// Parses direction from CSS flex-direction property
function parseDirectionFromCSS(element) {
  // Purpose: Read flex-direction from computed styles and map to marquee direction.
  const computedStyle = window.getComputedStyle(element);
  const flexDirection = computedStyle.flexDirection;
  const justifyContent = computedStyle.justifyContent;

  // Map flex-direction to marquee direction
  const isVertical = flexDirection === 'column' || flexDirection === 'column-reverse';
  const direction = isVertical ? 'vertical' : 'horizontal';

  // Detect auto-reverse from CSS
  const isReversed = flexDirection === 'row-reverse' || flexDirection === 'column-reverse';

  // Import DEBUG from marquee.js is not available here, so we'll log directly
  // This will be improved when we refactor to pass DEBUG context
  if (typeof console !== 'undefined') {
    console.log(
      `[Marquee CSS Read]`,
      `\n  Container:`, element,
      `\n  flex-direction: ${flexDirection}`,
      `\n  justify-content: ${justifyContent}`,
      `\n  → Computed direction: ${direction}`,
      `\n  → Auto-reversed: ${isReversed}`
    );
  }

  return { direction, isReversed };
}

// Parses the direction based on CSS (primary) or attribute (fallback).
function parseDirection(element) {
  // Purpose: Normalize direction to 'horizontal' or 'vertical'.
  // Primary: Read from CSS flex-direction
  // Fallback: Read from data-marquee-direction attribute

  const cssResult = parseDirectionFromCSS(element);
  return cssResult.direction;
}

// Parses whether animation should be reversed
function parseReversed(element) {
  // Purpose: Determine if animation should play in reverse.
  // Primary: Auto-detect from CSS flex-direction reverse variants
  // Override: Explicit data-marquee-reverse attribute

  const cssResult = parseDirectionFromCSS(element);
  const explicitReverse = element.getAttribute(CONFIG.core.attributes.reverse);

  // If explicit attribute is set, it takes precedence
  if (explicitReverse !== null) {
    return explicitReverse === 'true';
  }

  // Otherwise use CSS auto-detection
  return cssResult.isReversed;
}

// Builds core loop configuration from attributes.
export function parseCoreConfig(element) {
  // Purpose: Produce base loop settings such as speed, repeat, reversed.
  const { attributes, defaults } = CONFIG.core;
  return {
    direction: parseDirection(element),
    speed: parseFloatAttribute(element, attributes.speed, defaults.speed, 0),
    // Repeat is intentionally fixed to infinite for simplicity of public API
    repeat: defaults.repeat,
    paused: defaults.paused,
    // Reverse uses CSS auto-detection (flex-direction reverse variants) or explicit attribute
    reversed: parseReversed(element),
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

// Builds a single normalized object grouping core, cloning, and interaction.
export function buildConfigFromElement(element) {
  // Purpose: Gather all namespaces in one pass for the calling site.
  const core = parseCoreConfig(element);
  const cloning = parseCloningConfig(element);
  const interaction = parseInteractionConfig(element);
  return { core, cloning, interaction };
}

// Export CSS parsing function for use in change detection
export { parseDirectionFromCSS };
