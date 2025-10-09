// Centralized configuration for marquee features (attribute names and defaults)
// The goal is to keep strings and default values in one place so other files
// reference this module instead of hardcoding values across the codebase.

export const CONFIG = {
  core: {
    attributes: {
      direction: 'data-marquee',
      item: 'data-marquee-item',
      speed: 'data-marquee-speed',
      repeat: 'data-marquee-repeat',
      reverse: 'data-marquee-reverse',
    },
    defaults: {
      // Default speed multiplier (1 ≈ 100 pixels/second in helpers)
      speed: 1,
      // Default to infinite repeat
      repeat: -1,
      // Start playing by default
      paused: false,
      // Not reversed by default
      reversed: false,
    },
  },

  cloning: {
    attributes: {
      autoClone: 'data-marquee-auto-clone',
      cloneCount: 'data-marquee-clone-count',
    },
    defaults: {
      // Auto-clone enabled by default for seamless looping
      autoClone: true,
      // Number of clone sets to append by default
      cloneCount: 3,
    },
  },

  interaction: {
    attributes: {
      effect: 'data-marquee-effect',
      effectTrigger: 'data-marquee-effect-trigger',
      rampRatio: 'data-marquee-ramp-ratio',
      pauseDuration: 'data-marquee-pause-duration',
      slowDurationIn: 'data-marquee-slow-duration-in',
      slowDurationOut: 'data-marquee-slow-duration-out',
      slowEaseIn: 'data-marquee-slow-ease-in',
      slowEaseOut: 'data-marquee-slow-ease-out',
    },
    defaults: {
      // No effect by default; valid values: "pause" | "slow" | null
      effectType: null,
      // Apply hover to container by default; valid: "container" | "items"
      triggerArea: 'container',
      // Fractional target speeds and durations for ramps
      rampRatioWhileHoveringForPause: 0.1,
      rampRatioWhileHoveringForSlow: 0.25,
      totalPauseRampDuration: 0.4,
      slowRampInDuration: 0.4,
      slowRampOutDuration: 0.3,
      slowRampInEase: 'power2.out',
      slowRampOutEase: 'power2.inOut',
    },
  },
};
