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

- `head-code.js` and `head-code.min.js` - Anti-flash script for `<head>`
- `theme-toggle.js` and `theme-toggle.min.js` - Main library bundle

Build output paths:

- Dev mode: `../../dist/theme-toggle/latest/`
- Release mode: `../../dist/theme-toggle/v{version}/` and `../../dist/theme-toggle/latest/`

## Architecture

### File Structure

```
src/
├── head-code.js     # Anti-flash script (inline <head>, runs synchronously)
└── theme-toggle.js  # Entry point (auto-init + expose window.ThemeManager)
```

### Core Components

**head-code.js**

- Runs synchronously in `<head>` before CSS loads
- Prevents theme flash by setting class on `<body>` immediately
- Reads localStorage (defaults to "system" if empty)
- Sets class on `<body>` for effective theme (e.g., `dark`, `light`)
- Sets `data-theme` attribute for user's choice (can be "system")
- Self-contained (no imports) for inline use

**theme-toggle.js**

- Main ThemeManager object with all public methods
- Auto-initializes on DOMContentLoaded
- Tracks two state properties: `current` (effective theme) and `theme` (user's choice)
- Sets class on `<body>` for effective theme
- Sets `data-theme` on `<body>` for user's choice
- Dispatches `themechange` events for developer animations
- Supports cleanup via `destroy()` and dynamic refresh via `refresh()`
- Config constants inlined at top: `ATTR_THEME`, `ATTR_TOGGLE`, `ATTR_VALUE`, `STORAGE_KEY`, `DEFAULT_THEMES`

### Key Architectural Patterns

**State/UI Separation**

- Script adds NO inline styles
- Script adds theme class (e.g., `light`, `dark`) to `<body>` only
- Script defines NO colors/variables
- Developer has full styling control via CSS and events

**Dual State Model**

- `ThemeManager.current` - The effective theme (light, dark, sepia, etc.) - never "system"
- `ThemeManager.theme` - The user's choice (can be "system", "light", "dark", etc.)

**Data Flow**

1. `data-theme-value="dark"` on button → click sets `theme` to `dark`
2. `data-theme="dark"` set on `<body>` (user's choice)
3. Class `dark` added to `<body>` (effective theme)
4. CSS can target `.dark` or `[data-theme="dark"]`

**System Theme Handling**

- First-time visitors (no localStorage) = system mode (`theme = "system"`)
- `data-theme` shows user's choice (can be "system")
- Class on `<body>` shows effective theme (light/dark based on OS)
- When user chose system, theme updates automatically with OS preference changes

## Data Attributes

**On Button Elements:**

- `data-theme-toggle` - Cycles through all themes except "system"
- `data-theme-value="X"` - Sets theme to X (can be light, dark, system, sepia, etc.)

**On `<body>`:**

- `data-theme` - User's choice (can be "system", "light", "dark", etc.)
- Class (e.g., `dark`, `light`) - Effective theme for CSS targeting

## Public API

```javascript
// Properties
window.ThemeManager.themes; // Array of available themes
window.ThemeManager.current; // Effective theme (never "system")
window.ThemeManager.theme; // User's choice (can be "system")
window.ThemeManager.initialized; // Boolean indicating init state

// Methods
window.ThemeManager.setTheme(theme); // Set theme ("system" follows OS preference)
window.ThemeManager.getTheme(); // Get current effective theme
window.ThemeManager.getUserTheme(); // Get user's choice (can be "system")
window.ThemeManager.getSource(); // "user" or "system" (backwards compat)
window.ThemeManager.getEffectiveTheme(theme); // Resolve 'system' to light/dark
window.ThemeManager.toggleTheme(); // Cycle to next theme (skips "system")
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
  e.detail.userTheme; // User's choice (can be "system")
  e.detail.previousUserTheme; // Previous user choice
  e.detail.effectiveChanged; // Boolean: did visual appearance change?
});
```

## CSS Targeting

```css
/* Target effective theme via class */
.dark {
  --bg: #0a0a0a;
}
.light {
  --bg: #ffffff;
}

/* Two-button toggle: active states via class */
.dark .btn-dark {
  background: var(--active);
}
.light .btn-light {
  background: var(--active);
}

/* Three-button toggle: check user's choice via attribute */
[data-theme='system'] .btn-system {
  background: var(--active);
}
[data-theme='dark'] .btn-dark {
  background: var(--active);
}
[data-theme='light'] .btn-light {
  background: var(--active);
}
```

## localStorage

- Stores user's choice directly: `"system"`, `"dark"`, `"light"`, etc.
- First-time visitors (no localStorage) are treated as `"system"`

## Development Notes

- No dependencies - vanilla JavaScript (ES6+)
- localStorage key is fixed as `'theme'`
- IIFE pattern to avoid global pollution
- All methods return `ThemeManager` for chaining
- `try/catch` around localStorage for private browsing mode
- `head-code.js` must stay self-contained (storage key duplicated intentionally)
- CSS handles button active states - no JavaScript involvement
