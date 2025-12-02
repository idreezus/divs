# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a declarative theme toggle library that separates state management from UI presentation. Core script handles state/logic only - developers control styling/animations via CSS and custom events.

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
└── config.js        # Selectors, defaults, and storage key
```

### Core Components

**headCode.js**
- Runs synchronously in `<head>` before CSS loads
- Prevents theme flash by setting `data-theme` immediately
- Reads localStorage, falls back to system preference
- Handles `system` theme by resolving to light/dark
- Self-contained (no imports) for inline use

**themeManager.js**
- Main ThemeManager object with all public methods
- Auto-initializes on DOMContentLoaded
- Manages toggle button states and click listeners
- Dispatches `themechange` events for developer animations
- Supports cleanup via `destroy()` and dynamic refresh via `refresh()`
- Smart skip logic avoids unnecessary transitions (same effective theme)

**config.js**
- Centralized selectors: `SELECTORS.TOGGLE`
- Default themes: `DEFAULTS.THEMES = ['light', 'dark']`
- Storage key: `STORAGE.KEY = 'theme'`

### Key Architectural Patterns

**State/UI Separation**
- Script adds NO inline styles
- Script adds NO CSS classes
- Script defines NO colors/variables
- Developer has full styling control via CSS and events

**Data Attribute Flow**
1. `data-theme-toggle="dark"` on button → click sets theme to `dark`
2. `data-theme="dark"` set on `<html>` → CSS variables respond
3. `data-theme-active="true"` on matching button → CSS styles active state

**System Theme Resolution**
- When theme is `system`, set both:
  - `data-theme="system"` (the stored/selected value)
  - `data-theme-resolved="light|dark"` (actual appearance)
- CSS can target either attribute

## Data Attributes

**On Toggle Elements:**
- `data-theme-toggle="value"` - Sets specific theme on click
- `data-theme-toggle` (empty) - Cycles through themes on click

**Auto-Managed by Script:**
- `data-theme-active="true|false"` - Whether toggle's theme is active
- `aria-pressed="true|false"` - Accessibility state
- `aria-label="theme name"` - Accessibility label
- `title="Switch to X theme"` - Auto-added if not set

**On Document Root:**
- `data-theme` - Current theme value
- `data-theme-resolved` - Resolved theme (only when theme is 'system')

## Public API

```javascript
// Properties
window.ThemeManager.themes       // Array of available themes
window.ThemeManager.current      // Current theme string
window.ThemeManager.initialized  // Boolean indicating init state

// Methods
window.ThemeManager.setTheme(theme)          // Set specific theme
window.ThemeManager.getTheme()               // Get current theme
window.ThemeManager.getEffectiveTheme(theme) // Resolve 'system' to light/dark
window.ThemeManager.toggleTheme()            // Cycle to next theme
window.ThemeManager.updateThemeButtons()     // Refresh all button states
window.ThemeManager.refresh()                // Re-scan DOM for new toggle buttons
window.ThemeManager.init()                   // Initialize (auto-called on load)
window.ThemeManager.destroy()                // Clean up all event listeners
```

## Events

```javascript
// Dispatched on window after theme changes
window.addEventListener('themechange', (e) => {
  e.detail.theme           // New theme
  e.detail.previous        // Previous theme
  e.detail.effectiveTheme  // Resolved theme (light/dark)
  e.detail.effectiveChanged // Boolean: did effective appearance change?
});
```

## Development Notes

- No dependencies - vanilla JavaScript (ES6+)
- localStorage key is fixed as `'theme'`
- IIFE pattern to avoid global pollution
- All methods return `ThemeManager` for chaining
- `try/catch` around localStorage for private browsing mode
- `headCode.js` must stay self-contained (storage key duplicated intentionally)
