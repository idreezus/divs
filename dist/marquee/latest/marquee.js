/*!
 * Marquee v0.1.0
 * A seamless marquee animation library powered by GSAP
 * 
 * Part of <divs> by Idreeszus, a component library → (divs.idreezus.com)
 * 
 * (c) 2025 Idrees Isse (https://github.com/idreezus)
 * Released under AGPL-3.0
 */
(function () {
  'use strict';

  // Centralized configuration for marquee features (attribute names and defaults)
  // The goal is to keep strings and default values in one place so other files
  // reference this module instead of hardcoding values across the codebase.

  const CONFIG = {
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

  // Parsing helpers for marquee configuration based on data-* attributes.
  // These functions convert string attributes into normalized config objects.



  // Parses a float attribute with a fallback default and optional clamp.
  function parseFloatAttribute(element, attributeName, fallback, min) {
    // Purpose: Read numeric attributes safely for durations and ratios.
    const raw = element.getAttribute(attributeName);
    if (raw === null) return fallback;
    const value = parseFloat(raw);
    if (Number.isNaN(value)) return fallback;
    if (value < min) return min;
    return value;
  }

  // Parses an integer attribute with a fallback default and optional clamp.
  function parseIntAttribute(element, attributeName, fallback, min, max) {
    // Purpose: Read integer-like attributes (counts, repeats) safely.
    const raw = element.getAttribute(attributeName);
    if (raw === null) return fallback;
    const value = parseInt(raw, 10);
    if (Number.isNaN(value)) return fallback;
    if (typeof min === 'number' && value < min) return min;
    if (typeof max === 'number' && value > max) return max;
    return value;
  }

  // Reads direction from computed flex-direction CSS property
  // Defaults to horizontal when flex-direction is 'row' or unspecified
  function parseDirection(element) {
    const computedStyle = window.getComputedStyle(element);
    const flexDirection = computedStyle.flexDirection;

    // Warn about reverse directions - should use data-marquee-reverse instead
    if (flexDirection === 'row-reverse' || flexDirection === 'column-reverse') {
      if (!element.hasAttribute(CONFIG.internalFlags.attributes.reverseWarned)) {
        console.warn(
          'Marquee: Detected flex-direction "' + flexDirection + '". For reverse animation, use ' + CONFIG.core.attributes.reverse + '="true" instead of CSS reverse directions.',
          element
        );
        element.setAttribute(CONFIG.internalFlags.attributes.reverseWarned, 'true');
      }
    }

    const isVertical = flexDirection === 'column' || flexDirection === 'column-reverse';
    return isVertical ? 'vertical' : 'horizontal';
  }

  // Builds core loop configuration from attributes
  function parseCoreConfig(element) {
    const { attributes, defaults } = CONFIG.core;
    const reverseAttr = element.getAttribute(attributes.reverse);

    return {
      direction: parseDirection(element),
      speed: parseFloatAttribute(element, attributes.speed, defaults.speed, 0),
      repeat: parseIntAttribute(element, attributes.repeat, defaults.repeat),
      paused: defaults.paused,
      reversed: reverseAttr === 'true',
    };
  }

  // Builds cloning configuration from attributes.
  function parseCloningConfig(element) {
    // Purpose: Control auto-clone behavior and clone count.
    const { attributes, defaults } = CONFIG.cloning;
    const autoCloneRaw = element.getAttribute(attributes.autoClone);
    const autoClone =
      autoCloneRaw === null ? defaults.autoClone : autoCloneRaw !== 'false';

    const rawCloneCount = element.getAttribute(attributes.cloneCount);
    const requestedCount = rawCloneCount ? parseInt(rawCloneCount, 10) : null;

    // Warn if user tries to exceed maximum
    if (requestedCount !== null && !isNaN(requestedCount) && requestedCount > 10) {
      console.warn(
        'Marquee: Clone count capped at 10 for performance. Requested:',
        requestedCount,
        '→ Using: 10. To improve performance with many items, reduce data-marquee-clones.',
        element
      );
    }

    return {
      autoClone,
      cloneCount: parseIntAttribute(
        element,
        attributes.cloneCount,
        defaults.cloneCount,
        1,
        10
      ),
    };
  }

  // Builds interaction configuration from attributes.
  function parseInteractionConfig(element) {
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

  // Builds observer configuration from attributes.
  function parseObserverConfig(element) {
    // Purpose: Control intersection observer behavior.
    const { attributes, defaults } = CONFIG.observers;
    const intersectionRaw = element.getAttribute(attributes.intersection);
    const intersection =
      intersectionRaw === null ? defaults.intersection : intersectionRaw !== 'false';

    return {
      intersection,
      threshold: defaults.threshold,
      rootMargin: defaults.rootMargin,
    };
  }

  // Calculates optimal clone count based on container and items size
  function calculateOptimalCloneCount(container, items, isVertical) {
    if (items.length === 0) return 1;

    const containerSize = isVertical
      ? container.clientHeight
      : container.clientWidth;

    // Measure actual rendered size including gaps, margins, and padding
    let totalContentSize = 0;
    if (items.length === 1) {
      totalContentSize = isVertical
        ? items[0].offsetHeight
        : items[0].offsetWidth;
    } else {
      // Measure from first item start to last item end (includes all gaps)
      const firstRect = items[0].getBoundingClientRect();
      const lastRect = items[items.length - 1].getBoundingClientRect();

      totalContentSize = isVertical
        ? lastRect.bottom - firstRect.top
        : lastRect.right - firstRect.left;
    }

    // Need at least 2x container size worth of content for seamless loop
    const requiredSize = containerSize * 2;
    const clonesNeeded = Math.ceil(requiredSize / totalContentSize);

    // Debug logging with URL parameter
    if (window.location.search.includes('marquee-debug')) {
      console.log('Clone calculation:', {
        containerSize,
        totalContentSize,
        requiredSize,
        clonesNeeded,
        itemCount: items.length,
      });
    }

    // Clamp between 1 and 10 to avoid edge cases
    return Math.max(1, Math.min(10, clonesNeeded));
  }

  // Creates clones of marquee items and appends them to the container for seamless looping
  function cloneItems(
    container,
    originalItems,
    cloningConfig,
    isVertical = false
  ) {
    const autoCloneAttr = container.getAttribute(
      CONFIG.cloning.attributes.autoClone
    );
    const autoCloneEnabled =
      autoCloneAttr === null
        ? cloningConfig?.autoClone ?? CONFIG.cloning.defaults.autoClone
        : autoCloneAttr !== 'false';

    if (!autoCloneEnabled) return;

    const cloneCountAttr = container.getAttribute(
      CONFIG.cloning.attributes.cloneCount
    );

    let cloneCount;
    if (cloneCountAttr) {
      // User explicitly set clone count
      cloneCount = parseInt(cloneCountAttr, 10);
      if (isNaN(cloneCount) || cloneCount < 1) return;
      // Clamp to max of 10
      if (cloneCount > 10) {
        cloneCount = 10;
      }
    } else {
      // Auto-calculate optimal clone count
      cloneCount = calculateOptimalCloneCount(
        container,
        originalItems,
        isVertical
      );

      // Log calculated count in debug scenarios
      if (window.location.search.includes('marquee-debug')) {
        console.log(
          'Marquee: Auto-calculated clone count:',
          cloneCount,
          'for',
          container
        );
      }
    }

    if (cloneCount < 1) return;

    for (let i = 0; i < cloneCount; i++) {
      originalItems.forEach((item) => {
        const clone = item.cloneNode(true);
        clone.setAttribute('aria-hidden', 'true');
        clone.setAttribute(CONFIG.internalFlags.attributes.clone, 'true');
        container.appendChild(clone);
      });
    }
  }

  // Removes all cloned marquee items from the container
  function removeClones(container) {
    const clones = container.querySelectorAll(
      `[${CONFIG.internalFlags.attributes.clone}="true"]`
    );
    clones.forEach((clone) => clone.remove());
  }

  /*
  This helper function makes a group of elements animate along the x-axis in a seamless, responsive loop.

  Features:
  - Uses xPercent so that even if the widths change (like if the window gets resized), it should still work in most cases.
  - When each item animates to the left or right enough, it will loop back to the other side
  - Optionally pass in a config object with values like "speed" (default: 1, which travels at roughly 100 pixels per second), paused (boolean),  repeat, reversed, and paddingRight.
  - The returned timeline will have the following methods added to it:
  - next() - animates to the next element using a timeline.tweenTo() which it returns. You can pass in a vars object to control duration, easing, etc.
  - previous() - animates to the previous element using a timeline.tweenTo() which it returns. You can pass in a vars object to control duration, easing, etc.
  - toIndex() - pass in a zero-based index value of the element that it should animate to, and optionally pass in a vars object to control duration, easing, etc. Always goes in the shortest direction
  - current() - returns the current index (if an animation is in-progress, it reflects the final index)
  - times - an Array of the times on the timeline where each element hits the "starting" spot. There's also a label added accordingly, so "label1" is when the 2nd element reaches the start.
  */
  function horizontalLoop(items, config) {
    let timeline;
    items = gsap.utils.toArray(items);
    config = config || {};
    gsap.context(() => {
      // use a context so resize listeners/observers can be cleaned up automatically
      const tl = gsap.timeline({
        repeat: config.repeat,
        paused: config.paused,
        defaults: { ease: 'none' },
        onReverseComplete: () => tl.totalTime(tl.rawTime() + tl.duration() * 100),
      });
      const length = items.length;
      let startX = items[0].offsetLeft;
      const times = [];
      const widths = [];
      // MODIFIED FROM ORIGINAL: track horizontal space before each item using geometry
      const spaceBeforeX = [];
      const xPercents = [];
      let curIndex = 0;
      const pixelsPerSecond = (config.speed || 1) * 100;
      const snap =
        config.snap === false ? (v) => v : gsap.utils.snap(config.snap || 1);
      let totalWidth;
      const container = items[0].parentNode;
      let internalResizeObserver;
      let _hDisposed = false;

      // set initial transform basis
      gsap.set(items, { x: 0 });

      /**
       * Recomputes widths, xPercents, geometry spacing, and totalWidth from DOM measurements.
       * This function is called on init and on refresh to keep timing aligned with layout.
       */
      const populateWidths = () => {
        // convert "x" to "xPercent" to make things responsive, and populate the widths/xPercents arrays
        gsap.set(items, {
          xPercent: (index, el) => {
            const widthPx = (widths[index] = parseFloat(
              gsap.getProperty(el, 'width', 'px')
            ));
            xPercents[index] = snap(
              (parseFloat(gsap.getProperty(el, 'x', 'px')) / widthPx) * 100 +
                gsap.getProperty(el, 'xPercent')
            );
            return xPercents[index];
          },
        });
        // measure inter-item horizontal spacing using geometry so margins/gaps/padding are respected
        const containerRect = container.getBoundingClientRect();
        const rects = items.map((el) => el.getBoundingClientRect());
        rects.forEach((rect, itemIndex) => {
          spaceBeforeX[itemIndex] =
            rect.left -
            (itemIndex ? rects[itemIndex - 1].right : containerRect.left);
        });
        // Auto-derive seam padding when not provided
        if (
          config.paddingRight == null ||
          isNaN(parseFloat(config.paddingRight))
        ) {
          const gaps = spaceBeforeX
            .slice(1)
            .filter((g) => typeof g === 'number' && isFinite(g));
          if (gaps.length > 0) {
            const sorted = gaps.slice().sort((a, b) => a - b);
            const mid = Math.floor(sorted.length / 2);
            const median =
              sorted.length % 2 === 0
                ? (sorted[mid - 1] + sorted[mid]) / 2
                : sorted[mid];
            config.paddingRight = median > 0 ? median : 0;
          } else {
            config.paddingRight = 0;
          }
        }
        // recalc starting offset and total width based on current layout
        startX = items[0].offsetLeft;
        totalWidth =
          items[length - 1].offsetLeft +
          (xPercents[length - 1] / 100) * widths[length - 1] -
          startX +
          // exclude initial left-side spacing so seam spacing is controlled via paddingRight
          items[length - 1].offsetWidth *
            gsap.getProperty(items[length - 1], 'scaleX') +
          (parseFloat(config.paddingRight) || 0);
      };

      /**
       * Rebuilds the timeline's tweens and labels using the latest measurements.
       * This ensures that loop points and durations remain consistent after layout changes.
       */
      const populateTimeline = () => {
        tl.clear();
        for (let itemIndex = 0; itemIndex < length; itemIndex++) {
          const element = items[itemIndex];
          const curX = (xPercents[itemIndex] / 100) * widths[itemIndex];
          const distanceToStart =
            element.offsetLeft + curX - startX + spaceBeforeX[0];
          const distanceToLoop =
            distanceToStart +
            widths[itemIndex] * gsap.getProperty(element, 'scaleX');
          tl.to(
            element,
            {
              xPercent: snap(((curX - distanceToLoop) / widths[itemIndex]) * 100),
              duration: distanceToLoop / pixelsPerSecond,
            },
            0
          )
            .fromTo(
              element,
              {
                xPercent: snap(
                  ((curX - distanceToLoop + totalWidth) / widths[itemIndex]) * 100
                ),
              },
              {
                xPercent: xPercents[itemIndex],
                duration:
                  (curX - distanceToLoop + totalWidth - curX) / pixelsPerSecond,
                immediateRender: false,
              },
              distanceToLoop / pixelsPerSecond
            )
            .add('label' + itemIndex, distanceToStart / pixelsPerSecond);
          times[itemIndex] = distanceToStart / pixelsPerSecond;
        }
      };

      /**
       * Refreshes measurements and optionally rebuilds the timeline after a layout change.
       * When deep is true, the timeline tweens/labels are recreated to match new sizes.
       */
      const refresh = (deep) => {
        const previousProgress = tl.progress();
        tl.progress(0, true);
        populateWidths();
        deep && populateTimeline();
        // restore playhead to proportional position to avoid visible jumps
        tl.progress(previousProgress, true);
      };

      let _hRafId = null;
      const _hScheduleRefresh = () => {
        if (_hRafId !== null) {
          cancelAnimationFrame(_hRafId);
        }
        _hRafId = requestAnimationFrame(() => {
          _hRafId = null;
          // Check for direction change before refreshing
          if (config.onDirectionChange) {
            config.onDirectionChange();
            // Check again after direction change callback, which may have disposed this timeline
            if (_hDisposed) {
              _hRafId = null;
              return;
            }
          }
          refresh(true);
        });
      };

      // initial build
      populateWidths();
      populateTimeline();

      // pre-render for performance and apply reverse if requested
      tl.progress(1, true).progress(0, true);
      if (config.reversed) {
        tl.vars.onReverseComplete();
        tl.reverse();
      }

      /**
       * Moves the playhead to the tween corresponding to the given index in the shortest direction.
       */
      function toIndex(index, vars) {
        vars = vars || {};
        Math.abs(index - curIndex) > length / 2 &&
          (index += index > curIndex ? -length : length); // always go in the shortest direction
        const newIndex = gsap.utils.wrap(0, length, index);
        let time = times[newIndex];
        if (time > tl.time() !== index > curIndex) {
          // if playhead wraps, adjust target time accordingly
          vars.modifiers = { time: gsap.utils.wrap(0, tl.duration()) };
          time += tl.duration() * (index > curIndex ? 1 : -1);
        }
        curIndex = newIndex;
        vars.overwrite = true;
        return tl.tweenTo(time, vars);
      }

      // public navigation helpers to match vertical API
      tl.next = (vars) => toIndex(curIndex + 1, vars);
      tl.previous = (vars) => toIndex(curIndex - 1, vars);
      tl.current = () => curIndex;
      tl.toIndex = (index, vars) => toIndex(index, vars);
      tl.times = times;

      // expose refresh and cleanup, and attach ResizeObserver (no window resize listener)
      tl.refresh = refresh;
      if (typeof ResizeObserver === 'function') {
        internalResizeObserver = new ResizeObserver(() => _hScheduleRefresh());
        internalResizeObserver.observe(container);
      }
      tl.cleanup = () => {
        _hDisposed = true;
        if (internalResizeObserver) {
          internalResizeObserver.disconnect();
          internalResizeObserver = null;
        }
      };

      timeline = tl;
      return () => tl.cleanup();
    });
    return timeline;
  }

  /*
  This helper function makes a group of elements animate along the x-axis in a seamless, responsive loop.

  Features:
   - Uses yPercent so that even if the heights change (like if the window gets resized), it should still work in most cases.
   - When each item animates to the left or right enough, it will loop back to the other side
   - Optionally pass in a config object with values like draggable: true, center: true, speed (default: 1, which travels at roughly 100 pixels per second), paused (boolean), repeat, reversed, and paddingBottom.
   - The returned timeline will have the following methods added to it:
     - next() - animates to the next element using a timeline.tweenTo() which it returns. You can pass in a vars object to control duration, easing, etc.
     - previous() - animates to the previous element using a timeline.tweenTo() which it returns. You can pass in a vars object to control duration, easing, etc.
     - toIndex() - pass in a zero-based index value of the element that it should animate to, and optionally pass in a vars object to control duration, easing, etc. Always goes in the shortest direction
     - current() - returns the current index (if an animation is in-progress, it reflects the final index)
     - times - an Array of the times on the timeline where each element hits the "starting" spot.
   */
  function verticalLoop(items, config) {
    let timeline;
    items = gsap.utils.toArray(items);
    config = config || {};
    gsap.context(() => {
      // use a context so that if this is called from within another context or a gsap.matchMedia(), we can perform proper cleanup like the "resize" event handler on the window
      const onChange = config.onChange;
      let lastIndex = 0;
      const tl = gsap.timeline({
        repeat: config.repeat,
        onUpdate:
          onChange &&
          function () {
            const i = tl.closestIndex();
            if (lastIndex !== i) {
              lastIndex = i;
              onChange(items[i], i);
            }
          },
        paused: config.paused,
        defaults: { ease: 'none' },
        onReverseComplete: () => tl.totalTime(tl.rawTime() + tl.duration() * 100),
      });
      const length = items.length;
      let startY = items[0].offsetTop;
      const times = [];
      const heights = [];
      const spaceBefore = [];
      const yPercents = [];
      let curIndex = 0;
      let indexIsDirty = false;
      const center = config.center;
      const pixelsPerSecond = (config.speed || 1) * 100;
      const snap =
        config.snap === false ? (v) => v : gsap.utils.snap(config.snap || 1); // some browsers shift by a pixel to accommodate flex layouts, so for example if height is 20% the first element's height might be 242px, and the next 243px, alternating back and forth. So we snap to 5 percentage points to make things look more natural
      let timeOffset = 0;
      const container =
        center === true
          ? items[0].parentNode
          : gsap.utils.toArray(center)[0] || items[0].parentNode;
      let totalHeight;
      // Detect if the user explicitly provided paddingBottom so that auto-derivation
      // does not overwrite the author's intent on refresh.
      const userSpecifiedPaddingBottom =
        Object.prototype.hasOwnProperty.call(config, 'paddingBottom') &&
        !isNaN(parseFloat(config.paddingBottom));
      let _vDisposed = false;
      const getTotalHeight = () =>
        items[length - 1].offsetTop +
        (yPercents[length - 1] / 100) * heights[length - 1] -
        startY +
        // Align with horizontal approach: exclude initial top spacing from total height
        // so that seam spacing is controlled explicitly via paddingBottom
        items[length - 1].offsetHeight *
          gsap.getProperty(items[length - 1], 'scaleY') +
        (parseFloat(config.paddingBottom) || 0);
      const populateHeights = () => {
        // Recalculate the starting offset on each refresh to account for layout shifts
        // caused by text wrapping, font loading, or container reflow. This keeps loop points aligned.
        startY = items[0].offsetTop;
        let b1 = container.getBoundingClientRect();
        let b2;
        items.forEach((el, i) => {
          heights[i] = parseFloat(gsap.getProperty(el, 'height', 'px'));
          yPercents[i] = snap(
            (parseFloat(gsap.getProperty(el, 'y', 'px')) / heights[i]) * 100 +
              gsap.getProperty(el, 'yPercent')
          );
          b2 = el.getBoundingClientRect();
          spaceBefore[i] = b2.top - (i ? b1.bottom : b1.top);
          b1 = b2;
        });
        // Determine a seam gap from inter-item geometry (median of gaps), so the wrap includes
        // a stable visual spacing that matches layout. If the user did not explicitly provide
        // paddingBottom, always re-derive it on each refresh so breakpoint-driven CSS gap changes
        // are reflected immediately even when the container's height is unchanged.
        if (!userSpecifiedPaddingBottom) {
          const gaps = spaceBefore.slice(1);
          const numericGaps = gaps.filter(
            (gapValue) => typeof gapValue === 'number' && isFinite(gapValue)
          );
          if (numericGaps.length > 0) {
            const sorted = numericGaps.slice().sort((a, b) => a - b);
            const midpointIndex = Math.floor(sorted.length / 2);
            const median =
              sorted.length % 2 === 0
                ? (sorted[midpointIndex - 1] + sorted[midpointIndex]) / 2
                : sorted[midpointIndex];
            config.paddingBottom = median > 0 ? median : 0;
          } else {
            config.paddingBottom = 0;
          }
        }
        gsap.set(items, {
          // convert "y" to "yPercent" to make things responsive, and populate the heights/yPercents Arrays to make lookups faster.
          yPercent: (i) => yPercents[i],
        });
        totalHeight = getTotalHeight();
      };
      let timeWrap;
      const populateOffsets = () => {
        timeOffset = center
          ? (tl.duration() * (container.offsetHeight / 2)) / totalHeight
          : 0;
        center &&
          times.forEach((t, i) => {
            times[i] = timeWrap(
              tl.labels['label' + i] +
                (tl.duration() * heights[i]) / 2 / totalHeight -
                timeOffset
            );
          });
      };
      const getClosest = (values, value, wrap) => {
        let i = values.length;
        let closest = 1e10;
        let index = 0;
        let d;
        while (i--) {
          d = Math.abs(values[i] - value);
          if (d > wrap / 2) {
            d = wrap - d;
          }
          if (d < closest) {
            closest = d;
            index = i;
          }
        }
        return index;
      };
      const populateTimeline = () => {
        let i;
        let item;
        let curY;
        let distanceToStart;
        let distanceToLoop;
        tl.clear();
        for (i = 0; i < length; i++) {
          item = items[i];
          curY = (yPercents[i] / 100) * heights[i];
          distanceToStart = item.offsetTop + curY - startY + spaceBefore[0];
          distanceToLoop =
            distanceToStart + heights[i] * gsap.getProperty(item, 'scaleY');
          tl.to(
            item,
            {
              yPercent: snap(((curY - distanceToLoop) / heights[i]) * 100),
              duration: distanceToLoop / pixelsPerSecond,
            },
            0
          )
            .fromTo(
              item,
              {
                yPercent: snap(
                  ((curY - distanceToLoop + totalHeight) / heights[i]) * 100
                ),
              },
              {
                yPercent: yPercents[i],
                duration:
                  (curY - distanceToLoop + totalHeight - curY) / pixelsPerSecond,
                immediateRender: false,
              },
              distanceToLoop / pixelsPerSecond
            )
            .add('label' + i, distanceToStart / pixelsPerSecond);
          times[i] = distanceToStart / pixelsPerSecond;
        }
        timeWrap = gsap.utils.wrap(0, tl.duration());
      };
      const refresh = (deep) => {
        const progress = tl.progress();
        tl.progress(0, true);
        populateHeights();
        deep && populateTimeline();
        populateOffsets();
        deep && tl.draggable && tl.paused()
          ? tl.time(times[curIndex], true)
          : tl.progress(progress, true);
      };
      let _vRafId = null;
      const _vScheduleRefresh = () => {
        if (_vRafId !== null) {
          cancelAnimationFrame(_vRafId);
        }
        _vRafId = requestAnimationFrame(() => {
          _vRafId = null;
          // Check for direction change before refreshing
          if (config.onDirectionChange) {
            config.onDirectionChange();
            // Check again after direction change callback, which may have disposed this timeline
            if (_vDisposed) {
              _vRafId = null;
              return;
            }
          }
          refresh(true);
        });
      };
      let proxy;
      let internalResizeObserver;
      let _vWindowResizeHandler;
      gsap.set(items, { y: 0 });
      populateHeights();
      populateTimeline();
      populateOffsets();
      // Observe container box-size changes and refresh timeline metrics without rebuilding
      if (typeof ResizeObserver === 'function') {
        internalResizeObserver = new ResizeObserver(() => _vScheduleRefresh());
        internalResizeObserver.observe(container);
      }
      // Also listen to window resize so that breakpoint-driven CSS gap changes trigger a refresh
      // even when the container's own box size doesn't change.
      _vWindowResizeHandler = () => _vScheduleRefresh();
      window.addEventListener('resize', _vWindowResizeHandler, { passive: true });
      function toIndex(index, vars) {
        vars = vars || {};
        Math.abs(index - curIndex) > length / 2 &&
          (index += index > curIndex ? -length : length); // always go in the shortest direction
        const newIndex = gsap.utils.wrap(0, length, index);
        let time = times[newIndex];
        if (time > tl.time() !== index > curIndex && index !== curIndex) {
          // if we're wrapping the timeline's playhead, make the proper adjustments
          time += tl.duration() * (index > curIndex ? 1 : -1);
        }
        if (time < 0 || time > tl.duration()) {
          vars.modifiers = { time: timeWrap };
        }
        curIndex = newIndex;
        vars.overwrite = true;
        gsap.killTweensOf(proxy);
        return vars.duration === 0
          ? tl.time(timeWrap(time))
          : tl.tweenTo(time, vars);
      }
      tl.toIndex = (index, vars) => toIndex(index, vars);
      tl.closestIndex = (setCurrent) => {
        const index = getClosest(times, tl.time(), tl.duration());
        if (setCurrent) {
          curIndex = index;
          indexIsDirty = false;
        }
        return index;
      };
      tl.current = () => (indexIsDirty ? tl.closestIndex(true) : curIndex);
      tl.next = (vars) => toIndex(tl.current() + 1, vars);
      tl.previous = (vars) => toIndex(tl.current() - 1, vars);
      tl.times = times;
      tl.progress(1, true).progress(0, true); // pre-render for performance
      if (config.reversed) {
        tl.vars.onReverseComplete();
        tl.reverse();
      }
      if (config.draggable && typeof Draggable === 'function') {
        proxy = document.createElement('div');
        const wrap = gsap.utils.wrap(0, 1);
        let ratio;
        let startProgress;
        let draggable;
        let lastSnap;
        let initChangeY;
        let wasPlaying;
        const align = () =>
          tl.progress(
            wrap(startProgress + (draggable.startY - draggable.y) * ratio)
          );
        const syncIndex = () => tl.closestIndex(true);
        typeof InertiaPlugin === 'undefined' &&
          console.warn(
            'InertiaPlugin required for momentum-based scrolling and snapping. https://greensock.com/club'
          );
        draggable = Draggable.create(proxy, {
          trigger: items[0].parentNode,
          type: 'y',
          onPressInit() {
            const y = this.y;
            gsap.killTweensOf(tl);
            wasPlaying = !tl.paused();
            tl.pause();
            startProgress = tl.progress();
            refresh();
            ratio = 1 / totalHeight;
            initChangeY = startProgress / -ratio - y;
            gsap.set(proxy, { y: startProgress / -ratio });
          },
          onDrag: align,
          onThrowUpdate: align,
          overshootTolerance: 0,
          inertia: true,
          snap(value) {
            //note: if the user presses and releases in the middle of a throw, due to the sudden correction of proxy.x in the onPressInit(), the velocity could be very large, throwing off the snap. So sense that condition and adjust for it. We also need to set overshootTolerance to 0 to prevent the inertia from causing it to shoot past and come back
            if (Math.abs(startProgress / -ratio - this.y) < 10) {
              return lastSnap + initChangeY;
            }
            const time = -(value * ratio) * tl.duration();
            const wrappedTime = timeWrap(time);
            const snapTime = times[getClosest(times, wrappedTime, tl.duration())];
            let dif = snapTime - wrappedTime;
            Math.abs(dif) > tl.duration() / 2 &&
              (dif += dif < 0 ? tl.duration() : -tl.duration());
            lastSnap = (time + dif) / tl.duration() / -ratio;
            return lastSnap;
          },
          onRelease() {
            syncIndex();
            draggable.isThrowing && (indexIsDirty = true);
          },
          onThrowComplete: () => {
            syncIndex();
            wasPlaying && tl.play();
          },
        })[0];
        tl.draggable = draggable;
      }
      tl.closestIndex(true);
      lastIndex = curIndex;
      onChange && onChange(items[curIndex], curIndex);
      // expose refresh and cleanup hooks for external consumers
      tl.refresh = refresh;
      tl.cleanup = () => {
        _vDisposed = true;
        if (internalResizeObserver) {
          internalResizeObserver.disconnect();
          internalResizeObserver = null;
        }
        if (_vWindowResizeHandler) {
          window.removeEventListener('resize', _vWindowResizeHandler);
          _vWindowResizeHandler = null;
        }
      };
      timeline = tl;
      return () => tl.cleanup(); // cleanup
    });
    return timeline;
  }

  // Computes median spacing between consecutive items for seamless loop padding
  function computeMedianGap(containerElement, itemElements, isVertical) {
    if (!containerElement || !Array.isArray(itemElements) || itemElements.length < 2) {
      return 0;
    }

    const itemRects = itemElements.map((element) => element.getBoundingClientRect());

    const spacings = [];
    for (let itemIndex = 0; itemIndex < itemRects.length - 1; itemIndex++) {
      const current = itemRects[itemIndex];
      const next = itemRects[itemIndex + 1];

      const spacing = isVertical
        ? next.top - current.bottom
        : next.left - current.right;

      spacings.push(spacing);
    }

    const filtered = spacings.filter((value) => isFinite(value));
    if (filtered.length === 0) {
      return 0;
    }

    filtered.sort((a, b) => a - b);
    const count = filtered.length;
    const median = count % 2 === 1
      ? filtered[(count - 1) / 2]
      : (filtered[count / 2 - 1] + filtered[count / 2]) / 2;

    return Math.max(0, Math.round(median * 1000) / 1000);
  }

  // Creates a new GSAP timeline for the marquee animation
  function buildTimeline(instance) {
    try {
      cleanupPreviousTimeline(instance);

      const allItems = instance.findMarqueeItems();

      if (allItems.length === 0) {
        console.warn('Marquee: No items to animate');
        return;
      }

      const isVertical = instance.coreConfig.direction === 'vertical';

      applyStyles(allItems);
      resetTransforms(allItems);

      const originalItems = Array.from(
        instance.container.querySelectorAll(
          `[${CONFIG.core.attributes.item}="true"]:not([aria-hidden="true"])`
        )
      );

      const itemsForGap = originalItems.length > 1 ? originalItems : allItems;
      const medianGap = computeMedianGap(
        instance.container,
        itemsForGap,
        isVertical
      );

      const loopConfig = {
        speed: instance.coreConfig.speed,
        repeat: instance.coreConfig.repeat,
        paused: instance.coreConfig.paused,
        reversed: instance.coreConfig.reversed,
        ...(isVertical
          ? { paddingBottom: medianGap }
          : { paddingRight: medianGap }),
        onDirectionChange: () => {
          if (instance.checkDirectionChange()) {
            instance.refreshDirection();
          }
        },
      };

      instance.timeline = isVertical
        ? verticalLoop(allItems, loopConfig)
        : horizontalLoop(allItems, loopConfig);
    } catch (error) {
      console.error('Marquee: Failed to build timeline', error);
    }
  }

  // Rebuilds the timeline while optionally preserving playback position and state
  function rebuildTimeline(instance, preserveState = true) {
    const previousTimeline = instance.timeline;
    const wasPaused = previousTimeline
      ? previousTimeline.paused()
      : !instance.coreConfig?.paused;
    const previousTime = previousTimeline ? previousTimeline.time() : 0;
    const previousScale = previousTimeline ? previousTimeline.timeScale() : 1;

    cleanupPreviousTimeline(instance);

    const allItems = instance.findMarqueeItems();
    applyStyles(allItems);
    resetTransforms(allItems);

    const isVertical = instance.coreConfig.direction === 'vertical';
    const originalItems = Array.from(
      instance.container.querySelectorAll(
        `[${CONFIG.core.attributes.item}="true"]:not([aria-hidden="true"])`
      )
    );

    const itemsForGap = originalItems.length > 1 ? originalItems : allItems;
    const medianGap = computeMedianGap(
      instance.container,
      itemsForGap,
      isVertical
    );

    const loopConfig = {
      speed: instance.coreConfig.speed,
      repeat: instance.coreConfig.repeat,
      paused: instance.coreConfig.paused,
      reversed: instance.coreConfig.reversed,
      ...(isVertical
        ? { paddingBottom: medianGap }
        : { paddingRight: medianGap }),
      onDirectionChange: () => {
        if (instance.checkDirectionChange()) {
          instance.refreshDirection();
        }
      },
    };

    instance.timeline = isVertical
      ? verticalLoop(allItems, loopConfig)
      : horizontalLoop(allItems, loopConfig);

    if (preserveState) {
      const newDuration = instance.timeline.duration();
      const safeDuration = newDuration > 0 ? newDuration : 0;
      const wrappedTime = safeDuration
        ? ((previousTime % safeDuration) + safeDuration) % safeDuration
        : 0;

      instance.timeline.time(wrappedTime, true);
      instance.timeline.timeScale(previousScale);

      if (!wasPaused) {
        // Preserve reversed state when resuming playback
        // Check if the marquee should be reversed based on coreConfig
        if (instance.coreConfig.reversed) {
          instance.timeline.reverse();
        } else {
          instance.timeline.play();
        }
      } else {
        instance.timeline.pause();
      }
    }
  }

  // Kills and removes the previous timeline if it exists
  function cleanupPreviousTimeline(instance) {
    if (instance.timeline) {
      if (typeof instance.timeline.cleanup === 'function') {
        try {
          instance.timeline.cleanup();
          // eslint-disable-next-line no-unused-vars
        } catch (_e) {}
      }
      instance.timeline.kill();
      instance.timeline = null;
    }
  }

  // Applies performance and layout styles to marquee items
  function applyStyles(items) {
    items.forEach((item) => {
      item.style.flexShrink = '0';
      item.style.willChange = 'transform';
    });
  }

  // Resets all GSAP transform properties to prevent accumulation between rebuilds
  function resetTransforms(items) {
    if (window.gsap) {
      window.gsap.set(items, {
        x: 0,
        y: 0,
        xPercent: 0,
        yPercent: 0,
      });
    }
  }

  // Attaches hover event listeners to container or individual items based on settings
  function attachHoverHandlers(instance, settings) {
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

  // IntersectionObserver feature for controlling marquee playback based on visibility.
  // Only plays the marquee when it's in the viewport to improve performance.

  /**
   * Sets up IntersectionObserver to control marquee playback based on visibility.
   * @param {MarqueeInstance} instance - The marquee instance to observe
   * @param {Object} config - Observer configuration with threshold and rootMargin
   */
  function setupIntersectionObserver(instance, config) {
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
            // Use reverse() or play() based on the marquee's configured direction
            // timeline.play() resets to forward, timeline.reverse() resumes in reverse
            if (instance.coreConfig.reversed) {
              instance.timeline.reverse();
            } else {
              instance.timeline.play();
            }
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

  /**
   * Manages a single marquee instance with timeline, cloning, and interaction handlers.
   */
  class MarqueeInstance {
    constructor(container, options = {}) {
      if (!container || !(container instanceof window.Element)) {
        throw new Error('Marquee: container must be a valid DOM element');
      }

      if (!window.gsap) {
        console.error(
          'Marquee: GSAP is required but not found.\n' +
          'Load GSAP before the marquee library:\n' +
          '<script src="https://cdn.jsdelivr.net/npm/gsap@3/dist/gsap.min.js"></script>'
        );
        return;
      }

      this.container = container;
      this.timeline = null;
      this.eventListeners = [];
      this.isHovering = false;
      this.wasPausedByEffect = false;
      this.pauseRampTimeline = null;
      this.baseTimeScale = 1;
      this.currentDirection = null;
      this.intersectionObserver = null;

      try {
        this.coreConfig = parseCoreConfig(container, options.core);
        this.cloningConfig = parseCloningConfig(container, options.cloning);
        this.interactionConfig = parseInteractionConfig(container, options.interaction);
        this.observerConfig = parseObserverConfig(container, options.observers);
      } catch (error) {
        console.error('Marquee: Failed to parse configuration', error);
        return;
      }

      this.initialize();
    }

    // Sets up container, clones items, builds timeline, and attaches interaction handlers
    initialize() {
      try {
        const originalItems = this.getOriginalItems();

        if (originalItems.length === 0) {
          console.warn(
            'Marquee: No items found with data-marquee-item="true".\n' +
            'Add the attribute to child elements:\n' +
            '<div data-marquee-item="true">Item content</div>',
            this.container
          );
          return;
        }

        this.validateContainerStyles();
        this.applyContainerStyles();
        const isVertical = this.coreConfig.direction === 'vertical';
        cloneItems(this.container, originalItems, this.cloningConfig, isVertical);

        // If intersection observer is enabled, start timeline paused
        if (this.observerConfig.intersection) {
          this.coreConfig.paused = true;
        }

        buildTimeline(this);

        if (!this.timeline) {
          console.error(
            'Marquee: Failed to create timeline. Possible causes:\n' +
            '- Items are hidden (display: none)\n' +
            '- Items have zero width/height\n' +
            '- Invalid CSS on container or items',
            this.container
          );
          return;
        }

        this.baseTimeScale = this.timeline.timeScale();

        // Apply reduced motion before setting up observer
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          this.timeline.timeScale(this.timeline.timeScale() * 0.1);
        }

        // Setup intersection observer after timeline is built
        if (this.observerConfig.intersection && this.timeline) {
          setupIntersectionObserver(this, this.observerConfig);
        }

        if (this.interactionConfig?.effectType) {
          attachHoverHandlers(this, this.interactionConfig);
        }

        // Store initial direction for change detection
        this.currentDirection = this.coreConfig.direction;
      } catch (error) {
        console.error('Marquee: Initialization failed', error, this.container);
      }
    }

    // Checks if CSS direction has changed and returns true if different
    checkDirectionChange() {
      const computedStyle = window.getComputedStyle(this.container);
      const flexDirection = computedStyle.flexDirection;
      const isVertical = flexDirection === 'column' || flexDirection === 'column-reverse';
      const newDirection = isVertical ? 'vertical' : 'horizontal';

      return newDirection !== this.currentDirection;
    }

    // Manually refresh direction and rebuild if changed
    refreshDirection() {
      if (this.checkDirectionChange()) {
        const computedStyle = window.getComputedStyle(this.container);
        const flexDirection = computedStyle.flexDirection;
        const isVertical = flexDirection === 'column' || flexDirection === 'column-reverse';
        const newDirection = isVertical ? 'vertical' : 'horizontal';

        this.currentDirection = newDirection;
        this.coreConfig.direction = newDirection;
        this.rebuild(true);
      }
    }

    // Validates container CSS and warns about missing required styles
    validateContainerStyles() {
      if (this.container.hasAttribute(CONFIG.internalFlags.attributes.stylesValidated)) {
        return;
      }

      const computed = window.getComputedStyle(this.container);

      if (computed.display !== 'flex' && computed.display !== 'inline-flex') {
        console.warn('Marquee: Container should have display: flex. Add it to your CSS or let the library apply it.', this.container);
      }

      if (computed.overflow !== 'hidden') {
        console.warn('Marquee: Container should have overflow: hidden. Add it to your CSS or let the library apply it.', this.container);
      }

      // Mark as validated to avoid repeated warnings
      this.container.setAttribute(CONFIG.internalFlags.attributes.stylesValidated, 'true');
    }

    // Applies flex layout and overflow styles only if not already set
    applyContainerStyles() {
      const computed = window.getComputedStyle(this.container);

      if (computed.display !== 'flex' && computed.display !== 'inline-flex') {
        this.container.style.display = 'flex';
      }

      if (computed.overflow !== 'hidden') {
        this.container.style.overflow = 'hidden';
      }

      // Don't force flex-direction - it's read from CSS in parseDirection
    }

    // Returns only non-cloned marquee items
    getOriginalItems() {
      return Array.from(
        this.container.querySelectorAll(
          `[${CONFIG.core.attributes.item}="true"]:not([aria-hidden="true"])`
        )
      );
    }

    // Returns all marquee items including clones
    findMarqueeItems() {
      return Array.from(
        this.container.querySelectorAll(`[${CONFIG.core.attributes.item}="true"]`)
      );
    }

    // Removes old clones, recreates them, and rebuilds timeline with optional state preservation
    rebuild(preserveState = true) {
      if (this.pauseRampTimeline) {
        this.pauseRampTimeline.kill();
        this.pauseRampTimeline = null;
      }

      this.wasPausedByEffect = false;
      this.isHovering = false;

      removeClones(this.container);
      const originalItems = this.getOriginalItems();
      const isVertical = this.coreConfig.direction === 'vertical';
      cloneItems(this.container, originalItems, this.cloningConfig, isVertical);
      rebuildTimeline(this, preserveState);

      this.baseTimeScale = this.timeline ? this.timeline.timeScale() : 1;

      // Re-setup intersection observer if it was enabled
      if (this.observerConfig.intersection && this.timeline) {
        if (this.intersectionObserver) {
          this.intersectionObserver.disconnect();
        }
        setupIntersectionObserver(this, this.observerConfig);
      }
    }

    // Resumes the marquee animation
    play() {
      if (this.timeline) {
        this.timeline.play();
      }
    }

    // Pauses the marquee animation
    pause() {
      if (this.timeline) {
        this.timeline.pause();
      }
    }

    // Cleans up all event listeners, timelines, and cloned elements
    destroy() {
      this.eventListeners.forEach(({ type, handler, target }) => {
        target.removeEventListener(type, handler);
      });
      this.eventListeners = [];

      if (this.pauseRampTimeline) {
        this.pauseRampTimeline.kill();
        this.pauseRampTimeline = null;
      }

      // Cleanup intersection observer
      if (this.intersectionObserver) {
        this.intersectionObserver.disconnect();
        this.intersectionObserver = null;
      }

      if (this.timeline) {
        if (typeof this.timeline.cleanup === 'function') {
          try {
            this.timeline.cleanup();
          // eslint-disable-next-line no-unused-vars
          } catch (_e) {}
        }
        this.timeline.kill();
        this.timeline = null;
      }

      removeClones(this.container);
    }
  }

  const instances = new WeakMap();

  const MarqueeAPI = {
    // Initializes marquee instances for all matching containers
    init(selector = null, options = {}) {
      try {
        const containerSelector = selector || `[${CONFIG.core.attributes.container}]`;
        const containers = document.querySelectorAll(containerSelector);

        if (containers.length === 0) {
          console.warn(
            'Marquee: No containers found with selector: ' + containerSelector + '\n' +
            'Ensure containers have data-marquee="true":\n' +
            '<div data-marquee="true">...</div>'
          );
          return this;
        }

        containers.forEach((container) => {
          if (!instances.has(container)) {
            try {
              const instance = new MarqueeInstance(container, options);
              if (instance.timeline) {
                instances.set(container, instance);
              }
            } catch (error) {
              console.error('Marquee: Failed to create instance', error, container);
            }
          }
        });

        return this;
      } catch (error) {
        console.error('Marquee: Initialization failed', error);
        return this;
      }
    },

    // Returns the marquee instance for a given container element
    get(element) {
      return instances.get(element) || null;
    },

    // Destroys a single marquee instance and removes it from the registry
    destroy(element) {
      try {
        const instance = instances.get(element);
        if (instance) {
          instance.destroy();
          instances.delete(element);
        }
      } catch (error) {
        console.error('Marquee: Failed to destroy instance', error, element);
      }
    },

    // Destroys all marquee instances matching the selector
    destroyAll(selector = null) {
      const containerSelector = selector || `[${CONFIG.core.attributes.container}]`;
      const containers = document.querySelectorAll(containerSelector);

      containers.forEach((container) => {
        this.destroy(container);
      });

      return this;
    },

    // Returns all marquee instances matching the selector
    getAll(selector = null) {
      const containerSelector = selector || `[${CONFIG.core.attributes.container}]`;
      const containers = document.querySelectorAll(containerSelector);
      const instancesList = [];

      containers.forEach((container) => {
        const instance = instances.get(container);
        if (instance) {
          instancesList.push(instance);
        }
      });

      return instancesList;
    },

    // Checks if an element has an initialized marquee instance
    has(element) {
      return instances.has(element);
    },

    // Pauses all marquee instances matching the selector
    pauseAll(selector = null) {
      const containerSelector = selector || `[${CONFIG.core.attributes.container}]`;
      const containers = document.querySelectorAll(containerSelector);

      containers.forEach((container) => {
        const instance = instances.get(container);
        if (instance) {
          instance.pause();
        }
      });

      return this;
    },

    // Plays all marquee instances matching the selector
    playAll(selector = null) {
      const containerSelector = selector || `[${CONFIG.core.attributes.container}]`;
      const containers = document.querySelectorAll(containerSelector);

      containers.forEach((container) => {
        const instance = instances.get(container);
        if (instance) {
          instance.play();
        }
      });

      return this;
    },

    // Manually refreshes direction for a single marquee instance
    refresh(element) {
      const instance = instances.get(element);
      if (instance) {
        instance.refreshDirection();
      }
      return this;
    },

    // Manually refreshes direction for all marquee instances matching the selector
    refreshAll(selector = null) {
      const containerSelector = selector || `[${CONFIG.core.attributes.container}]`;
      const containers = document.querySelectorAll(containerSelector);

      containers.forEach((container) => {
        const instance = instances.get(container);
        if (instance) {
          instance.refreshDirection();
        }
      });

      return this;
    },
  };

  // Auto-initialize marquees when DOM is ready
  if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => MarqueeAPI.init());
    } else {
      MarqueeAPI.init();
    }
  }

  // Expose public API
  window.Marquee = MarqueeAPI;

})();
