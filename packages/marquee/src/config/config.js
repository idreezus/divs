// Centralized configuration for marquee features (attribute names and defaults)
// The goal is to keep strings and default values in one place so other files
// reference this module instead of hardcoding values across the codebase.

export const CONFIG = {
  core: {
    attributes: {
      container: 'data-marquee',
      direction: 'data-marquee-direction',
      item: 'data-marquee-item',
      speed: 'data-marquee-speed',
      reverse: 'data-marquee-reverse',
    },
    defaults: {
      // Default speed multiplier used by loop helpers
      speed: 0.7,
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
      cloneCount: 2,
    },
  },

  interaction: {
    attributes: {
      effect: 'data-marquee-hover-effect',
      effectTrigger: 'data-marquee-hover-trigger',
      rampRatio: 'data-marquee-hover-speed-ratio',
      pauseDuration: 'data-marquee-hover-pause-duration',
      slowDurationIn: 'data-marquee-hover-duration-in',
      slowDurationOut: 'data-marquee-hover-duration-out',
      slowEaseIn: 'data-marquee-hover-ease-in',
      slowEaseOut: 'data-marquee-hover-ease-out',
    },
    defaults: {
      effectType: null,
      triggerArea: 'container',
      rampRatioWhileHoveringForPause: 0.1,
      rampRatioWhileHoveringForSlow: 0.3,
      totalPauseRampDuration: 0.4,
      slowRampInDuration: 0.7,
      slowRampOutDuration: 0.25,
      slowRampInEase: 'power1.out',
      slowRampOutEase: 'power1.out',
    },
  },
};
