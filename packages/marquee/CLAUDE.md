# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a seamless marquee animation library powered by GSAP. It provides horizontal and vertical scrolling marquees with auto-cloning, responsive resizing, and hover interaction effects.

## Build Commands

```bash
# Development build (outputs to ../../dist/marquee/latest/)
npm run build

# Development build with watch mode
npm run build:watch

# Release build (outputs to both versioned and latest folders)
BUILD_MODE=release npm run build
# or
npm run release
```

The build system uses Rollup and creates:
- `marquee.js` and `marquee.min.js` - Main library bundle

Build output paths:
- Dev mode: `../../dist/marquee/latest/`
- Release mode: `../../dist/marquee/v{version}/` and `../../dist/marquee/latest/`

## Architecture

### File Structure

```
src/
├── marquee.js          # Entry point, auto-initializes on DOMContentLoaded
├── api.js              # Public API (init, get, pause, play, destroy, etc.)
├── core.js             # MarqueeInstance class (main logic coordinator)
├── setup/              # Initialization & configuration
│   ├── config.js       # Centralized attribute names and defaults
│   └── parsers.js      # Converts data-* attributes to config objects
├── features/           # Feature-specific logic
│   ├── cloning.js      # Smart clone calculation and management
│   ├── timeline.js     # Timeline building and rebuilding
│   ├── hover.js        # Hover interaction effects (pause/slow)
│   └── spacing.js      # Median gap computation for seamless looping
└── utils/              # Helpers
    └── seamlessLoop.js # GSAP horizontal/vertical loop helpers
```

### Core Components

**MarqueeInstance (src/core.js)**
- Main class managing individual marquee instances
- Stored in a WeakMap to prevent memory leaks
- Lifecycle: initialization → cloning → styling → timeline build → interaction setup

**Loop Helpers (src/utils/seamlessLoop.js)**
- `horizontalLoop()` and `verticalLoop()` create GSAP timelines for seamless looping
- Both functions use `gsap.context()` for automatic cleanup of resize listeners
- Self-refreshing on resize via internal ResizeObserver (no external observers needed)
- Use xPercent/yPercent transforms to maintain responsiveness during window resizing
- Automatically compute spacing between items using DOM geometry (getBoundingClientRect)

**Configuration System (src/setup/)**
- `config.js` - Centralized attribute names and defaults
- `parsers.js` - Converts data-* attributes to normalized config objects
- Three namespaces: core (speed, direction, repeat, reverse), cloning (auto-clone, smart clone count), interaction (hover effects)
- Validates CSS and warns about common issues (missing flex, overflow, reverse directions)

**Spacing Computation (src/features/spacing.js)**
- `computeMedianGap()` measures inter-item spacing using DOM geometry
- Respects margins, flex gaps, and padding by measuring actual rendered positions
- Returns median spacing (robust to outliers) for seamless loop padding

### Key Architectural Patterns

**Cloning Strategy**
- Items are cloned in complete sets and appended in order: `[1,2,3,4,5]` → `[1,2,3,4,5,1,2,3,4,5,1,2,3,4,5]`
- Clones marked with `aria-hidden="true"` and `data-marquee-clone="true"` for accessibility and safe removal
- Clone count is auto-calculated based on container/item sizes (can be overridden via `data-marquee-clone-count`)
- Capped at maximum of 10 clones for performance
- Can be disabled with `data-marquee-auto-clone="false"`

**Timeline Rebuild Logic**
- Timeline rebuilds preserve visual state by capturing and restoring: previous time, timeScale, paused state
- `rebuildTimeline()` (src/marquee.js:169-240) wraps previous playhead time to new duration to avoid visible jumps
- Spacing measurements use only original items (not clones) when available to reflect author's intent

**Interaction Effects**
- Two effect types: `pause` (ramps down to stop) and `slow` (ramps to sustained slower speed)
- Trigger areas: `container` (default) or `items` (individual hover per item)
- Pause effect uses a two-stage ramp timeline: optional mid-ratio phase → full pause
- All speed changes preserve playback direction sign to maintain forward/reverse behavior
- `wasPausedByEffect` flag prevents double-triggering during hover

**Responsive Refresh & Direction Detection**
- Loop helpers internally observe container size and window resize events
- Refresh is RAF-coalesced with cancelAnimationFrame to batch rapid resize events
- Direction changes detected automatically via `onDirectionChange` callback during resize
- `populateWidths()`/`populateHeights()` recalculate measurements
- `populateTimeline()` rebuilds tweens when deep=true
- Progress is saved/restored proportionally to avoid visual jumps
- Full rebuild triggered when CSS flex-direction changes (e.g., at breakpoints)

## Data Attributes

All configuration via `data-marquee-*` attributes on container element:

**Core:**
- `data-marquee="true"` - Marks container for initialization (required)
- `data-marquee-item="true"` - Marks child elements for animation (required on items)
- `data-marquee-speed` - Speed multiplier (default: 0.7, where 1.0 ≈ 100px/sec)
- `data-marquee-reverse` - Set to "true" for reverse direction
- `data-marquee-repeat` - Number of loops (default: -1 for infinite, 0 for once, positive numbers for count)

**Cloning:**
- `data-marquee-auto-clone` - "true" (default) or "false"
- `data-marquee-clone-count` - Number of clone sets (auto-calculated if not set, max: 10)

**Interaction:**
- `data-marquee-hover-effect` - "pause" or "slow"
- `data-marquee-hover-trigger` - "container" (default) or "items"
- `data-marquee-hover-speed-ratio` - Target speed fraction during hover
- `data-marquee-hover-pause-duration` - Total ramp duration for pause effect
- `data-marquee-hover-duration-in` - Ramp-in duration for slow effect
- `data-marquee-hover-duration-out` - Ramp-out duration for slow effect
- `data-marquee-hover-ease-in` - GSAP ease for ramp-in (default: "power1.out")
- `data-marquee-hover-ease-out` - GSAP ease for ramp-out (default: "power1.out")

## Public API

```javascript
// Auto-initializes on DOMContentLoaded
window.Marquee.init(selector, options)  // Initialize marquees
window.Marquee.get(element)             // Get single instance
window.Marquee.getAll(selector)         // Get all instances (array)
window.Marquee.has(element)             // Check if has instance (boolean)

// Control methods (chainable)
window.Marquee.pauseAll(selector)       // Pause multiple
window.Marquee.playAll(selector)        // Play multiple
window.Marquee.refresh(element)         // Refresh direction for one
window.Marquee.refreshAll(selector)     // Refresh direction for all
window.Marquee.destroy(element)         // Destroy one
window.Marquee.destroyAll(selector)     // Destroy multiple

// Instance methods (via window.Marquee.get(element))
instance.play()
instance.pause()
instance.destroy()
instance.rebuild(preserveState)
instance.refreshDirection()             // Manual direction check/rebuild
```

## Development Notes

- GSAP is a peer dependency (must be loaded separately)
- Loop helpers include built-in navigation methods: `next()`, `previous()`, `toIndex()`, `current()`
- `willChange: transform` is auto-applied to items for performance
- `flexShrink: 0` is critical - prevents items from compressing in flex layout
- Reduced motion preference (`prefers-reduced-motion`) automatically slows animation to 0.1x speed
- Debug mode: Add `?marquee-debug` to URL to see auto-calculated clone counts in console
