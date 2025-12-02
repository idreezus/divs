# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A tiny theme engine for light, dark, and multi‑theme setups, with system sync, FOUC prevention, events, and SPA‑friendly controls.

## Build Commands

```bash
# Development build (outputs to ../../dist/theme-toggle/latest/)
npm run build

# Development build with watch mode
npm run build:watch

# Release build (outputs to both versioned and latest folders)
BUILD_MODE=release npm run build
# or
npm run release
```

The build system uses Rollup and creates:

- `headCode.js` and `headCode.min.js` - Anti-flash script for `<head>`
- `themeManager.js` and `themeManager.min.js` - Main library bundle

Build output paths:

- Dev mode: `../../dist/theme-toggle/latest/`
- Release mode: `../../dist/theme-toggle/v{version}/` and `../../dist/theme-toggle/latest/`

## Architecture

### File Structure

```
src/
├── headCode.js      # Anti-flash script (inline <head>, runs synchronously)
├── themeManager.js  # Entry point (auto-init + expose window.ThemeManager)
└── config.js        # Attribute names, defaults, and storage key
```

### Core Components

**headCode.js**

- Runs synchronously in `<head>` before CSS loads
- Prevents theme flash by setting `data-theme` on `<html>` immediately
- Reads localStorage, falls back to system preference for first-time visitors
- Sets `data-theme` to effective theme (never "system")
- Sets boolean `data-theme-system` when source is system preference
- Self-contained (no imports) for inline use

**themeManager.js**

- Main ThemeManager object with all public methods
- Auto-initializes on DOMContentLoaded
- Tracks two state properties: `current` (effective theme) and `source` ("user" or "system")
- Sets `data-theme` on `<html>` and CSS class on `<body>`
- Manages button states via `data-theme-active` (boolean attribute)
- Dispatches `themechange` events for developer animations
- Supports cleanup via `destroy()` and dynamic refresh via `refresh()`

**config.js**

- Attribute names: `ATTRIBUTES.THEME`, `ATTRIBUTES.THEME_SYSTEM`, `ATTRIBUTES.TOGGLE`, `ATTRIBUTES.VALUE`, `ATTRIBUTES.ACTIVE`
- Default themes: `DEFAULTS.THEMES = ['light', 'dark']`
- Storage key: `STORAGE.KEY = 'theme'`

### Key Architectural Patterns

**State/UI Separation**

- Script adds NO inline styles
- Script adds theme CSS class (e.g., `light`, `dark`) to `<body>` only
- Script defines NO colors/variables
- Developer has full styling control via CSS and events

**Dual State Model**

- `ThemeManager.current` - The effective theme (light, dark, sepia, etc.) - never "system"
- `ThemeManager.source` - Where the theme came from ("user" or "system")

**Data Attribute Flow**

1. `data-theme-value="dark"` on button → click sets theme to `dark`, source to `user`
2. `data-theme="dark"` set on `<html>` → CSS can target `html[data-theme="dark"]`
3. CSS class `dark` added to `<body>` → CSS can target `body.dark`
4. `data-theme-active` (boolean) on matching buttons → CSS styles active state
5. `data-theme-system` removed from `<html>` → indicates user made explicit choice

**System Theme Handling**

- First-time visitors (no localStorage) = system mode
- `data-theme` always shows effective theme (light/dark), never "system"
- `data-theme-system` (boolean attribute, no value) present when source is system
- When source is system, theme updates automatically with OS preference changes

## Data Attributes

**On Button Elements:**

- `data-theme-toggle` - Cycles through all themes except "system"
- `data-theme-value="X"` - Sets theme to X (can be light, dark, system, sepia, etc.)

**Auto-Managed by Script:**

- `data-theme-active` - Boolean attribute (present/absent), indicates active button
- `aria-pressed="true|false"` - Accessibility state
- `aria-label="X theme"` - Accessibility label

**On `<html>`:**

- `data-theme` - Effective theme value (always light/dark/sepia, never "system")
- `data-theme-system` - Boolean attribute, present when theme source is system preference

**On `<body>`:**

- CSS class (e.g., `light`, `dark`) - Effective theme as a class

## Public API

```javascript
// Properties
window.ThemeManager.themes; // Array of available themes
window.ThemeManager.current; // Effective theme (never "system")
window.ThemeManager.source; // "user" or "system"
window.ThemeManager.initialized; // Boolean indicating init state

// Methods
window.ThemeManager.setTheme(theme); // Set theme ("system" sets source to system)
window.ThemeManager.getTheme(); // Get current effective theme
window.ThemeManager.getSource(); // Get current source ("user" or "system")
window.ThemeManager.getEffectiveTheme(theme); // Resolve 'system' to light/dark
window.ThemeManager.toggleTheme(); // Cycle to next theme (skips "system")
window.ThemeManager.updateThemeButtons(); // Refresh all button states
window.ThemeManager.refresh(); // Re-scan DOM for new buttons
window.ThemeManager.init(); // Initialize (auto-called on load)
window.ThemeManager.destroy(); // Clean up all event listeners
```

## Events

```javascript
// Dispatched on window after theme changes
window.addEventListener('themechange', (e) => {
  e.detail.theme; // Effective theme (never "system")
  e.detail.previous; // Previous effective theme
  e.detail.source; // "user" or "system"
  e.detail.previousSource; // Previous source
  e.detail.effectiveChanged; // Boolean: did visual appearance change?
});
```

## CSS Targeting

```css
/* Target effective theme */
html[data-theme='dark'] {
  --bg: #0a0a0a;
}
body.dark {
  --bg: #0a0a0a;
}

/* Theme from system preference */
html[data-theme-system] .system-icon {
  display: block;
}

/* Theme explicitly chosen by user */
html:not([data-theme-system]) .user-icon {
  display: block;
}

/* Active button styling (boolean attribute) */
[data-theme-value][data-theme-active] {
  background: var(--primary);
}
```

## Active State Rules

- `data-theme-value="light"` → active when `current === "light"`
- `data-theme-value="system"` → active when `source === "system"`
- `data-theme-toggle` → NEVER active (it's an action button, not a state)
- When `source === "system"` and `current === "light"`, BOTH system and light buttons are active

## localStorage

- Stores `"system"` when user explicitly chose system mode
- Stores actual theme value (e.g., `"dark"`) when user explicitly chose a theme
- First-time visitors (no localStorage) are treated as system mode

## Development Notes

- No dependencies - vanilla JavaScript (ES6+)
- localStorage key is fixed as `'theme'`
- IIFE pattern to avoid global pollution
- All methods return `ThemeManager` for chaining
- `try/catch` around localStorage for private browsing mode
- `headCode.js` must stay self-contained (storage key duplicated intentionally)
- Boolean attributes (data-theme-system, data-theme-active) have no value - presence/absence indicates state
