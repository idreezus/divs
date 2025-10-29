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
- `marquee-diagnostics.js` and `marquee-diagnostics.min.js` - Optional diagnostics utilities

Build output paths:
- Dev mode: `../../dist/marquee/latest/`
- Release mode: `../../dist/marquee/v{version}/` and `../../dist/marquee/latest/`

## Architecture

### Core Components

**MarqueeInstance (src/marquee.js:11-571)**
- Main class managing individual marquee instances
- Stored in a WeakMap to prevent memory leaks
- Lifecycle: initialization → cloning → styling → timeline build → interaction setup

**Loop Helpers (src/utils/seamlessLoop.js)**
- `horizontalLoop()` and `verticalLoop()` create GSAP timelines for seamless looping
- Both functions use `gsap.context()` for automatic cleanup of resize listeners
- Self-refreshing on resize via internal ResizeObserver (no external observers needed)
- Use xPercent/yPercent transforms to maintain responsiveness during window resizing
- Automatically compute spacing between items using DOM geometry (getBoundingClientRect)

**Configuration System (src/config/)**
- `config.js` - Centralized attribute names and defaults
- `parsers.js` - Converts data-* attributes to normalized config objects
- Three namespaces: core (speed, direction, repeat), cloning (auto-clone, clone count), interaction (hover effects)

**Spacing Computation (src/spacing.js)**
- `computeMedianGap()` measures inter-item spacing using DOM geometry
- Respects margins, flex gaps, and padding by measuring actual rendered positions
- Returns median spacing (robust to outliers) for seamless loop padding

### Key Architectural Patterns

**Cloning Strategy**
- Items are cloned in complete sets and appended in order: `[1,2,3,4,5]` → `[1,2,3,4,5,1,2,3,4,5,1,2,3,4,5]`
- Clones marked with `aria-hidden="true"` for accessibility
- Default clone count is 2 (configurable via `data-marquee-clone-count`)
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

**Responsive Refresh**
- Loop helpers internally observe container size and window resize events
- Refresh is RAF-coalesced to batch rapid resize events
- `populateWidths()`/`populateHeights()` recalculate measurements
- `populateTimeline()` rebuilds tweens when deep=true
- Progress is saved/restored proportionally to avoid visual jumps

## Data Attributes

All configuration via `data-marquee-*` attributes on container element:

**Core:**
- `data-marquee-direction` - "horizontal" or "vertical" (required)
- `data-marquee-item="true"` - Marks child elements for animation (required on items)
- `data-marquee-speed` - Speed multiplier (default: 0.7, translates to ~70 px/sec)
- `data-marquee-reverse` - Set to "true" for reverse direction

**Cloning:**
- `data-marquee-auto-clone` - "true" (default) or "false"
- `data-marquee-clone-count` - Number of clone sets (default: 2)

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
window.Marquee.init()     // Initialize all marquees
window.Marquee.get(element) // Get instance for manual control

// Instance methods (via window.Marquee.get(element))
instance.play()
instance.pause()
instance.destroy()
```

## Development Notes

- GSAP is a peer dependency (must be loaded separately)
- Loop helpers include built-in navigation methods: `next()`, `previous()`, `toIndex()`, `current()`
- `willChange: transform` is auto-applied to items for performance
- `flexShrink: 0` is critical - prevents items from compressing in flex layout
- Reduced motion preference (`prefers-reduced-motion`) automatically slows animation to 0.1x speed

## Diagnostics

Optional diagnostics bundle provides spacing measurement tools:

```javascript
// Load marquee-diagnostics.js separately, then:
window.MarqueeDiagnostics.run('#my-marquee')        // Diagnose single container
window.MarqueeDiagnostics.runAll()                   // Diagnose all marquees
window.MarqueeDiagnostics.runHorizontalExit('#my-marquee') // Check for early repositioning
```

Diagnostics measure:
- Inter-item spacing statistics (median, mean, stddev)
- Geometry span vs helper loop distance
- Seam spacing accuracy
- Container padding/gap values
- Per-item positioning data
