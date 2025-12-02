# Theme Toggle

## Features

- **Zero flash** - Anti-flash script prevents theme flicker on page load
- **Declarative** - Just add data attributes, auto-initialized
- **CSS-first** - Most UI patterns work with CSS selectors alone, no JS needed
- **State/UI separation** - Core script handles state only, you control styling
- **Multi-theme support** - Extend beyond light/dark to any number of themes
- **System sync** - First-time visitors use OS preference, with option to follow system
- **SPA-friendly** - `refresh()` and `destroy()` methods for dynamic apps
- **Accessible** - Auto-managed ARIA attributes
- **Lightweight** - No dependencies, ~1KB minified

## Quick Start

### 1. Add the anti-flash script (inline in `<head>`)

```html
<head>
  <script src="headCode.min.js"></script>
  <!-- OR inline the contents of headCode.min.js directly -->
  <link rel="stylesheet" href="styles.css" />
</head>
```

### 2. Add theme CSS variables

```css
:root {
  --bg: white;
  --text: black;
}

/* Target via data-theme attribute or body class */
html[data-theme='dark'],
body.dark {
  --bg: #1a1a1a;
  --text: white;
}

body {
  background: var(--bg);
  color: var(--text);
}
```

### 3. Add theme buttons

```html
<!-- Cycle toggle (cycles through all themes except system) -->
<button data-theme-toggle>Toggle Theme</button>

<!-- Or explicit theme buttons -->
<button data-theme-value="light">Light</button>
<button data-theme-value="dark">Dark</button>
<button data-theme-value="system">Auto</button>
```

### 4. Load the main script

```html
<script src="themeManager.min.js"></script>
```

## Data Attributes

### Button Attributes

| Attribute              | Purpose      | Behavior                                    |
| ---------------------- | ------------ | ------------------------------------------- |
| `data-theme-toggle`    | Cycle button | Cycles through all themes except "system"   |
| `data-theme-value="X"` | Theme setter | Sets theme to X (light, dark, system, etc.) |

### Auto-Managed by Script

| Attribute           | Element | Description                            |
| ------------------- | ------- | -------------------------------------- |
| `data-theme-active` | Buttons | Boolean attribute, present when active |
| `aria-pressed`      | Buttons | Accessibility state                    |
| `aria-label`        | Buttons | Theme name for screen readers          |

### Document Root

| Attribute           | Element  | Description                                              |
| ------------------- | -------- | -------------------------------------------------------- |
| `data-theme`        | `<html>` | Effective theme (always light/dark/etc., never "system") |
| `data-theme-system` | `<html>` | Boolean attribute, present when using system preference  |
| CSS class           | `<body>` | Effective theme as a class (e.g., `light`, `dark`)       |

## CSS Targeting

The library provides multiple ways to target themes via CSS:

```css
/* Target effective theme (most common) */
html[data-theme='dark'] {
  --bg: #0a0a0a;
}
body.dark {
  --bg: #0a0a0a;
}

/* Detect if theme comes from system preference */
html[data-theme-system] .system-indicator {
  display: block;
}

/* Detect if theme was explicitly chosen by user */
html:not([data-theme-system]) .user-choice-indicator {
  display: block;
}

/* Dark theme from system preference specifically */
html[data-theme='dark'][data-theme-system] {
  /* ... */
}

/* Style active buttons (boolean attribute) */
[data-theme-value][data-theme-active] {
  background: var(--primary);
  color: white;
}
```

## API

### Properties

```javascript
ThemeManager.current; // Effective theme (e.g., "light", "dark") - never "system"
ThemeManager.source; // "user" or "system" - where the theme came from
ThemeManager.themes; // Array of available themes
ThemeManager.initialized; // Boolean indicating init state
```

### Methods

```javascript
// Set theme explicitly (source becomes "user")
ThemeManager.setTheme('dark');

// Set to follow system preference (source becomes "system")
ThemeManager.setTheme('system');

// Get current effective theme
ThemeManager.getTheme(); // "dark"

// Get current source
ThemeManager.getSource(); // "user" or "system"

// Resolve any theme to effective value
ThemeManager.getEffectiveTheme('system'); // "light" or "dark"

// Cycle to next theme (skips "system")
ThemeManager.toggleTheme();

// Update all button states
ThemeManager.updateThemeButtons();

// Re-scan DOM for new buttons (useful for SPAs)
ThemeManager.refresh();

// Clean up all event listeners
ThemeManager.destroy();

// Re-initialize after destroy
ThemeManager.init();
```

## Events

```javascript
window.addEventListener('themechange', (e) => {
  console.log('Theme:', e.detail.theme); // Effective theme
  console.log('Previous:', e.detail.previous); // Previous effective theme
  console.log('Source:', e.detail.source); // "user" or "system"
  console.log('Changed:', e.detail.effectiveChanged); // Did visual theme change?
});
```

### Event Detail Properties

| Property           | Type    | Description                             |
| ------------------ | ------- | --------------------------------------- |
| `theme`            | string  | Current effective theme                 |
| `previous`         | string  | Previous effective theme                |
| `source`           | string  | `"user"` or `"system"`                  |
| `previousSource`   | string  | Previous source                         |
| `effectiveChanged` | boolean | `true` if the visual appearance changed |

## System Theme Behavior

First-time visitors (no localStorage) are treated as using system preference:

- `data-theme` shows effective theme (light or dark based on OS)
- `data-theme-system` attribute is present
- Theme updates automatically when OS preference changes

When a user clicks an explicit theme button:

- `data-theme-system` is removed
- Theme no longer follows OS preference
- Choice is saved to localStorage

To return to system preference, click a button with `data-theme-value="system"`.

## Multi-Theme Support

### 1. Extend the themes array

```javascript
ThemeManager.themes = ['light', 'dark', 'sepia', 'high-contrast'];
```

### 2. Add CSS for new themes

```css
html[data-theme='sepia'],
body.sepia {
  --bg: #f4ecd8;
  --text: #5c4b37;
}
```

### 3. Add buttons

```html
<button data-theme-value="light">Light</button>
<button data-theme-value="dark">Dark</button>
<button data-theme-value="sepia">Sepia</button>
<button data-theme-value="system">Auto</button>
```

## Styling Active Buttons

```css
/* Boolean attribute - no value needed */
[data-theme-value][data-theme-active] {
  background: var(--primary);
  color: white;
}

/* Inactive buttons */
[data-theme-value]:not([data-theme-active]) {
  opacity: 0.6;
}

/* Note: data-theme-toggle buttons never have data-theme-active */
```

## SPA Usage

For single-page applications where buttons may be added dynamically:

```javascript
// After adding new buttons to the DOM
ThemeManager.refresh();

// Before unmounting/cleanup
ThemeManager.destroy();

// Re-initialize on new page
ThemeManager.init();
```

## Adding Transitions

Add CSS transitions for smooth theme changes:

```css
body {
  transition: background-color 0.3s ease, color 0.3s ease;
}
```

## Build

```bash
# Development build
npm run build

# Watch mode
npm run build:watch

# Release build (versioned + latest)
npm run release
```

## License

AGPL-3.0
