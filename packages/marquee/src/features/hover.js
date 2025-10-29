// Attaches hover event listeners to container or individual items based on settings
export function attachHoverHandlers(instance, settings) {
  const onEnter = () => {
    instance.isHovering = true;
    if (settings.effectType === 'pause') {
      startPauseEffect(instance, settings);
    } else if (settings.effectType === 'slow') {
      startSlowEffect(instance, settings);
    }
  };

  const onLeave = () => {
    instance.isHovering = false;
    if (settings.effectType === 'pause') {
      endPauseEffect(instance, settings);
    } else if (settings.effectType === 'slow') {
      endSlowEffect(instance, settings);
    }
  };

  if (settings.triggerArea === 'items') {
    const items = instance.findMarqueeItems();
    items.forEach((el) => {
      el.addEventListener('mouseenter', onEnter);
      el.addEventListener('mouseleave', onLeave);
      instance.eventListeners.push({ type: 'mouseenter', handler: onEnter, target: el });
      instance.eventListeners.push({ type: 'mouseleave', handler: onLeave, target: el });
    });
  } else {
    instance.container.addEventListener('mouseenter', onEnter);
    instance.container.addEventListener('mouseleave', onLeave);
    instance.eventListeners.push({ type: 'mouseenter', handler: onEnter, target: instance.container });
    instance.eventListeners.push({ type: 'mouseleave', handler: onLeave, target: instance.container });
  }
}

// Ramps timeline speed down to zero using optional mid-ratio phase
function startPauseEffect(instance, settings) {
  if (!instance.timeline) return;
  if (instance.wasPausedByEffect && instance.timeline.paused()) return;

  const sign = getPlaybackSign(instance);
  const base = Math.abs(instance.baseTimeScale) || 1;
  const midRatio = Math.max(0, Math.min(settings.rampRatioWhileHoveringForPause, base));
  const total = Math.max(0, settings.totalPauseRampDuration);

  if (total === 0) {
    changeSpeed(instance, 0, 0, settings.slowRampInEase);
    instance.timeline.pause();
    instance.wasPausedByEffect = true;
    return;
  }

  const stage1 = midRatio > 0 ? Math.max(0, total * 0.6) : 0;
  const stage2 = Math.max(0, total - stage1);

  if (instance.pauseRampTimeline) {
    instance.pauseRampTimeline.kill();
    instance.pauseRampTimeline = null;
  }

  if (window.gsap) {
    const rampTl = window.gsap.timeline();
    if (stage1 > 0) {
      rampTl.to(instance.timeline, {
        timeScale: sign * midRatio,
        duration: stage1,
        ease: settings.slowRampInEase,
        overwrite: 'auto',
      });
    }
    rampTl.to(instance.timeline, {
      timeScale: 0,
      duration: stage2,
      ease: settings.slowRampOutEase || settings.slowRampInEase,
      overwrite: 'auto',
    });
    rampTl.eventCallback('onComplete', () => {
      if (instance.isHovering && instance.timeline) {
        instance.timeline.pause();
        instance.wasPausedByEffect = true;
      }
      instance.pauseRampTimeline = null;
    });
    instance.pauseRampTimeline = rampTl;
  }
}

// Resumes timeline from paused state and ramps back to normal speed
function endPauseEffect(instance, settings) {
  if (!instance.timeline) return;

  if (instance.pauseRampTimeline) {
    instance.pauseRampTimeline.kill();
    instance.pauseRampTimeline = null;
  }

  if (instance.wasPausedByEffect && instance.timeline.paused()) {
    instance.timeline.play();
  }
  instance.wasPausedByEffect = false;

  const sign = getPlaybackSign(instance);
  const base = Math.abs(instance.baseTimeScale) || 1;
  changeSpeed(instance, sign * base, settings.slowRampOutDuration, settings.slowRampOutEase);
}

// Ramps timeline to a slower sustained speed
function startSlowEffect(instance, settings) {
  if (!instance.timeline) return;

  const sign = getPlaybackSign(instance);
  const base = Math.abs(instance.baseTimeScale) || 1;
  const target = Math.max(0, Math.min(settings.rampRatioWhileHoveringForSlow, base));

  changeSpeed(instance, sign * target, settings.slowRampInDuration, settings.slowRampInEase);
}

// Ramps timeline back to normal speed
function endSlowEffect(instance, settings) {
  if (!instance.timeline) return;

  const sign = getPlaybackSign(instance);
  const base = Math.abs(instance.baseTimeScale) || 1;

  changeSpeed(instance, sign * base, settings.slowRampOutDuration, settings.slowRampOutEase);
}

// Returns 1 for forward playback or -1 for reverse
function getPlaybackSign(instance) {
  if (!instance.timeline) return 1;
  return instance.timeline.timeScale() < 0 ? -1 : 1;
}

// Animates timeline timeScale to a target value with easing
function changeSpeed(instance, targetTimeScale, duration, ease) {
  if (!instance.timeline || !window.gsap) return;
  window.gsap.to(instance.timeline, {
    timeScale: targetTimeScale,
    duration: Math.max(0, duration || 0),
    ease: ease || 'power2.out',
    overwrite: 'auto',
  });
}
