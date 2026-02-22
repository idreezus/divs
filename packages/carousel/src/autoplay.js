// Autoplay behavior for carousel: timer, progress updates, pause/resume

import { CLASSES, CSS_VARS, EVENTS } from './config.js';
import { emit } from './utils.js';

// RAF tick loop for autoplay progress
function runAutoplayTick(instance) {
  const { state, config, autoplay } = instance;

  if (!state.isAutoplaying || state.isPaused) return;

  const elapsed = performance.now() - state.autoplayStartTime;
  const progress = Math.min(elapsed / config.autoplayDuration, 1);

  // Update progress on container
  instance.container.style.setProperty(CSS_VARS.AUTOPLAY_PROGRESS, progress.toString());

  // Update progress on active marker, reset inactive markers
  if (instance.markers?.length > 0) {
    instance.markers.forEach((marker, index) => {
      if (index === state.currentIndex) {
        marker.style.setProperty(CSS_VARS.AUTOPLAY_PROGRESS, progress.toString());
      } else {
        marker.style.setProperty(CSS_VARS.AUTOPLAY_PROGRESS, '0');
      }
    });
  }

  if (progress >= 1) {
    const atEnd = state.currentIndex >= state.maxReachableIndex && !instance.config.loop;
    if (atEnd) {
      stopAutoplay(instance, 'complete');
      autoplay.onStop?.();
      return;
    }
    autoplay.advanceFn(instance);
    state.autoplayStartTime = performance.now();
  }

  autoplay.rafId = requestAnimationFrame(() => runAutoplayTick(instance));
}

// Checks if autoplay can resume from a temporary pause
function canResume(instance) {
  const { autoplay, state } = instance;
  return (
    state.isAutoplaying &&
    autoplay.isVisible &&
    !autoplay.pausedByHover &&
    !autoplay.pausedByFocus
  );
}

// Sets up autoplay with IntersectionObserver and pause handlers
export function setupAutoplay(instance, advanceFn) {
  const { container, config } = instance;

  instance.autoplay = {
    rafId: null,
    observer: null,
    advanceFn,
    isVisible: true,
    pausedByHover: false,
    pausedByFocus: false,
  };

  // Initialize autoplay state fields on the instance
  Object.assign(instance.state, {
    isAutoplaying: false,
    isPaused: false,
    autoplayStartTime: null,
    autoplayElapsed: 0,
    autoplayPausedOnIndex: null,
  });

  // IntersectionObserver to pause when out of viewport
  instance.autoplay.observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        instance.autoplay.isVisible = entry.isIntersecting;
        if (!entry.isIntersecting) {
          pauseAutoplay(instance, 'visibility');
        } else if (canResume(instance)) {
          resumeAutoplay(instance);
        }
      });
    },
    { threshold: 0.5 }
  );
  instance.autoplay.observer.observe(container);

  // Hover pause handlers (target the track, not container)
  if (config.autoplayPauseHover) {
    instance.autoplay.handleMouseEnter = () => {
      instance.autoplay.pausedByHover = true;
      pauseAutoplay(instance, 'hover');
    };
    instance.autoplay.handleMouseLeave = () => {
      instance.autoplay.pausedByHover = false;
      if (canResume(instance)) {
        resumeAutoplay(instance);
      }
    };
    instance.track.addEventListener('mouseenter', instance.autoplay.handleMouseEnter);
    instance.track.addEventListener('mouseleave', instance.autoplay.handleMouseLeave);
  }

  // Focus pause handlers (target the track, not container)
  if (config.autoplayPauseFocus) {
    instance.autoplay.handleFocusIn = () => {
      instance.autoplay.pausedByFocus = true;
      pauseAutoplay(instance, 'focus');
    };
    instance.autoplay.handleFocusOut = (e) => {
      // Only resume if focus leaves the track entirely
      if (!instance.track.contains(e.relatedTarget)) {
        instance.autoplay.pausedByFocus = false;
        if (canResume(instance)) {
          resumeAutoplay(instance);
        }
      }
    };
    instance.track.addEventListener('focusin', instance.autoplay.handleFocusIn);
    instance.track.addEventListener('focusout', instance.autoplay.handleFocusOut);
  }
}

// Starts autoplay timer with RAF progress updates
export function startAutoplay(instance) {
  const { container, state } = instance;

  // Nothing to cycle through — skip autoplay entirely
  if (state.totalPositions <= 1) return;

  state.isAutoplaying = true;
  state.isPaused = false;
  state.autoplayStartTime = performance.now();

  container.classList.add(CLASSES.PLAYING);

  // Update play/pause button
  if (instance.playPauseBtn) {
    instance.playPauseBtn.setAttribute('aria-label', 'Stop autoplay');
  }

  // Suppress live region announcements during autoplay
  if (instance.liveRegion) {
    instance.liveRegion.setAttribute('aria-live', 'off');
  }

  emit(instance, EVENTS.AUTOPLAY_START, { index: state.currentIndex });

  instance.autoplay.rafId = requestAnimationFrame(() =>
    runAutoplayTick(instance)
  );
}

