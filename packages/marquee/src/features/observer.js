// IntersectionObserver feature for controlling marquee playback based on visibility.
// Only plays the marquee when it's in the viewport to improve performance.

/**
 * Sets up IntersectionObserver to control marquee playback based on visibility.
 * @param {MarqueeInstance} instance - The marquee instance to observe
 * @param {Object} config - Observer configuration with threshold and rootMargin
 */
export function setupIntersectionObserver(instance, config) {
  // Check for IntersectionObserver support
  if (!('IntersectionObserver' in window)) {
    console.warn(
      'Marquee: IntersectionObserver not supported in this browser. Marquee will start immediately.',
      instance.container
    );
    // Fallback: play immediately if browser doesn't support IntersectionObserver
    if (instance.timeline && instance.timeline.paused()) {
      instance.timeline.play();
    }
    return;
  }

  const options = {
    threshold: config.threshold,
    rootMargin: config.rootMargin,
  };

  /**
   * Handles intersection changes for the marquee container.
   * Plays when entering viewport, pauses when leaving.
   * @param {IntersectionObserverEntry[]} entries - Array of intersection entries
   */
  const handleIntersection = (entries) => {
    entries.forEach((entry) => {
      // Only handle entries for this specific container
      if (entry.target !== instance.container) return;

      if (!instance.timeline) return;

      if (entry.isIntersecting) {
        // Entering viewport - play if currently paused
        if (instance.timeline.paused()) {
          instance.timeline.play();
        }
      } else {
        // Leaving viewport - pause if currently playing
        if (!instance.timeline.paused()) {
          instance.timeline.pause();
        }
      }
    });
  };

  // Create and attach the observer
  instance.intersectionObserver = new IntersectionObserver(
    handleIntersection,
    options
  );
  instance.intersectionObserver.observe(instance.container);
}
