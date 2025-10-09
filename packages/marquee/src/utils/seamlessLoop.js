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
    let tl = gsap.timeline({
        repeat: config.repeat,
        paused: config.paused,
        defaults: { ease: 'none' },
        onReverseComplete: () =>
          tl.totalTime(tl.rawTime() + tl.duration() * 100),
      }),
      length = items.length,
      startX = items[0].offsetLeft,
      times = [],
      widths = [],
      // MODIFIED FROM ORIGINAL: track horizontal space before each item using geometry
      spaceBeforeX = [],
      xPercents = [],
      curIndex = 0,
      pixelsPerSecond = (config.speed || 1) * 100,
      snap =
        config.snap === false ? (v) => v : gsap.utils.snap(config.snap || 1),
      totalWidth,
      container = items[0].parentNode,
      internalResizeObserver;

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

    // rAF-coalesced refresh for ResizeObserver events
    let _hPending = false;
    const _hScheduleRefresh = () => {
      if (_hPending) return;
      _hPending = true;
      requestAnimationFrame(() => {
        _hPending = false;
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
      let newIndex = gsap.utils.wrap(0, length, index),
        time = times[newIndex];
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
      if (internalResizeObserver) {
        try {
          internalResizeObserver.disconnect();
        } catch (e) {}
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
    let onChange = config.onChange,
      lastIndex = 0,
      tl = gsap.timeline({
        repeat: config.repeat,
        onUpdate:
          onChange &&
          function () {
            let i = tl.closestIndex();
            if (lastIndex !== i) {
              lastIndex = i;
              onChange(items[i], i);
            }
          },
        paused: config.paused,
        defaults: { ease: 'none' },
        onReverseComplete: () =>
          tl.totalTime(tl.rawTime() + tl.duration() * 100),
      }),
      length = items.length,
      startY = items[0].offsetTop,
      times = [],
      heights = [],
      spaceBefore = [],
      yPercents = [],
      curIndex = 0,
      indexIsDirty = false,
      center = config.center,
      pixelsPerSecond = (config.speed || 1) * 100,
      snap =
        config.snap === false ? (v) => v : gsap.utils.snap(config.snap || 1), // some browsers shift by a pixel to accommodate flex layouts, so for example if height is 20% the first element's height might be 242px, and the next 243px, alternating back and forth. So we snap to 5 percentage points to make things look more natural
      timeOffset = 0,
      container =
        center === true
          ? items[0].parentNode
          : gsap.utils.toArray(center)[0] || items[0].parentNode,
      totalHeight,
      getTotalHeight = () =>
        items[length - 1].offsetTop +
        (yPercents[length - 1] / 100) * heights[length - 1] -
        startY +
        // Align with horizontal approach: exclude initial top spacing from total height
        // so that seam spacing is controlled explicitly via paddingBottom
        items[length - 1].offsetHeight *
          gsap.getProperty(items[length - 1], 'scaleY') +
        (parseFloat(config.paddingBottom) || 0),
      populateHeights = () => {
        // Recalculate the starting offset on each refresh to account for layout shifts
        // caused by text wrapping, font loading, or container reflow. This keeps loop points aligned.
        startY = items[0].offsetTop;
        let b1 = container.getBoundingClientRect(),
          b2;
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
        // a stable visual spacing that matches layout. Only set if user didn't provide paddingBottom.
        if (
          config.paddingBottom == null ||
          isNaN(parseFloat(config.paddingBottom))
        ) {
          const gaps = spaceBefore.slice(1); // gaps between consecutive items
          const positiveGaps = gaps.filter(
            (g) => typeof g === 'number' && isFinite(g)
          );
          if (positiveGaps.length > 0) {
            const sorted = positiveGaps.slice().sort((a, b) => a - b);
            const mid = Math.floor(sorted.length / 2);
            const median =
              sorted.length % 2 === 0
                ? (sorted[mid - 1] + sorted[mid]) / 2
                : sorted[mid];
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
      },
      timeWrap,
      populateOffsets = () => {
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
      },
      getClosest = (values, value, wrap) => {
        let i = values.length,
          closest = 1e10,
          index = 0,
          d;
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
      },
      populateTimeline = () => {
        let i, item, curY, distanceToStart, distanceToLoop;
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
                  (curY - distanceToLoop + totalHeight - curY) /
                  pixelsPerSecond,
                immediateRender: false,
              },
              distanceToLoop / pixelsPerSecond
            )
            .add('label' + i, distanceToStart / pixelsPerSecond);
          times[i] = distanceToStart / pixelsPerSecond;
        }
        timeWrap = gsap.utils.wrap(0, tl.duration());
      },
      refresh = (deep) => {
        let progress = tl.progress();
        tl.progress(0, true);
        populateHeights();
        deep && populateTimeline();
        populateOffsets();
        deep && tl.draggable && tl.paused()
          ? tl.time(times[curIndex], true)
          : tl.progress(progress, true);
      },
      // rAF-coalesced refresh for ResizeObserver events
      _vPending = false,
      _vScheduleRefresh = () => {
        if (_vPending) return;
        _vPending = true;
        requestAnimationFrame(() => {
          _vPending = false;
          refresh(true);
        });
      },
      proxy,
      internalResizeObserver;
    gsap.set(items, { y: 0 });
    populateHeights();
    populateTimeline();
    populateOffsets();
    // Observe container box-size changes and refresh timeline metrics without rebuilding
    if (typeof ResizeObserver === 'function') {
      internalResizeObserver = new ResizeObserver(() => _vScheduleRefresh());
      internalResizeObserver.observe(container);
    }
    function toIndex(index, vars) {
      vars = vars || {};
      Math.abs(index - curIndex) > length / 2 &&
        (index += index > curIndex ? -length : length); // always go in the shortest direction
      let newIndex = gsap.utils.wrap(0, length, index),
        time = times[newIndex];
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
      let index = getClosest(times, tl.time(), tl.duration());
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
      let wrap = gsap.utils.wrap(0, 1),
        ratio,
        startProgress,
        draggable,
        dragSnap,
        lastSnap,
        initChangeY,
        wasPlaying,
        align = () =>
          tl.progress(
            wrap(startProgress + (draggable.startY - draggable.y) * ratio)
          ),
        syncIndex = () => tl.closestIndex(true);
      typeof InertiaPlugin === 'undefined' &&
        console.warn(
          'InertiaPlugin required for momentum-based scrolling and snapping. https://greensock.com/club'
        );
      draggable = Draggable.create(proxy, {
        trigger: items[0].parentNode,
        type: 'y',
        onPressInit() {
          let y = this.y;
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
          let time = -(value * ratio) * tl.duration(),
            wrappedTime = timeWrap(time),
            snapTime = times[getClosest(times, wrappedTime, tl.duration())],
            dif = snapTime - wrappedTime;
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
      if (internalResizeObserver) {
        try {
          internalResizeObserver.disconnect();
        } catch (e) {}
        internalResizeObserver = null;
      }
    };
    timeline = tl;
    return () => tl.cleanup(); // cleanup
  });
  return timeline;
}
// Export functions for ES6 module usage
export { horizontalLoop, verticalLoop };