// Temporarily pauses autoplay (for hover, focus, visibility)
export function pauseAutoplay(instance, reason = 'user') {
  const { state, container } = instance;

  if (!state.isAutoplaying || state.isPaused) return;

  state.isPaused = true;

  // Store elapsed time and active index so we can resume from this point
  const elapsed = performance.now() - state.autoplayStartTime;
  const progress = Math.min(elapsed / instance.config.autoplayDuration, 1);
  state.autoplayElapsed = elapsed;
  state.autoplayPausedOnIndex = state.currentIndex;

  // Cancel RAF
  if (instance.autoplay.rafId) {
    cancelAnimationFrame(instance.autoplay.rafId);
    instance.autoplay.rafId = null;
  }

  container.classList.remove(CLASSES.PLAYING);

  // Update play/pause button
  if (instance.playPauseBtn) {
    instance.playPauseBtn.setAttribute('aria-label', 'Start autoplay');
  }

  // Re-enable live region announcements
  if (instance.liveRegion) {
    instance.liveRegion.setAttribute('aria-live', 'polite');
  }

  emit(instance, EVENTS.AUTOPLAY_STOP, {
    index: state.currentIndex,
    progress,
    reason,
  });
}

// Resumes autoplay from where it was paused
export function resumeAutoplay(instance) {
  const { state, container } = instance;

  if (!state.isAutoplaying || !state.isPaused) return;
  if (!canResume(instance)) return;

  state.isPaused = false;
  // Resume from stored elapsed time only if still on the same item, otherwise reset
  const sameItem = state.autoplayPausedOnIndex === state.currentIndex;
  state.autoplayStartTime = sameItem
    ? performance.now() - (state.autoplayElapsed || 0)
    : performance.now();

  container.classList.add(CLASSES.PLAYING);

  // Update play/pause button
  if (instance.playPauseBtn) {
    instance.playPauseBtn.setAttribute('aria-label', 'Stop autoplay');
  }

  // Suppress live region announcements during autoplay
  if (instance.liveRegion) {
    instance.liveRegion.setAttribute('aria-live', 'off');
  }

  emit(instance, EVENTS.AUTOPLAY_START, { index: state.currentIndex });

  instance.autoplay.rafId = requestAnimationFrame(() =>
    runAutoplayTick(instance)
  );
}

// Stops autoplay completely
export function stopAutoplay(instance, reason = 'user') {
  const { state, container } = instance;

  if (!state.isAutoplaying) return;

  // Compute progress before resetting
  const elapsed = performance.now() - state.autoplayStartTime;
  const progress = Math.min(elapsed / instance.config.autoplayDuration, 1);

  state.isAutoplaying = false;
  state.isPaused = false;

  if (instance.autoplay?.rafId) {
    cancelAnimationFrame(instance.autoplay.rafId);
    instance.autoplay.rafId = null;
  }

  container.classList.remove(CLASSES.PLAYING);

  // Update play/pause button
  if (instance.playPauseBtn) {
    instance.playPauseBtn.setAttribute('aria-label', 'Start autoplay');
  }

  // Re-enable live region announcements
  if (instance.liveRegion) {
    instance.liveRegion.setAttribute('aria-live', 'polite');
  }

  emit(instance, EVENTS.AUTOPLAY_STOP, {
    index: state.currentIndex,
    progress,
    reason,
  });

  // Reset progress on container
  container.style.setProperty(CSS_VARS.AUTOPLAY_PROGRESS, '0');

  // Reset progress on all markers
  if (instance.markers?.length > 0) {
    instance.markers.forEach((marker) => {
      marker.style.setProperty(CSS_VARS.AUTOPLAY_PROGRESS, '0');
    });
  }
}

// Cleans up autoplay listeners and observer
export function cleanupAutoplay(instance) {
  const { config, autoplay } = instance;

  if (!autoplay) return;

  // Cancel RAF
  if (autoplay.rafId) {
    cancelAnimationFrame(autoplay.rafId);
  }

  // Disconnect IntersectionObserver
  if (autoplay.observer) {
    autoplay.observer.disconnect();
  }

  // Remove hover listeners from track
  if (config.autoplayPauseHover && autoplay.handleMouseEnter) {
    instance.track.removeEventListener('mouseenter', autoplay.handleMouseEnter);
    instance.track.removeEventListener('mouseleave', autoplay.handleMouseLeave);
  }

  // Remove focus listeners from track
  if (config.autoplayPauseFocus && autoplay.handleFocusIn) {
    instance.track.removeEventListener('focusin', autoplay.handleFocusIn);
    instance.track.removeEventListener('focusout', autoplay.handleFocusOut);
  }

  instance.autoplay = null;
}
