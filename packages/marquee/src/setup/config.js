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
      repeat: 'data-marquee-repeat',
    },
    defaults: {
      // Default speed multiplier used by loop helpers
      speed: 0.6,
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
      cloneCount: 'data-marquee-clones',
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
      rampRatio: 'data-marquee-hover-speed',
      pauseDuration: 'data-marquee-hover-duration',
      slowDurationIn: 'data-marquee-hover-in',
      slowDurationOut: 'data-marquee-hover-out',
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

  observers: {
    attributes: {
      intersection: 'data-marquee-intersection',
    },
    defaults: {
      // Enable intersection observer by default for performance
      intersection: true,
      // Trigger when 10% of the marquee is visible
      threshold: 0.1,
      // No margin adjustment by default
      rootMargin: '0px',
    },
  },

  internalFlags: {
    attributes: {
      // Flag to track if reverse warning has been shown
      reverseWarned: 'data-marquee-reverse-warned',
      // Flag to track if CSS styles have been validated
      stylesValidated: 'data-marquee-styles-validated',
      // Flag to mark cloned items
      clone: 'data-marquee-clone',
    },
  },
};
