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

  // Update progress on active dot, reset inactive dots
  if (instance.dots?.length > 0) {
    instance.dots.forEach((dot, index) => {
      if (index === state.currentIndex) {
        dot.style.setProperty(CSS_VARS.AUTOPLAY_PROGRESS, progress.toString());
      } else {
        dot.style.setProperty(CSS_VARS.AUTOPLAY_PROGRESS, '0');
      }
    });
  }

  if (progress >= 1) {
    instance.next();
    state.autoplayStartTime = performance.now();
  }

  autoplay.rafId = requestAnimationFrame(() => runAutoplayTick(instance));
}

// Checks if autoplay can resume based on all pause conditions
function canResume(instance) {
  const { autoplay } = instance;
  return (
    autoplay.isVisible &&
    !autoplay.pausedByHover &&
    !autoplay.pausedByFocus &&
    !autoplay.pausedByUser
  );
}

// Sets up autoplay with IntersectionObserver and pause handlers
export function setupAutoplay(instance) {
  const { container, config } = instance;

  instance.autoplay = {
    rafId: null,
    observer: null,
    isVisible: true,
    pausedByHover: false,
    pausedByFocus: false,
    pausedByUser: false,
  };

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

  // Hover pause handlers
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
    container.addEventListener('mouseenter', instance.autoplay.handleMouseEnter);
    container.addEventListener('mouseleave', instance.autoplay.handleMouseLeave);
  }

  // Focus pause handlers
  if (config.autoplayPauseFocus) {
    instance.autoplay.handleFocusIn = () => {
      instance.autoplay.pausedByFocus = true;
      pauseAutoplay(instance, 'focus');
    };
    instance.autoplay.handleFocusOut = (e) => {
      // Only resume if focus leaves the container entirely
      if (!container.contains(e.relatedTarget)) {
        instance.autoplay.pausedByFocus = false;
        if (canResume(instance)) {
          resumeAutoplay(instance);
        }
      }
    };
    container.addEventListener('focusin', instance.autoplay.handleFocusIn);
    container.addEventListener('focusout', instance.autoplay.handleFocusOut);
  }
}

// Starts autoplay timer with RAF progress updates
export function startAutoplay(instance) {
  const { container, state } = instance;

  state.isAutoplaying = true;
  state.isPaused = false;
  state.autoplayStartTime = performance.now();

  container.classList.add(CLASSES.AUTOPLAY_ACTIVE);
  container.classList.remove(CLASSES.AUTOPLAY_PAUSED);

  // Update play/pause button
  if (instance.playPauseBtn) {
    instance.playPauseBtn.setAttribute('aria-pressed', 'true');
  }

  emit(instance, EVENTS.AUTOPLAY_START, { index: state.currentIndex });

  instance.autoplay.rafId = requestAnimationFrame(() =>
    runAutoplayTick(instance)
  );
}

// Pauses autoplay
export function pauseAutoplay(instance, reason = 'user') {
  const { state, container } = instance;

  if (!state.isAutoplaying || state.isPaused) return;

  state.isPaused = true;

  // Track user-initiated pause separately (sticky)
  if (reason === 'user' || reason === 'keyboard') {
    instance.autoplay.pausedByUser = true;
  }

  // Cancel RAF
  if (instance.autoplay.rafId) {
    cancelAnimationFrame(instance.autoplay.rafId);
    instance.autoplay.rafId = null;
  }

  container.classList.add(CLASSES.AUTOPLAY_PAUSED);

  // Update play/pause button
  if (instance.playPauseBtn) {
    instance.playPauseBtn.setAttribute('aria-pressed', 'false');
  }

  // Store elapsed time and active index so we can resume from this point
  const elapsed = performance.now() - state.autoplayStartTime;
  state.autoplayElapsed = elapsed;
  state.autoplayPausedOnIndex = state.currentIndex;
  const progress = Math.min(elapsed / instance.config.autoplayDuration, 1);

  emit(instance, EVENTS.AUTOPLAY_PAUSE, {
    index: state.currentIndex,
    progress,
  });
}

// Resumes autoplay from where it was paused
export function resumeAutoplay(instance) {
  const { state, container } = instance;

  if (!state.isAutoplaying || !state.isPaused) return;
  if (!canResume(instance)) return;

  state.isPaused = false;
  // Resume from stored elapsed time only if still on the same slide, otherwise reset
  const sameSlide = state.autoplayPausedOnIndex === state.currentIndex;
  state.autoplayStartTime = sameSlide
    ? performance.now() - (state.autoplayElapsed || 0)
    : performance.now();

  container.classList.remove(CLASSES.AUTOPLAY_PAUSED);

  // Update play/pause button
  if (instance.playPauseBtn) {
    instance.playPauseBtn.setAttribute('aria-pressed', 'true');
  }

  emit(instance, EVENTS.AUTOPLAY_START, { index: state.currentIndex });

  instance.autoplay.rafId = requestAnimationFrame(() =>
    runAutoplayTick(instance)
  );
}

// Stops autoplay completely
export function stopAutoplay(instance) {
  const { state, container } = instance;

  state.isAutoplaying = false;
  state.isPaused = false;

  if (instance.autoplay?.rafId) {
    cancelAnimationFrame(instance.autoplay.rafId);
    instance.autoplay.rafId = null;
  }

  container.classList.remove(CLASSES.AUTOPLAY_ACTIVE, CLASSES.AUTOPLAY_PAUSED);

  // Reset progress on container
  container.style.setProperty(CSS_VARS.AUTOPLAY_PROGRESS, '0');

  // Reset progress on all dots
  if (instance.dots?.length > 0) {
    instance.dots.forEach((dot) => {
      dot.style.setProperty(CSS_VARS.AUTOPLAY_PROGRESS, '0');
    });
  }
}

// Cleans up autoplay listeners and observer
export function cleanupAutoplay(instance) {
  const { container, config, autoplay } = instance;

  if (!autoplay) return;

  // Cancel RAF
  if (autoplay.rafId) {
    cancelAnimationFrame(autoplay.rafId);
  }

  // Disconnect IntersectionObserver
  if (autoplay.observer) {
    autoplay.observer.disconnect();
  }

  // Remove hover listeners
  if (config.autoplayPauseHover && autoplay.handleMouseEnter) {
    container.removeEventListener('mouseenter', autoplay.handleMouseEnter);
    container.removeEventListener('mouseleave', autoplay.handleMouseLeave);
  }

  // Remove focus listeners
  if (config.autoplayPauseFocus && autoplay.handleFocusIn) {
    container.removeEventListener('focusin', autoplay.handleFocusIn);
    container.removeEventListener('focusout', autoplay.handleFocusOut);
  }

  instance.autoplay = null;
}
