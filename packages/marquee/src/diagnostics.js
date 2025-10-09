// Exposes diagnostics utilities to measure spacing and loop calculations for marquees
// The goal is to capture accurate, data-backed insights without modifying GSAP helpers

// Attach a singleton to window for easy access
import { CONFIG } from './config/config.js';
const MarqueeDiagnostics = (() => {
  /**
   * Measures spacing between items for a given marquee container.
   * - Pauses the animation briefly to ensure stable measurements.
   * - Computes inter-item spacing using DOM geometry so margins, flex gaps, and padding are respected.
   * - Compares measured geometry against the loop distance used by the GSAP helper.
   */
  function measure(containerElement) {
    const isVertical =
      containerElement.getAttribute(CONFIG.core.attributes.direction) ===
      'vertical';
    const instance = window.Marquee && window.Marquee.get(containerElement);
    const timeline = instance && instance.timeline;

    const computedContainerStyle = window.getComputedStyle(containerElement);
    const containerGapHorizontal =
      parseFloat(
        computedContainerStyle.columnGap || computedContainerStyle.gap || '0'
      ) || 0;
    const containerGapVertical =
      parseFloat(
        computedContainerStyle.rowGap || computedContainerStyle.gap || '0'
      ) || 0;

    const speedAttribute = containerElement.getAttribute(
      CONFIG.core.attributes.speed
    );
    const speedMultiplier = speedAttribute ? parseFloat(speedAttribute) : 1;
    const pixelsPerSecond =
      (isNaN(speedMultiplier) ? 1 : speedMultiplier) * 100;

    // Use only original items (exclude clones which have aria-hidden="true") to reflect author intent
    const originalItems = Array.from(
      containerElement.querySelectorAll(
        `[${CONFIG.core.attributes.item}="true"]:not([aria-hidden="true"])`
      )
    );

    // Fall back to all items if originals cannot be found (should not happen, but safe-guarded)
    const allItems = Array.from(
      containerElement.querySelectorAll(
        `[${CONFIG.core.attributes.item}="true"]`
      )
    );
    const items = originalItems.length > 0 ? originalItems : allItems;

    // Temporarily pause timeline for consistent measurements
    const wasPlaying = !!(timeline && !timeline.paused());
    if (timeline) {
      timeline.pause();
      // Force a render at the current time to prevent in-between frames affecting rects
      timeline.progress(timeline.progress(), true);
    }

    // Compute rects and spacing
    const containerRect = containerElement.getBoundingClientRect();
    const itemData = items.map((el, index) => {
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      const scaleX = window.gsap
        ? parseFloat(window.gsap.getProperty(el, 'scaleX')) || 1
        : 1;
      const scaleY = window.gsap
        ? parseFloat(window.gsap.getProperty(el, 'scaleY')) || 1
        : 1;
      return {
        index,
        element: el,
        rect,
        offsetLeft: el.offsetLeft,
        offsetTop: el.offsetTop,
        offsetWidth: el.offsetWidth,
        offsetHeight: el.offsetHeight,
        marginLeft: parseFloat(style.marginLeft) || 0,
        marginRight: parseFloat(style.marginRight) || 0,
        marginTop: parseFloat(style.marginTop) || 0,
        marginBottom: parseFloat(style.marginBottom) || 0,
        scaleX,
        scaleY,
      };
    });

    // Restore playback state
    if (timeline && wasPlaying) {
      timeline.play();
    }

    // Helper to compute inter-item spacing list using geometry
    function computeInterItemSpacingHorizontal(data) {
      const spacings = [];
      for (let itemIndex = 0; itemIndex < data.length - 1; itemIndex++) {
        const current = data[itemIndex].rect;
        const next = data[itemIndex + 1].rect;
        const spacing = next.left - (current.left + current.width);
        spacings.push(spacing);
      }
      return spacings;
    }

    function computeInterItemSpacingVertical(data) {
      const spacings = [];
      for (let itemIndex = 0; itemIndex < data.length - 1; itemIndex++) {
        const current = data[itemIndex].rect;
        const next = data[itemIndex + 1].rect;
        const spacing = next.top - (current.top + current.height);
        spacings.push(spacing);
      }
      return spacings;
    }

    // Stats helpers
    function round(value) {
      return Math.round(value * 1000) / 1000;
    }

    function stats(values) {
      if (!values || values.length === 0) {
        return { count: 0 };
      }
      const sorted = [...values].sort((a, b) => a - b);
      const count = sorted.length;
      const sum = sorted.reduce((accum, n) => accum + n, 0);
      const mean = sum / count;
      const median =
        count % 2 === 1
          ? sorted[(count - 1) / 2]
          : (sorted[count / 2 - 1] + sorted[count / 2]) / 2;
      const min = sorted[0];
      const max = sorted[count - 1];
      const variance =
        sorted.reduce((accum, n) => accum + Math.pow(n - mean, 2), 0) / count;
      const stddev = Math.sqrt(variance);
      return {
        count,
        min: round(min),
        max: round(max),
        mean: round(mean),
        median: round(median),
        stddev: round(stddev),
      };
    }

    // Compute spacing
    const interItemSpacings = isVertical
      ? computeInterItemSpacingVertical(itemData)
      : computeInterItemSpacingHorizontal(itemData);

    const interItemStats = stats(interItemSpacings);

    // Geometry span between the first and last original items
    const firstRect = itemData[0]?.rect;
    const lastRect = itemData[itemData.length - 1]?.rect;
    const geometrySpan = isVertical
      ? lastRect.bottom - firstRect.top
      : lastRect.right - firstRect.left;

    // The helper's total loop distance equals timeline.duration * pixelsPerSecond
    const helperLoopDistance = timeline
      ? timeline.duration() * pixelsPerSecond
      : NaN;

    // The helper implicitly leaves out seam spacing unless padding is passed
    const seamSpacingImpliedByHelper = helperLoopDistance - geometrySpan;

    // Expected seam spacing derived from measured inter-item spacing (median is robust to outliers)
    const expectedSeamSpacing =
      interItemStats.count > 0 ? interItemStats.median : 0;

    // Container padding that may influence the seam visually
    const containerPaddingLeft =
      parseFloat(computedContainerStyle.paddingLeft) || 0;
    const containerPaddingRight =
      parseFloat(computedContainerStyle.paddingRight) || 0;
    const containerPaddingTop =
      parseFloat(computedContainerStyle.paddingTop) || 0;
    const containerPaddingBottom =
      parseFloat(computedContainerStyle.paddingBottom) || 0;

    // Build report object
    const report = {
      container: containerElement,
      id: containerElement.id || null,
      isVertical,
      pixelsPerSecond,
      timelineDuration: timeline ? timeline.duration() : null,
      helperLoopDistance: isNaN(helperLoopDistance)
        ? null
        : round(helperLoopDistance),
      geometrySpan: round(geometrySpan),
      seamSpacingImpliedByHelper: isNaN(seamSpacingImpliedByHelper)
        ? null
        : round(seamSpacingImpliedByHelper),
      expectedSeamSpacing: round(expectedSeamSpacing),
      seamSpacingDelta: isNaN(seamSpacingImpliedByHelper)
        ? null
        : round(expectedSeamSpacing - seamSpacingImpliedByHelper),
      containerGapHorizontal: round(containerGapHorizontal),
      containerGapVertical: round(containerGapVertical),
      containerPadding: {
        left: round(containerPaddingLeft),
        right: round(containerPaddingRight),
        top: round(containerPaddingTop),
        bottom: round(containerPaddingBottom),
      },
      interItemSpacings: interItemSpacings.map(round),
      interItemStats,
      items: itemData.map((d) => ({
        index: d.index,
        text: d.element.textContent?.trim() || '',
        left: round(d.rect.left - containerRect.left),
        right: round(d.rect.right - containerRect.left),
        top: round(d.rect.top - containerRect.top),
        bottom: round(d.rect.bottom - containerRect.top),
        width: round(d.rect.width),
        height: round(d.rect.height),
        marginLeft: round(d.marginLeft),
        marginRight: round(d.marginRight),
        marginTop: round(d.marginTop),
        marginBottom: round(d.marginBottom),
        offsetLeft: d.offsetLeft,
        offsetTop: d.offsetTop,
        offsetWidth: d.offsetWidth,
        offsetHeight: d.offsetHeight,
        scaleX: d.scaleX,
        scaleY: d.scaleY,
      })),
    };

    return report;
  }

  /**
   * Logs a formatted report to the console for quick copy-paste diagnostics.
   * - Prints a concise summary followed by detailed tables.
   */
  function logReport(report) {
    /* eslint-disable no-console */
    const idLabel = report.id ? `#${report.id}` : '(no id)';
    console.log('MarqueeDiagnostics Report:', {
      id: report.id,
      isVertical: report.isVertical,
      pixelsPerSecond: report.pixelsPerSecond,
      duration: report.timelineDuration,
      helperLoopDistance: report.helperLoopDistance,
      geometrySpan: report.geometrySpan,
      seamSpacingImpliedByHelper: report.seamSpacingImpliedByHelper,
      expectedSeamSpacing: report.expectedSeamSpacing,
      seamSpacingDelta: report.seamSpacingDelta,
      containerGapHorizontal: report.containerGapHorizontal,
      containerGapVertical: report.containerGapVertical,
      containerPadding: report.containerPadding,
      interItemStats: report.interItemStats,
    });

    console.log(`%cContainer ${idLabel}`, 'color:#4facfe');
    console.table([
      { key: 'isVertical', value: report.isVertical },
      { key: 'pixelsPerSecond', value: report.pixelsPerSecond },
      { key: 'timelineDuration', value: report.timelineDuration },
      { key: 'helperLoopDistance', value: report.helperLoopDistance },
      { key: 'geometrySpan', value: report.geometrySpan },
      {
        key: 'seamSpacingImpliedByHelper',
        value: report.seamSpacingImpliedByHelper,
      },
      { key: 'expectedSeamSpacing', value: report.expectedSeamSpacing },
      { key: 'seamSpacingDelta', value: report.seamSpacingDelta },
      { key: 'containerGapHorizontal', value: report.containerGapHorizontal },
      { key: 'containerGapVertical', value: report.containerGapVertical },
      { key: 'paddingLeft', value: report.containerPadding.left },
      { key: 'paddingRight', value: report.containerPadding.right },
      { key: 'paddingTop', value: report.containerPadding.top },
      { key: 'paddingBottom', value: report.containerPadding.bottom },
    ]);

    console.log('%cInter-item Spacings', 'color:#00f2fe');
    console.table(
      report.interItemSpacings.map((spacing, index) => ({ index, spacing }))
    );

    console.log('%cItems (relative to container)', 'color:#f093fb');
    console.table(
      report.items.map((d) => ({
        index: d.index,
        text: d.text,
        left: d.left,
        right: d.right,
        top: d.top,
        bottom: d.bottom,
        width: d.width,
        height: d.height,
        marginLeft: d.marginLeft,
        marginRight: d.marginRight,
        marginTop: d.marginTop,
        marginBottom: d.marginBottom,
        offsetLeft: d.offsetLeft,
        offsetTop: d.offsetTop,
        offsetWidth: d.offsetWidth,
        offsetHeight: d.offsetHeight,
        scaleX: d.scaleX,
        scaleY: d.scaleY,
      }))
    );

    const hasSeamIssue =
      typeof report.seamSpacingDelta === 'number' &&
      Math.abs(report.seamSpacingDelta) > 0.5;
    if (hasSeamIssue) {
      console.warn(
        'Possible seam mismatch detected. expectedSeamSpacing - seamSpacingImpliedByHelper =',
        report.seamSpacingDelta
      );
    }
    /* eslint-enable no-console */
  }

  /**
   * Samples around each horizontal item's loop-jump time to detect early repositioning
   * (when the item is not yet fully outside the visible clip area).
   * Returns a per-item report with jumpTime and whether it was fully out.
   */
  function checkHorizontalExit(containerElement) {
    const instance = window.Marquee && window.Marquee.get(containerElement);
    if (!instance || !instance.timeline) {
      return null;
    }
    const tl = instance.timeline;
    const isVertical =
      containerElement.getAttribute(CONFIG.core.attributes.direction) ===
      'vertical';
    if (isVertical) {
      return { error: 'checkHorizontalExit is only for horizontal marquees' };
    }

    const computed = window.getComputedStyle(containerElement);
    const paddingLeft = parseFloat(computed.paddingLeft) || 0;
    const containerRect = containerElement.getBoundingClientRect();
    const clipLeft = containerRect.left + paddingLeft;

    const speedAttribute = containerElement.getAttribute(
      CONFIG.core.attributes.speed
    );
    const speedMultiplier = speedAttribute ? parseFloat(speedAttribute) : 1;
    const pixelsPerSecond =
      (isNaN(speedMultiplier) ? 1 : speedMultiplier) * 100;

    // Use only originals (exclude clones) for meaningful analysis
    const originals = Array.from(
      containerElement.querySelectorAll(
        `[${CONFIG.core.attributes.item}="true"]:not([aria-hidden="true"])`
      )
    );

    // Save timeline state
    const wasPaused = tl.paused();
    const prevTime = tl.time();
    tl.pause();

    const duration = tl.duration();
    const times = tl.times || [];
    const epsilon = Math.min(0.01, duration / 1000);

    const results = originals.map((el, index) => {
      const width =
        parseFloat(window.gsap.getProperty(el, 'width', 'px')) ||
        el.getBoundingClientRect().width;
      const scaleX = parseFloat(window.gsap.getProperty(el, 'scaleX')) || 1;
      const jumpTimeRaw =
        (times[index] || 0) + (width * scaleX) / pixelsPerSecond;
      const jumpTime = ((jumpTimeRaw % duration) + duration) % duration;
      const beforeTime = Math.max(0, jumpTime - epsilon);

      // Sample before jump
      tl.time(beforeTime, true);
      const rectBefore = el.getBoundingClientRect();
      const rightBefore = rectBefore.right;
      const overhangPx = Math.max(0, rightBefore - clipLeft);
      const wasFullyOut = rightBefore <= clipLeft + 0.5;

      return {
        index,
        jumpTime: Math.round(jumpTime * 1000) / 1000,
        rightBefore: Math.round(rightBefore * 1000) / 1000,
        clipLeft: Math.round(clipLeft * 1000) / 1000,
        overhangPx: Math.round(overhangPx * 1000) / 1000,
        wasFullyOut,
      };
    });

    // Restore timeline state
    tl.time(prevTime, true);
    wasPaused ? tl.pause() : tl.play();

    return {
      id: containerElement.id || null,
      isVertical: false,
      pixelsPerSecond,
      duration,
      clipLeft,
      items: results,
    };
  }

  /**
   * Logs the horizontal exit check in a concise table.
   */
  function logHorizontalExit(report) {
    if (!report || report.error) {
      /* eslint-disable no-console */
      console.warn(
        'Horizontal exit check unavailable:',
        report && report.error
      );
      /* eslint-enable no-console */
      return;
    }
    /* eslint-disable no-console */
    console.log('Horizontal Exit Check:', {
      id: report.id,
      pixelsPerSecond: report.pixelsPerSecond,
      duration: report.duration,
      clipLeft: report.clipLeft,
    });
    console.table(
      report.items.map((r) => ({
        index: r.index,
        jumpTime: r.jumpTime,
        rightBefore: r.rightBefore,
        clipLeft: r.clipLeft,
        overhangPx: r.overhangPx,
        wasFullyOut: r.wasFullyOut,
      }))
    );
    const anyEarly = report.items.some((r) => !r.wasFullyOut);
    if (anyEarly) {
      console.warn(
        'Detected early repositioning before full exit for at least one item.'
      );
    }
    /* eslint-enable no-console */
  }

  /**
   * Runs diagnostics for one container by element or selector.
   */
  function run(target) {
    const containerElement =
      typeof target === 'string' ? document.querySelector(target) : target;
    if (!containerElement) {
      /* eslint-disable no-console */
      console.error('MarqueeDiagnostics.run(): target not found', target);
      /* eslint-enable no-console */
      return null;
    }
    const report = measure(containerElement);
    logReport(report);
    return report;
  }

  /**
   * Runs diagnostics for all containers with data-marquee attribute.
   */
  function runAll() {
    const containers = Array.from(
      document.querySelectorAll(`[${CONFIG.core.attributes.direction}]`)
    );
    const reports = containers.map((containerElement) =>
      measure(containerElement)
    );
    reports.forEach((report) => logReport(report));
    return reports;
  }

  /**
   * Runs and logs the horizontal exit check for a container (selector or element).
   */
  function runHorizontalExit(target) {
    const containerElement =
      typeof target === 'string' ? document.querySelector(target) : target;
    if (!containerElement) {
      /* eslint-disable no-console */
      console.error(
        'MarqueeDiagnostics.runHorizontalExit(): target not found',
        target
      );
      /* eslint-enable no-console */
      return null;
    }
    const report = checkHorizontalExit(containerElement);
    logHorizontalExit(report);
    return report;
  }

  return { measure, run, runAll, checkHorizontalExit, runHorizontalExit };
})();

// Expose globally
window.MarqueeDiagnostics = MarqueeDiagnostics;
