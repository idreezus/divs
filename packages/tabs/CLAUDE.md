# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an accessible, keyboard-navigable tabs component with autoplay support. It uses value-based linking between triggers and panels (not array indices), supports URL deep linking, and works with nested tabs.

## Build Commands

```bash
# Development build (outputs to ../../dist/tabs/latest/)
npm run build

# Development build with watch mode
npm run build:watch

# Release build (outputs to both versioned and latest folders)
BUILD_MODE=release npm run build
# or
npm run release
```

The build system uses Rollup and creates:

- `tabs.js` and `tabs.min.js` - Main library bundle
- `tabs.css` - Required styles (copied from src/styles.css)

Build output paths:

- Dev mode: `../../dist/tabs/latest/`
- Release mode: `../../dist/tabs/v{version}/` and `../../dist/tabs/latest/`

## Architecture

### File Structure

```
src/
├── tabs.js       # Entry point, auto-initialization only
├── core.js       # Tabs class, helper functions, initialization logic
├── config.js     # Centralized selectors, attributes, classes, defaults
├── autoplay.js   # Autoplay timer, RAF progress, pause/resume logic
├── utils.js      # Shared utilities (event emission)
└── styles.css    # Required CSS (panel visibility, transitions)
```

### Core Components

**Entry Point (src/tabs.js)**

- Auto-initialization on DOMContentLoaded
- Exports Tabs class for module usage
- No global window.Tabs API

**Tabs Class (src/core.js)**

- Main class managing individual tabs instances
- Lifecycle: parse config → find elements → setup accessibility → activate initial → attach listeners → setup autoplay
- Module-private helper functions for internal logic
- Instance stored on element as `container._tabs`

**Configuration (src/config.js)**

- `selectors` - DOM query selectors (bracket-wrapped for querySelectorAll)
- `attributes` - Data attribute names (for getAttribute/hasAttribute)
- `classes` - State class names
- `cssProps` - CSS custom property names
- `defaults` - Default configuration values (includes transition timing)
- `events` - CustomEvent names (change, autoplay-start, autoplay-pause)

**Autoplay System (src/autoplay.js)**

- RAF-based progress updates with `--tabs-progress` CSS variable
- IntersectionObserver pauses when out of viewport
- Separate pause states: hover, focus, user, visibility
- `canResume()` checks all conditions before resuming

### Key Architectural Patterns

**Value-Based Linking**

- Triggers and panels matched by `data-tabs-trigger-value` / `data-tabs-panel-value`
- Values normalized to lowercase, hyphenated format
- Multiple triggers can link to the same panel
- No reliance on DOM order or indices

**Scoped Instances**

- Each container is independent (supports nested tabs)
- `scopedQuery()` ensures elements belong to current container only
- Instance ID stored on container via `data-tabs-id`

**Event System**

- DOM CustomEvents only (`tabs:change`, `tabs:autoplay-start`, `tabs:autoplay-pause`)
- Events bubble from container element
- Listen via `container.addEventListener('tabs:change', handler)`

**Accessibility Setup**

- Auto-generates unique IDs for `aria-controls` / `aria-labelledby`
- Sets `role="tab"` and `role="tabpanel"`
- Manages `tabindex` and `aria-selected` on tab change
- Respects `prefers-reduced-motion`

**Keyboard Navigation**

- Arrow keys navigate based on `data-tabs-orientation`
- Home/End jump to first/last
- Optional looping with `data-tabs-loop`
- `data-tabs-activate-on-focus` controls activation behavior

## Data Attributes

All configuration via `data-tabs-*` attributes on container element:

**Core:**

- `data-tabs="container"` - Marks container for initialization (required)
- `data-tabs-trigger-value` - Links trigger to panel (required on triggers)
- `data-tabs-panel-value` - Links panel to trigger(s) (required on panels)
- `data-tabs-default` - Initial active tab value
- `data-tabs-group-name` - URL parameter name for deep linking

**Navigation:**

- `data-tabs-orientation` - `"horizontal"` (default) or `"vertical"`
- `data-tabs-activate-on-focus` - `"true"` (default) or `"false"`
- `data-tabs-loop` - `"true"` or `"false"` (default)
- `data-tabs-keyboard` - `"true"` (default) or `"false"`

**Autoplay:**

- `data-tabs-autoplay` - `"true"` or `"false"` (default)
- `data-tabs-autoplay-duration` - Milliseconds per tab (default: 5000)
- `data-tabs-autoplay-pause-hover` - `"true"` (default) or `"false"`
- `data-tabs-autoplay-pause-focus` - `"true"` (default) or `"false"`

**Navigation buttons (place inside container):**

- `data-tabs="prev"` - Previous tab button
- `data-tabs="next"` - Next tab button
- `data-tabs="play-pause"` - Autoplay toggle button

## Public API

```javascript
// Auto-initializes on DOMContentLoaded - no manual init needed

// Instance access via element
const tabs = container._tabs; // Direct access to instance

// Instance methods (chainable except getActiveValue/destroy)
tabs.goTo(value); // Activate by value
tabs.next(); // Next tab
tabs.prev(); // Previous tab
tabs.play(); // Start autoplay
tabs.pause(); // Pause autoplay
tabs.refresh(); // Re-initialize after DOM changes
tabs.destroy(); // Clean up and reset DOM
tabs.getActiveValue(); // Returns current active value

// For module users
import { Tabs } from './tabs.js';
const tabs = new Tabs(container); // Manual instantiation
```

## Development Notes

- No external dependencies
- Uses native ES modules (bundled to IIFE for browser)
- CSS custom properties set during initialization (and refresh):
  - `--tabs-count` on container (total number of tabs)
  - `--tabs-index` on each trigger and panel (zero-based index)
  - `--tabs-active-index` on container (updates on tab change)
  - `--tabs-direction` on container (1=forward, -1=backward, 0=initial)
  - `--tabs-autoplay-duration` on container when autoplay enabled (e.g., `5000ms`)
  - `--tabs-progress` on active trigger via RAF during autoplay (0-1)
- Reduced motion preference disables autoplay automatically
- Warns in console if triggers are `<a>` tags (buttons preferred)
- Validates that all triggers have matching panels and vice versa
