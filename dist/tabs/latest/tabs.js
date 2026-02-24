/*!
 * Tabs v1.0.0-beta
 * An accessible, keyboard-navigable tabs component with autoplay support.
 *
 * A part of Divs by Idreezus, a component library
 * divs.idreezus.com
 *
 * (c) 2026 Idrees Isse (https://github.com/idreezus)
 * Released under AGPL-3.0
 */

var Tabs = (function (exports) {
  'use strict';

  // Configuration constants for the tabs library
  // Builds a presence-based selector with opt-out support
  const sel = (attr)=>`[${attr}]:not([${attr}="false"])`;
  // Raw attribute names for marker (presence-based) elements
  const selectorAttrs = {
      container: 'data-tabs-container',
      list: 'data-tabs-list',
      playPauseBtn: 'data-tabs-play-pause'
  };
  // DOM query selectors (marker attrs auto-derived, value attrs manual)
  const selectors = {
      ...Object.fromEntries(Object.entries(selectorAttrs).map(([k, v])=>[
              k,
              sel(v)
          ])),
      trigger: '[data-tabs-trigger-id]',
      panel: '[data-tabs-panel-id]'
  };
  // Attribute names for configuration
  const attributes = {
      // Container configuration
      groupName: 'data-tabs-url-param',
      default: 'data-tabs-default',
      id: 'data-tabs-id',
      // Content linking
      triggerId: 'data-tabs-trigger-id',
      panelId: 'data-tabs-panel-id',
      // Autoplay configuration
      autoplay: 'data-tabs-autoplay',
      autoplayDuration: 'data-tabs-autoplay-duration',
      autoplayPauseHover: 'data-tabs-pause-hover',
      autoplayPauseFocus: 'data-tabs-pause-focus'
  };
  // CSS classes applied to elements
  const classes = {
      // State classes
      active: 'tabs-active',
      transitioning: 'tabs-transitioning',
      // Panel transition classes
      panelEntering: 'tabs-panel-entering',
      panelLeaving: 'tabs-panel-leaving',
      // Scroll position state classes
      atStart: 'tabs-at-start',
      atEnd: 'tabs-at-end',
      // Autoplay state classes
      playing: 'tabs-playing'
  };
  // CSS custom properties
  const cssProps = {
      progress: '--tabs-progress',
      tabCount: '--tabs-count',
      tabIndex: '--tabs-index',
      activeIndex: '--tabs-active-index',
      autoplayDuration: '--tabs-autoplay-duration',
      direction: '--tabs-direction'
  };
  // Default configuration values
  const defaults = {
      autoplayDuration: 5000,
      transitionDuration: 200
  };
  // Event names for CustomEvents
  const events = {
      change: 'change',
      autoplayStart: 'autoplay-start',
      autoplayStop: 'autoplay-stop'
  };

  // Shared utility functions for the tabs library
  // Emits DOM CustomEvent on the container element
  function emit(instance, eventName, data = {}) {
      const { container } = instance;
      const customEvent = new CustomEvent(`tabs:${eventName}`, {
          detail: {
              tabs: instance,
              ...data
          },
          bubbles: true
      });
      container.dispatchEvent(customEvent);
  }
  // Normalizes a value string to lowercase, hyphenated format
  function normalizeValue(value) {
      if (!value) return '';
      return value.toLowerCase().replace(/\s+/g, '-');
  }
  let idCounter = 0;
  // Generates a unique ID for each tabs instance
  function generateUniqueId() {
      idCounter += 1;
      return `tabs-${idCounter}`;
  }
  // Checks if user prefers reduced motion
  function prefersReducedMotion() {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  // Reads URL parameter for a given key
  function getUrlParam(key) {
      if (!key) return null;
      const params = new URLSearchParams(window.location.search);
      return params.get(key);
  }
  // Updates URL parameter using replaceState
  function setUrlParam(key, value) {
      if (!key) return;
      const url = new URL(window.location.href);
      url.searchParams.set(key, value);
      window.history.replaceState({}, '', url.toString());
  }
  // Detects layout orientation from flex-direction
  function detectOrientation(el) {
      const dir = getComputedStyle(el).flexDirection;
      return dir === 'column' || dir === 'column-reverse' ? 'vertical' : 'horizontal';
  }
  // Detects text direction from computed style
  function detectDirection(el) {
      return getComputedStyle(el).direction === 'rtl' ? 'rtl' : 'ltr';
  }

  // Autoplay behavior for tabs: timer, progress updates, pause/resume
  // Shared RAF tick loop for autoplay progress
  function runAutoplayTick(instance) {
      const { state, config, triggerMap } = instance;
      const autoplay = instance.autoplay;
      if (!state.isAutoplaying || state.isPaused) return;
      const elapsed = performance.now() - state.autoplayStartTime;
      const progress = Math.min(elapsed / config.autoplayDuration, 1);
      // Update --tabs-progress on active trigger(s)
      const activeTriggers = triggerMap.get(state.activeValue);
      if (activeTriggers) {
          activeTriggers.forEach((trigger)=>{
              trigger.style.setProperty(cssProps.progress, progress.toString());
          });
      }
      if (progress >= 1) {
          const prevValue = state.activeValue;
          autoplay.advanceFn(instance);
          if (state.activeValue === prevValue) {
              stopAutoplay(instance, 'complete');
              return;
          }
          state.autoplayStartTime = performance.now();
      }
      autoplay.rafId = requestAnimationFrame(()=>runAutoplayTick(instance));
  }
  // Sets up autoplay with IntersectionObserver and pause handlers
  function setupAutoplay(instance, advanceFn) {
      const { container, config } = instance;
      instance.autoplay = {
          rafId: null,
          observer: null,
          advanceFn,
          isVisible: true,
          pausedByHover: false,
          pausedByFocus: false
      };
      // IntersectionObserver to pause when out of viewport
      instance.autoplay.observer = new IntersectionObserver((entries)=>{
          entries.forEach((entry)=>{
              instance.autoplay.isVisible = entry.isIntersecting;
              if (!entry.isIntersecting) {
                  pauseAutoplay(instance, 'visibility');
              } else if (canResume(instance)) {
                  resumeAutoplay(instance);
              }
          });
      }, {
          threshold: 0.5
      });
      instance.autoplay.observer.observe(container);
      // Hover pause handlers
      if (config.autoplayPauseHover) {
          instance.autoplay.handleMouseEnter = ()=>{
              instance.autoplay.pausedByHover = true;
              pauseAutoplay(instance, 'hover');
          };
          instance.autoplay.handleMouseLeave = ()=>{
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
          instance.autoplay.handleFocusIn = ()=>{
              instance.autoplay.pausedByFocus = true;
              pauseAutoplay(instance, 'focus');
          };
          instance.autoplay.handleFocusOut = (e)=>{
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
      const autoplay = instance.autoplay;
      const { state } = instance;
      return state.isAutoplaying && autoplay.isVisible && !autoplay.pausedByHover && !autoplay.pausedByFocus;
  }
  // Starts autoplay timer with RAF progress updates
  function startAutoplay(instance) {
      const { container, state } = instance;
      state.isAutoplaying = true;
      state.isPaused = false;
      state.autoplayStartTime = performance.now();
      container.classList.add(classes.playing);
      // Update play/pause button
      if (instance.playPauseBtn) {
          instance.playPauseBtn.setAttribute('aria-pressed', 'true');
      }
      emit(instance, events.autoplayStart, {
          value: state.activeValue
      });
      instance.autoplay.rafId = requestAnimationFrame(()=>runAutoplayTick(instance));
  }
  // Pauses autoplay temporarily (hover, focus, visibility)
  function pauseAutoplay(instance, reason = 'user') {
      const { state, container } = instance;
      if (!state.isAutoplaying || state.isPaused) return;
      state.isPaused = true;
      // Cancel RAF
      if (instance.autoplay.rafId) {
          cancelAnimationFrame(instance.autoplay.rafId);
          instance.autoplay.rafId = null;
      }
      container.classList.remove(classes.playing);
      // Update play/pause button
      if (instance.playPauseBtn) {
          instance.playPauseBtn.setAttribute('aria-pressed', 'false');
      }
      // Store elapsed time and active tab so we can resume from this point
      const elapsed = performance.now() - state.autoplayStartTime;
      state.autoplayElapsed = elapsed;
      state.autoplayPausedOnValue = state.activeValue;
      const progress = Math.min(elapsed / instance.config.autoplayDuration, 1);
      emit(instance, events.autoplayStop, {
          value: state.activeValue,
          progress,
          reason
      });
  }
  // Resumes autoplay from where it was paused
  function resumeAutoplay(instance) {
      const { state, container } = instance;
      if (!state.isAutoplaying || !state.isPaused) return;
      if (!canResume(instance)) return;
      state.isPaused = false;
      // Resume from stored elapsed time only if still on the same tab, otherwise reset
      const sameTab = state.autoplayPausedOnValue === state.activeValue;
      state.autoplayStartTime = sameTab ? performance.now() - (state.autoplayElapsed || 0) : performance.now();
      container.classList.add(classes.playing);
      // Update play/pause button
      if (instance.playPauseBtn) {
          instance.playPauseBtn.setAttribute('aria-pressed', 'true');
      }
      emit(instance, events.autoplayStart, {
          value: state.activeValue
      });
      instance.autoplay.rafId = requestAnimationFrame(()=>runAutoplayTick(instance));
  }
  // Stops autoplay completely
  function stopAutoplay(instance, reason = 'user') {
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
      container.classList.remove(classes.playing);
      // Update play/pause button
      if (instance.playPauseBtn) {
          instance.playPauseBtn.setAttribute('aria-pressed', 'false');
      }
      emit(instance, events.autoplayStop, {
          value: state.activeValue,
          progress,
          reason
      });
      // Reset progress on all triggers
      instance.triggers.forEach((trigger)=>{
          trigger.style.setProperty(cssProps.progress, '0');
      });
  }
  // Cleans up autoplay listeners and observer
  function cleanupAutoplay(instance) {
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

  // Core tabs library with Tabs class and initialization logic
  // Finds the index of a trigger by its normalized value
  function findTriggerIndex(triggers, targetValue) {
      return triggers.findIndex((trigger)=>trigger._tabValue === targetValue);
  }
  // Parses configuration from data attributes on the container
  function parseConfig(container) {
      return {
          groupName: container.getAttribute(attributes.groupName) || null,
          defaultValue: container.getAttribute(attributes.default) || null,
          autoplay: container.getAttribute(attributes.autoplay) === 'true',
          autoplayDuration: parseInt(container.getAttribute(attributes.autoplayDuration) || '', 10) || defaults.autoplayDuration,
          autoplayPauseHover: container.getAttribute(attributes.autoplayPauseHover) === 'true',
          autoplayPauseFocus: container.getAttribute(attributes.autoplayPauseFocus) !== 'false'
      };
  }
  // Detects orientation and direction from CSS layout of the tablist
  function detectLayout(instance) {
      const { tablist, state } = instance;
      state.orientation = detectOrientation(tablist);
      state.direction = detectDirection(tablist);
      tablist.setAttribute('aria-orientation', state.orientation);
  }
  // Finds and validates all elements within the tabs container
  function findElements(instance) {
      const { container, id } = instance;
      // Scope to this container to support nested tabs
      const scopedQuery = (selector)=>{
          return [
              ...container.querySelectorAll(selector)
          ].filter((el)=>{
              return el.closest(selectors.container) === container;
          });
      };
      // Find tablist
      const tablist = container.querySelector(selectors.list);
      if (!tablist) {
          console.error(`Tabs ${id}: No tablist found. Expected an element with [data-tabs-list].`);
          return false;
      }
      // Find triggers and panels
      const triggers = scopedQuery(selectors.trigger);
      const panels = scopedQuery(selectors.panel);
      if (triggers.length === 0) {
          console.error(`Tabs ${id}: No triggers found. Expected elements with [data-tabs-trigger-id].`);
          return false;
      }
      if (panels.length === 0) {
          console.error(`Tabs ${id}: No panels found. Expected elements with [data-tabs-panel-id].`);
          return false;
      }
      // Build trigger and panel maps
      const triggerMap = new Map();
      const panelMap = new Map();
      let hasErrors = false;
      triggers.forEach((trigger)=>{
          const rawValue = trigger.getAttribute(attributes.triggerId);
          const value = normalizeValue(rawValue);
          if (!value) {
              console.error(`Tabs ${id}: Trigger has empty data-tabs-trigger-id.`);
              hasErrors = true;
              return;
          }
          trigger._tabValue = value;
          // Warn if trigger is an <a> tag
          if (trigger.tagName.toLowerCase() === 'a') {
              console.warn(`Tabs ${id}: Trigger "${value}" is an <a> tag. Use <button> for keyboard and ARIA support.`);
          }
          if (!triggerMap.has(value)) {
              triggerMap.set(value, []);
          }
          triggerMap.get(value).push(trigger);
      });
      panels.forEach((panel)=>{
          const rawValue = panel.getAttribute(attributes.panelId);
          const value = normalizeValue(rawValue);
          if (!value) {
              console.error(`Tabs ${id}: Panel has empty data-tabs-panel-id.`);
              hasErrors = true;
              return;
          }
          panel._tabValue = value;
          panelMap.set(value, panel);
      });
      // Validate matching
      triggerMap.forEach((_, value)=>{
          if (!panelMap.has(value)) {
              console.error(`Tabs ${id}: Trigger value "${value}" has no matching panel.`);
              hasErrors = true;
          }
      });
      panelMap.forEach((_, value)=>{
          if (!triggerMap.has(value)) {
              console.error(`Tabs ${id}: Panel value "${value}" has no matching trigger.`);
              hasErrors = true;
          }
      });
      if (hasErrors) return false;
      // Find optional play/pause button
      const playPauseBtn = container.querySelector(selectors.playPauseBtn);
      // Store references
      Object.assign(instance, {
          tablist,
          triggers,
          panels,
          triggerMap,
          panelMap,
          playPauseBtn
      });
      return true;
  }
  // Sets up ARIA attributes for tablist, triggers, and panels
  function setupAccessibility(instance) {
      const { tablist, triggers, panels, id } = instance;
      // Set tablist role and orientation
      tablist.setAttribute('role', 'tablist');
      triggers.forEach((trigger)=>{
          const value = trigger._tabValue;
          const triggerId = trigger.id || `${id}-trigger-${value}`;
          const panelId = `${id}-panel-${value}`;
          trigger.setAttribute('role', 'tab');
          trigger.id = triggerId;
          trigger.setAttribute('aria-controls', panelId);
      });
      panels.forEach((panel)=>{
          const value = panel._tabValue;
          const panelId = panel.id || `${id}-panel-${value}`;
          const triggerId = `${id}-trigger-${value}`;
          panel.setAttribute('role', 'tabpanel');
          panel.id = panelId;
          panel.setAttribute('aria-labelledby', triggerId);
          panel.setAttribute('tabindex', '0');
      });
  }
  // Updates ARIA states when active tab changes
  function updateAriaStates(instance) {
      const { triggers, panels, state } = instance;
      triggers.forEach((trigger)=>{
          const isActive = trigger._tabValue === state.activeValue;
          trigger.setAttribute('aria-selected', isActive.toString());
          trigger.setAttribute('tabindex', isActive ? '0' : '-1');
      });
      panels.forEach((panel)=>{
          const isActive = panel._tabValue === state.activeValue;
          panel.setAttribute('aria-hidden', (!isActive).toString());
      });
  }
  // Sets up keyboard navigation for triggers
  function setupKeyboardNavigation(instance) {
      const { container } = instance;
      const handleKeydown = (e)=>{
          // Only handle if a trigger within this container has focus
          const focusedTrigger = document.activeElement;
          if (!instance.triggers.includes(focusedTrigger) || focusedTrigger.closest(selectors.container) !== container) {
              return;
          }
          const { orientation, direction } = instance.state;
          const isHorizontal = orientation === 'horizontal';
          const isRtl = direction === 'rtl';
          // Determine prev/next keys based on orientation and direction
          let prevKey;
          let nextKey;
          if (isHorizontal) {
              prevKey = isRtl ? 'ArrowRight' : 'ArrowLeft';
              nextKey = isRtl ? 'ArrowLeft' : 'ArrowRight';
          } else {
              prevKey = 'ArrowUp';
              nextKey = 'ArrowDown';
          }
          switch(e.key){
              case prevKey:
                  e.preventDefault();
                  moveFocus(instance, -1);
                  break;
              case nextKey:
                  e.preventDefault();
                  moveFocus(instance, 1);
                  break;
              case 'Home':
                  e.preventDefault();
                  focusTriggerAt(instance, 0);
                  break;
              case 'End':
                  e.preventDefault();
                  focusTriggerAt(instance, instance.triggers.length - 1);
                  break;
          }
      };
      instance.boundHandlers.keyboard = handleKeydown;
      container.addEventListener('keydown', handleKeydown);
  }
  // Moves focus by a given direction (-1 or +1), always wrapping
  function moveFocus(instance, direction) {
      const { triggers, state } = instance;
      const currentIndex = triggers.indexOf(document.activeElement);
      if (currentIndex === -1) return;
      const nextIndex = (currentIndex + direction + triggers.length) % triggers.length;
      triggers[nextIndex].focus();
      // Stop autoplay on keyboard interaction
      if (state.isAutoplaying) {
          stopAutoplay(instance, 'user');
      }
      // Always activate on focus (automatic activation)
      activate(instance, triggers[nextIndex]._tabValue);
  }
  // Focuses trigger at a specific index
  function focusTriggerAt(instance, index) {
      const { triggers, state } = instance;
      triggers[index].focus();
      if (state.isAutoplaying) {
          stopAutoplay(instance, 'user');
      }
      // Always activate on focus
      activate(instance, triggers[index]._tabValue);
  }
  // Determines the initial active value
  function determineInitialValue(instance) {
      const { config, triggerMap, triggers } = instance;
      // Priority 1: URL parameter
      if (config.groupName) {
          const urlValue = getUrlParam(config.groupName);
          if (urlValue) {
              const normalized = normalizeValue(urlValue);
              if (triggerMap.has(normalized)) {
                  return normalized;
              }
              console.warn(`Tabs ${instance.id}: URL param "${urlValue}" doesn't match any trigger.`);
          }
      }
      // Priority 2: data-tabs-default attribute
      if (config.defaultValue) {
          const normalized = normalizeValue(config.defaultValue);
          if (triggerMap.has(normalized)) {
              return normalized;
          }
      }
      // Priority 3: First trigger
      return triggers[0]._tabValue;
  }
  // Scrolls active trigger into view for programmatic activation
  function scrollTriggerIntoView(instance, value) {
      const activeTriggers = instance.triggerMap.get(value);
      if (!activeTriggers?.length) return;
      const behavior = prefersReducedMotion() ? 'instant' : 'smooth';
      const isVertical = instance.state.orientation === 'vertical';
      activeTriggers[0].scrollIntoView({
          behavior: behavior,
          block: isVertical ? 'nearest' : 'center',
          inline: isVertical ? 'center' : 'nearest'
      });
  }
  // Activates a tab by its value
  function activate(instance, value, options = {}) {
      const { silent = false, updateUrl = true } = options;
      const normalized = normalizeValue(value);
      const { state, config, triggerMap, triggers, panels, container } = instance;
      if (!triggerMap.has(normalized)) {
          console.warn(`Tabs ${instance.id}: Value "${value}" not found.`);
          return false;
      }
      const previousValue = state.activeValue;
      // Skip if already active
      if (normalized === previousValue) return false;
      // Calculate indices for CSS variables
      const newIndex = findTriggerIndex(triggers, normalized);
      const previousIndex = previousValue ? findTriggerIndex(triggers, previousValue) : -1;
      // Set active index CSS variable
      container.style.setProperty(cssProps.activeIndex, String(newIndex));
      // Set direction CSS variable (1 = forward, -1 = backward, 0 = initial)
      const direction = previousIndex === -1 ? 0 : newIndex > previousIndex ? 1 : -1;
      container.style.setProperty(cssProps.direction, String(direction));
      // Update state
      state.activeValue = normalized;
      // Update URL
      if (updateUrl && config.groupName) {
          setUrlParam(config.groupName, normalized);
      }
      // Clear any pending transition cleanup
      if (instance._transitionTimer !== null) clearTimeout(instance._transitionTimer);
      // Add transitioning class
      container.classList.add(classes.transitioning);
      // Update trigger states
      triggers.forEach((trigger)=>{
          const triggerValue = trigger._tabValue;
          const isActive = triggerValue === normalized;
          trigger.classList.toggle(classes.active, isActive);
          // Reset progress on inactive triggers
          if (!isActive) {
              trigger.style.setProperty(cssProps.progress, '0');
          }
      });
      // Update panel states
      panels.forEach((panel)=>{
          const panelValue = panel._tabValue;
          const isActive = panelValue === normalized;
          const wasActive = panelValue === previousValue;
          // Remove previous transition classes
          panel.classList.remove(classes.panelEntering, classes.panelLeaving);
          if (isActive) {
              panel.classList.add(classes.active, classes.panelEntering);
          } else if (wasActive) {
              panel.classList.add(classes.panelLeaving);
              panel.classList.remove(classes.active);
          } else {
              panel.classList.remove(classes.active);
          }
      });
      // Remove transition classes after animation
      instance._transitionTimer = setTimeout(()=>{
          container.classList.remove(classes.transitioning);
          panels.forEach((panel)=>{
              panel.classList.remove(classes.panelEntering, classes.panelLeaving);
          });
      }, defaults.transitionDuration);
      // Update ARIA states
      updateAriaStates(instance);
      // Scroll active trigger into view for programmatic activation
      scrollTriggerIntoView(instance, normalized);
      // Emit change event
      if (!silent) {
          emit(instance, events.change, {
              value: normalized,
              previousValue
          });
      }
      return true;
  }
  // Checks tablist scroll position and updates classes on the container
  function updateScrollClasses(instance) {
      const { tablist, container, state } = instance;
      const isVertical = state.orientation === 'vertical';
      const scrollPos = isVertical ? tablist.scrollTop : tablist.scrollLeft;
      const scrollSize = isVertical ? tablist.scrollHeight : tablist.scrollWidth;
      const clientSize = isVertical ? tablist.clientHeight : tablist.clientWidth;
      // Threshold of 1px to account for subpixel rounding
      const atStart = scrollPos <= 1;
      const atEnd = scrollPos + clientSize >= scrollSize - 1;
      container.classList.toggle(classes.atStart, atStart);
      container.classList.toggle(classes.atEnd, atEnd);
  }
  // Sets up scroll position detection on the tablist
  function setupScrollDetection(instance) {
      const { tablist } = instance;
      const handleScroll = ()=>updateScrollClasses(instance);
      tablist.addEventListener('scroll', handleScroll, {
          passive: true
      });
      instance.boundHandlers.scroll = handleScroll;
      // ResizeObserver for content/container size changes and layout re-detection
      const observer = new ResizeObserver(()=>{
          detectLayout(instance);
          updateScrollClasses(instance);
      });
      observer.observe(tablist);
      instance.boundHandlers.resizeObserver = observer;
      // Initial check
      updateScrollClasses(instance);
  }
  // Attaches click handlers to triggers and play/pause button
  function attachEventListeners(instance) {
      const { triggers, playPauseBtn, state } = instance;
      // Trigger click handlers
      triggers.forEach((trigger)=>{
          const handler = (e)=>{
              e.preventDefault();
              // Stop autoplay on user interaction
              if (state.isAutoplaying) {
                  stopAutoplay(instance, 'user');
              }
              activate(instance, trigger._tabValue);
          };
          trigger.addEventListener('click', handler);
          instance.boundHandlers.triggerClicks.push({
              trigger,
              handler
          });
      });
      // Play/pause button
      if (playPauseBtn) {
          instance.boundHandlers.playPause = ()=>{
              if (state.isAutoplaying) {
                  stopAutoplay(instance, 'user');
              } else {
                  instance.play();
              }
          };
          playPauseBtn.addEventListener('click', instance.boundHandlers.playPause);
          playPauseBtn.setAttribute('aria-pressed', 'false');
      }
  }
  // Cleans up all event listeners and references
  function cleanup(instance) {
      const { container, tablist, playPauseBtn, boundHandlers } = instance;
      // Cancel pending transition timer
      if (instance._transitionTimer !== null) clearTimeout(instance._transitionTimer);
      // Remove trigger click handlers
      if (boundHandlers?.triggerClicks) {
          boundHandlers.triggerClicks.forEach(({ trigger, handler })=>{
              trigger.removeEventListener('click', handler);
          });
      }
      // Remove play/pause handler
      if (playPauseBtn && boundHandlers?.playPause) {
          playPauseBtn.removeEventListener('click', boundHandlers.playPause);
      }
      // Remove keyboard handler
      if (boundHandlers?.keyboard) {
          container.removeEventListener('keydown', boundHandlers.keyboard);
      }
      // Remove scroll handler
      if (tablist && boundHandlers?.scroll) {
          tablist.removeEventListener('scroll', boundHandlers.scroll);
      }
      // Disconnect ResizeObserver
      if (boundHandlers?.resizeObserver) {
          boundHandlers.resizeObserver.disconnect();
      }
      // Cleanup autoplay
      cleanupAutoplay(instance);
  }
  // Resets DOM to pre-initialization state
  function resetDOM(instance) {
      const { id, container, tablist, triggers, panels, playPauseBtn } = instance;
      // Container: remove attributes and classes
      container.removeAttribute(attributes.id);
      container.classList.remove(classes.transitioning, classes.playing, classes.atStart, classes.atEnd);
      container.style.removeProperty(cssProps.tabCount);
      container.style.removeProperty(cssProps.activeIndex);
      container.style.removeProperty(cssProps.direction);
      container.style.removeProperty(cssProps.autoplayDuration);
      // Tablist: remove role and aria-orientation
      if (tablist) {
          tablist.removeAttribute('role');
          tablist.removeAttribute('aria-orientation');
      }
      // Triggers: remove ARIA, classes, CSS vars, generated IDs
      triggers.forEach((trigger)=>{
          trigger.removeAttribute('role');
          trigger.removeAttribute('aria-selected');
          trigger.removeAttribute('aria-controls');
          trigger.removeAttribute('tabindex');
          // Only reset ID if we generated it (starts with instance ID prefix)
          if (trigger.id.startsWith(`${id}-trigger-`)) {
              trigger.id = '';
          }
          trigger.classList.remove(classes.active);
          trigger.style.removeProperty(cssProps.tabIndex);
          trigger.style.removeProperty(cssProps.progress);
          delete trigger._tabValue;
      });
      // Panels: remove ARIA, classes, CSS vars, generated IDs
      panels.forEach((panel)=>{
          panel.removeAttribute('role');
          panel.removeAttribute('aria-labelledby');
          panel.removeAttribute('aria-hidden');
          panel.removeAttribute('tabindex');
          // Only reset ID if we generated it (starts with instance ID prefix)
          if (panel.id.startsWith(`${id}-panel-`)) {
              panel.id = '';
          }
          panel.classList.remove(classes.active, classes.panelEntering, classes.panelLeaving);
          panel.style.removeProperty(cssProps.tabIndex);
          delete panel._tabValue;
      });
      // Play/pause button: remove aria-pressed
      if (playPauseBtn) {
          playPauseBtn.removeAttribute('aria-pressed');
      }
      // Remove instance reference from element
      delete container._tabs;
  }
  // Advances to next tab without stopping autoplay (used by autoplay tick)
  function advanceToNextTab(instance) {
      const { triggers, state } = instance;
      const currentIndex = findTriggerIndex(triggers, state.activeValue);
      const nextIndex = (currentIndex + 1) % triggers.length;
      activate(instance, triggers[nextIndex]._tabValue);
  }
  // Initializes a tabs instance
  function init(instance) {
      const { container, config } = instance;
      // Find and validate elements
      if (!findElements(instance)) {
          return false;
      }
      // Set CSS variables
      container.style.setProperty(cssProps.tabCount, String(instance.triggers.length));
      instance.triggers.forEach((trigger, index)=>{
          trigger.style.setProperty(cssProps.tabIndex, String(index));
      });
      instance.panels.forEach((panel, index)=>{
          panel.style.setProperty(cssProps.tabIndex, String(index));
      });
      // Detect orientation and direction from CSS
      detectLayout(instance);
      // Setup accessibility
      setupAccessibility(instance);
      // Determine and activate initial tab
      const initialValue = determineInitialValue(instance);
      activate(instance, initialValue, {
          silent: true,
          updateUrl: false
      });
      // Attach event listeners
      attachEventListeners(instance);
      // Setup keyboard navigation (always enabled per ARIA spec)
      setupKeyboardNavigation(instance);
      // Setup scroll position detection on tablist
      setupScrollDetection(instance);
      // Setup autoplay if enabled and reduced motion not preferred
      if (config.autoplay && !prefersReducedMotion()) {
          container.style.setProperty(cssProps.autoplayDuration, config.autoplayDuration + 'ms');
          setupAutoplay(instance, advanceToNextTab);
          startAutoplay(instance);
      }
      // Store instance ID on container for lookup
      container.setAttribute(attributes.id, instance.id);
      return true;
  }
  // Main Tabs class
  class Tabs {
      id;
      container;
      config;
      state;
      boundHandlers;
      autoplay;
      _transitionTimer;
      tablist;
      triggers;
      panels;
      triggerMap;
      panelMap;
      playPauseBtn;
      constructor(container){
          this.id = generateUniqueId();
          this.container = container;
          this.config = parseConfig(container);
          this.state = {
              activeValue: null,
              orientation: 'horizontal',
              direction: 'ltr',
              isAutoplaying: false,
              isPaused: false,
              autoplayStartTime: null,
              autoplayElapsed: 0,
              autoplayPausedOnValue: null
          };
          this.boundHandlers = {
              triggerClicks: [],
              scroll: null,
              resizeObserver: null,
              playPause: null,
              keyboard: null
          };
          this.autoplay = null;
          this._transitionTimer = null;
          // Element references (populated by findElements)
          this.tablist = null;
          this.triggers = [];
          this.panels = [];
          this.triggerMap = new Map();
          this.panelMap = new Map();
          this.playPauseBtn = null;
          const initialized = init(this);
          if (initialized) {
              this.container._tabs = this;
          } else {
              console.warn(`Tabs ${this.id}: Initialization failed.`);
          }
      }
      // Navigates to a tab by value
      goTo(value) {
          if (this.state.isAutoplaying) stopAutoplay(this, 'user');
          activate(this, value);
          return this;
      }
      // Navigates to the next tab
      next() {
          if (this.state.isAutoplaying) stopAutoplay(this, 'user');
          advanceToNextTab(this);
          return this;
      }
      // Navigates to the previous tab
      prev() {
          if (this.state.isAutoplaying) stopAutoplay(this, 'user');
          const { triggers, state } = this;
          const currentIndex = findTriggerIndex(triggers, state.activeValue);
          const prevIndex = (currentIndex - 1 + triggers.length) % triggers.length;
          activate(this, triggers[prevIndex]._tabValue);
          return this;
      }
      // Starts autoplay
      play() {
          if (prefersReducedMotion()) return this;
          if (!this.autoplay) {
              setupAutoplay(this, advanceToNextTab);
          }
          // Set autoplay duration CSS variable
          this.container.style.setProperty(cssProps.autoplayDuration, this.config.autoplayDuration + 'ms');
          startAutoplay(this);
          return this;
      }
      // Stops autoplay
      stop() {
          stopAutoplay(this, 'user');
          return this;
      }
      // Re-initializes after DOM changes
      refresh() {
          const currentValue = this.state.activeValue;
          cleanup(this);
          this.config = parseConfig(this.container);
          this.state = {
              activeValue: null,
              orientation: 'horizontal',
              direction: 'ltr',
              isAutoplaying: false,
              isPaused: false,
              autoplayStartTime: null,
              autoplayElapsed: 0,
              autoplayPausedOnValue: null
          };
          this.boundHandlers = {
              triggerClicks: [],
              scroll: null,
              resizeObserver: null,
              playPause: null,
              keyboard: null
          };
          this.autoplay = null;
          this._transitionTimer = null;
          this.tablist = null;
          this.triggers = [];
          this.panels = [];
          this.triggerMap = new Map();
          this.panelMap = new Map();
          init(this);
          // Try to restore previous active value
          if (currentValue && this.triggerMap.has(currentValue)) {
              activate(this, currentValue, {
                  silent: true
              });
          }
          return this;
      }
      // Destroys the instance and resets DOM to pre-init state
      destroy() {
          cleanup(this);
          resetDOM(this);
      }
      // Returns the current active value
      getActiveValue() {
          return this.state.activeValue;
      }
  }

  // Entry point for tabs library - auto-initialization only
  // Auto-initializes all tabs containers
  function autoInit() {
      const containers = document.querySelectorAll(selectors.container);
      containers.forEach((container)=>{
          // Skip if already initialized
          if (container._tabs) return;
          try {
              new Tabs(container);
          } catch (error) {
              console.warn('Tabs auto-initialization failed:', error);
          }
      });
  }
  if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', autoInit);
  } else {
      autoInit();
  }

  exports.Tabs = Tabs;

  return exports;

})({});
//# sourceMappingURL=tabs.js.map
