// Autoplay behavior for tabs: timer, progress updates, pause/resume

import { CLASSES, CSS_VARS } from './config.js';

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

// Starts autoplay timer with RAF progress updates
export function startAutoplay(instance) {
  const { container, config, state, triggerMap } = instance;

  state.isAutoplaying = true;
  state.isPaused = false;
  state.autoplayStartTime = performance.now();

  container.classList.add(CLASSES.AUTOPLAY_ACTIVE);
  container.classList.remove(CLASSES.AUTOPLAY_PAUSED);

  // Update play/pause button
  if (instance.playPauseBtn) {
    instance.playPauseBtn.setAttribute('aria-pressed', 'true');
  }

  emitAutoplayEvent(instance, 'autoplay-start', { value: state.activeValue });

  // RAF loop for progress updates
  function tick() {
    if (!state.isAutoplaying || state.isPaused) return;

    const elapsed = performance.now() - state.autoplayStartTime;
    const progress = Math.min(elapsed / config.autoplayDuration, 1);

    // Update --tabs-progress on active trigger(s)
    const activeTriggers = triggerMap.get(state.activeValue);
    if (activeTriggers) {
      activeTriggers.forEach((trigger) => {
        trigger.style.setProperty(CSS_VARS.PROGRESS, progress.toString());
      });
    }

    if (progress >= 1) {
      // Advance to next tab and restart timer
      instance.next();
      state.autoplayStartTime = performance.now();
    }

    instance.autoplay.rafId = requestAnimationFrame(tick);
  }

  instance.autoplay.rafId = requestAnimationFrame(tick);
}

// Pauses autoplay
export function pauseAutoplay(instance, reason = 'user') {
  const { state, container } = instance;

  if (!state.isAutoplaying || state.isPaused) return;

  state.isPaused = true;

  // Track user-initiated pause separately
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

  // Get current progress for event
  const elapsed = performance.now() - state.autoplayStartTime;
  const progress = Math.min(elapsed / instance.config.autoplayDuration, 1);

  emitAutoplayEvent(instance, 'autoplay-pause', {
    value: state.activeValue,
    progress,
  });
}

// Resumes autoplay (resets timer to 0)
export function resumeAutoplay(instance) {
  const { state, container } = instance;

  if (!state.isAutoplaying || !state.isPaused) return;
  if (!canResume(instance)) return;

  state.isPaused = false;
  state.autoplayStartTime = performance.now(); // Reset timer to 0

  container.classList.remove(CLASSES.AUTOPLAY_PAUSED);

  // Update play/pause button
  if (instance.playPauseBtn) {
    instance.playPauseBtn.setAttribute('aria-pressed', 'true');
  }

  emitAutoplayEvent(instance, 'autoplay-start', { value: state.activeValue });

  // Restart RAF loop
  function tick() {
    if (!state.isAutoplaying || state.isPaused) return;

    const elapsed = performance.now() - state.autoplayStartTime;
    const progress = Math.min(elapsed / instance.config.autoplayDuration, 1);

    const activeTriggers = instance.triggerMap.get(state.activeValue);
    if (activeTriggers) {
      activeTriggers.forEach((trigger) => {
        trigger.style.setProperty(CSS_VARS.PROGRESS, progress.toString());
      });
    }

    if (progress >= 1) {
      instance.next();
      state.autoplayStartTime = performance.now();
    }

    instance.autoplay.rafId = requestAnimationFrame(tick);
  }

  instance.autoplay.rafId = requestAnimationFrame(tick);
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

  // Reset progress on all triggers
  instance.triggers.forEach((trigger) => {
    trigger.style.setProperty(CSS_VARS.PROGRESS, '0');
  });
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

// Helper to emit autoplay events via the instance's event system
function emitAutoplayEvent(instance, eventName, data) {
  const { events, container } = instance;

  // Instance event callbacks
  if (events.has(eventName)) {
    events.get(eventName).forEach((callback) => {
      callback.call(instance, { type: eventName, target: instance, ...data });
    });
  }

  // DOM CustomEvent
  const customEvent = new CustomEvent(`tabs:${eventName}`, {
    detail: { tabs: instance, ...data },
    bubbles: true,
  });
  container.dispatchEvent(customEvent);
}
