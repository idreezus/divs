# Theme Toggle

A declarative theme toggle that separates state management from UI presentation. Zero flash, localStorage persistence, system preference sync.

## Features

- **Zero flash** - Anti-flash script prevents theme flicker on page load
- **Declarative** - Just add data attributes, auto-initialized
- **State/UI separation** - Core script handles state only, you control styling
- **Multi-theme support** - Extend beyond light/dark to any number of themes
- **System sync** - Optional `system` theme follows OS preference
- **SPA-friendly** - `refresh()` and `destroy()` methods for dynamic apps
- **Accessible** - Auto-managed ARIA attributes
- **Lightweight** - No dependencies, ~1KB minified

## Quick Start

### 1. Add the anti-flash script (inline in `<head>`)

```html
<head>
  <script src="headCode.min.js"></script>
  <!-- OR inline the contents of headCode.min.js directly -->
  <link rel="stylesheet" href="styles.css">
</head>
```

### 2. Add theme CSS variables

```css
:root {
  --bg: white;
  --text: black;
}

[data-theme="dark"],
[data-theme-resolved="dark"] {
  --bg: #1a1a1a;
  --text: white;
}

body {
  background: var(--bg);
  color: var(--text);
}
```

### 3. Add toggle buttons

```html
<button data-theme-toggle="light">Light</button>
<button data-theme-toggle="dark">Dark</button>
```

### 4. Load the main script

```html
<script src="themeManager.min.js"></script>
```

## Data Attributes

### Toggle Buttons

| Attribute | Value | Description |
|-----------|-------|-------------|
| `data-theme-toggle` | `"light"`, `"dark"`, etc. | Sets specific theme on click |
| `data-theme-toggle` | (empty) | Cycles through themes on click |

### Auto-Managed (by script)

| Attribute | Description |
|-----------|-------------|
| `data-theme-active` | `"true"` / `"false"` on toggle buttons |
| `aria-pressed` | Accessibility state |
| `aria-label` | Theme name for screen readers |
| `title` | Auto-added if not set by developer |

### Document Root

| Attribute | Description |
|-----------|-------------|
| `data-theme` | Current theme on `<html>` |
| `data-theme-resolved` | Resolved theme when using `system` |

## API

```javascript
// Set theme programmatically
ThemeManager.setTheme('dark');

// Get current theme
ThemeManager.getTheme(); // 'dark'

// Get effective theme (resolves 'system' to actual light/dark)
ThemeManager.getEffectiveTheme('system'); // 'light' or 'dark'

// Cycle to next theme
ThemeManager.toggleTheme();

// Update all toggle button states
ThemeManager.updateThemeButtons();

// Re-scan DOM for new toggle buttons (useful for SPAs)
ThemeManager.refresh();

// Clean up all event listeners
ThemeManager.destroy();

// Re-initialize after destroy
ThemeManager.init();

// Extend available themes
ThemeManager.themes = ['light', 'dark', 'system', 'sepia'];
```

## Events

```javascript
window.addEventListener('themechange', (e) => {
  console.log('Theme changed to:', e.detail.theme);
  console.log('Previous theme:', e.detail.previous);
  console.log('Effective theme:', e.detail.effectiveTheme);
  console.log('Did effective theme change?', e.detail.effectiveChanged);

  // Add transition animation
  document.body.classList.add('theme-transitioning');
  setTimeout(() => {
    document.body.classList.remove('theme-transitioning');
  }, 300);
});
```

### Event Detail Properties

| Property | Description |
|----------|-------------|
| `theme` | The new theme value |
| `previous` | The previous theme value |
| `effectiveTheme` | The resolved theme (`'light'` or `'dark'`) |
| `effectiveChanged` | `true` if the effective appearance changed |

## Multi-Theme Support

### 1. Extend the themes array

```javascript
// Before init or after page load
ThemeManager.themes = ['light', 'dark', 'system', 'sepia'];
```

### 2. Add CSS for new themes

```css
[data-theme="sepia"] {
  --bg: #f4ecd8;
  --text: #5c4b37;
}
```

### 3. Add toggle buttons

```html
<button data-theme-toggle="light">Light</button>
<button data-theme-toggle="dark">Dark</button>
<button data-theme-toggle="system">System</button>
<button data-theme-toggle="sepia">Sepia</button>
```

## System Theme

The `system` theme follows the user's OS preference:

```html
<button data-theme-toggle="system">Auto</button>
```

When active:
- `data-theme="system"` is set on `<html>`
- `data-theme-resolved="light"` or `"dark"` reflects actual appearance
- Changes automatically when OS preference changes

## Styling Toggle Buttons

```css
/* Inactive state */
[data-theme-toggle] {
  opacity: 0.6;
}

/* Active state */
[data-theme-toggle][data-theme-active="true"] {
  opacity: 1;
  font-weight: bold;
}
```

## Cycle Toggle

A single button that cycles through all themes:

```html
<button data-theme-toggle>Toggle Theme</button>
```

## SPA Usage

For single-page applications where toggle buttons may be added dynamically:

```javascript
// After adding new toggle buttons to the DOM
ThemeManager.refresh();

// Before unmounting/cleanup
ThemeManager.destroy();

// Re-initialize on new page
ThemeManager.init();
```

## Adding Transitions

Add your own CSS transitions for smooth theme changes:

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
