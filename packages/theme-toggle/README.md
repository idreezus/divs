# Theme Toggle

## Features

<Features>

- No flash of wrong theme on page load with inline anti-flash script
- Simple setup: add data attributes to buttons and you're done
- Style everything with CSS – the script adds no inline styles
- Works with system preference out of the box for first-time visitors
- Extend beyond light/dark to any number of custom themes
- Multiple toggle groups on a page stay in sync automatically
- SPA-friendly with refresh and cleanup methods

</Features>

## Setup

<Steps>
<Step number="1" title="Add the Anti-Flash Script">
Copy & paste this script in your Page Settings **Inside `<head>` tag** (before any stylesheets)

```html
<script>
  (function () {
    var stored = null;
    try {
      stored = localStorage.getItem('theme');
    } catch (e) {}

    var theme = stored || 'system';
    var effectiveTheme =
      theme === 'system'
        ? window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light'
        : theme;

    document.documentElement.classList.add(effectiveTheme);
    document.documentElement.setAttribute('data-theme', theme);
  })();
</script>
```

> [!IMPORTANT]
> This script must run synchronously before CSS loads to prevent theme flash. Inline it directly – don't load it from an external file.

</Step>

<Step number="2" title="Add Theme CSS Variables">
Define your theme colors using CSS custom properties. Target themes via class on `<html>`:

```css
:root {
  --bg: #ffffff;
  --text: #171717;
  --primary: #667eea;
}

.dark {
  --bg: #0a0a0a;
  --text: #fafafa;
  --primary: #818cf8;
}

body {
  background: var(--bg);
  color: var(--text);
}
```

</Step>

<Step number="3" title="Add Theme Buttons">
Mark your buttons with data attributes:

```html
<!-- Cycle toggle (cycles through all themes except system) -->
<button data-theme-toggle>Toggle Theme</button>

<!-- Or explicit theme buttons -->
<button data-theme-value="light">Light</button>
<button data-theme-value="dark">Dark</button>
<button data-theme-value="system">Auto</button>
```

</Step>

<Step number="4" title="Load the Main Script">
Copy & paste this script in your Page Settings **Before `</body>` tag**

```html
<script src="https://cdn.jsdelivr.net/gh/idreezus/divs@v1.0.0/dist/theme-toggle/v1.0.0/themeManager.min.js"></script>
```

</Step>
</Steps>

---

## How It Works

This library separates **state management** from **styling**. The script handles theme persistence and system preference detection. You control all visual styling through CSS.

The key design: there are two pieces of state:

1. **Effective theme** (`current`) – The actual visual theme (light, dark, sepia, etc.) – never "system"
2. **User's choice** (`theme`) – What the user selected ("system", "light", "dark", etc.)

This dual-state model enables CSS patterns like "show a different icon when the user chose system preference" without JavaScript.

### Anti-Flash Script

The inline `<head>` script runs synchronously before CSS loads. It reads localStorage (or defaults to "system"), then immediately sets the class on `<html>`. This prevents the flash of wrong-themed content.

### System Theme Behavior

First-time visitors (no localStorage) are treated as using system preference:

- Class on `<html>` shows effective theme (light or dark based on OS)
- `data-theme="system"` indicates they're in system mode
- Theme updates automatically when OS preference changes

When a user clicks an explicit theme button:

- `data-theme` changes to their choice (e.g., "dark")
- Theme no longer follows OS preference
- Choice is saved to localStorage

To return to system preference, click a button with `data-theme-value="system"`.

---

## Customization

### Button Attributes

| Attribute           | Value                        | Description                                |
| ------------------- | ---------------------------- | ------------------------------------------ |
| `data-theme-toggle` |                              | Cycles through all themes except "system"  |
| `data-theme-value`  | `light`, `dark`, `system`... | Sets theme to the specified value on click |

### Auto-Managed State

The script automatically manages:

| Element  | What's Set                       | Description                            |
| -------- | -------------------------------- | -------------------------------------- |
| `<html>` | Class (e.g., `dark`)             | Effective theme for CSS styling        |
| `<html>` | `data-theme` attribute           | User's choice (can be "system")        |

### CSS Targeting

Target themes via class on `<html>`:

```css
/* Light theme (default) */
:root {
  --bg: #ffffff;
  --text: #171717;
  --primary: #667eea;
}

/* Dark theme */
.dark {
  --bg: #0a0a0a;
  --text: #fafafa;
  --primary: #818cf8;
}

/* Sepia theme */
.sepia {
  --bg: #f4ecd8;
  --text: #5c4b37;
  --primary: #8b7355;
}
```

### Styling Active Buttons

Use CSS to style active buttons based on the current state.

**Two-button toggle (Light/Dark only):**

```css
/* Base button styles */
[data-theme-value] {
  padding: 10px 20px;
  background: var(--bg);
  border: 1px solid var(--border);
  cursor: pointer;
}

/* Active states - class matches effective theme */
.dark .btn-dark {
  background: var(--primary);
  color: white;
}

.light .btn-light {
  background: var(--primary);
  color: white;
}
```

**Three-button toggle (Light/Dark/System):**

When you have a "System" button, check the `data-theme` attribute instead:

```css
/* Active states - attribute matches user's choice */
[data-theme='light'] .btn-light {
  background: var(--primary);
  color: white;
}

[data-theme='dark'] .btn-dark {
  background: var(--primary);
  color: white;
}

[data-theme='system'] .btn-system {
  background: var(--primary);
  color: white;
}
```

### Detecting System vs User Choice

Show different UI elements based on the user's choice:

```css
/* Show when user chose system preference */
[data-theme='system'] .system-indicator {
  display: block;
}

/* Show when user made explicit choice */
[data-theme='light'] .user-choice-indicator,
[data-theme='dark'] .user-choice-indicator {
  display: block;
}
```

> [!NOTE]
> `data-theme-toggle` buttons are action buttons (cycle to next theme), not state indicators. Style them differently from value buttons.

### Adding Transitions

Add CSS transitions for smooth theme changes:

```css
body {
  transition: background-color 0.3s ease, color 0.3s ease;
}
```

### Multi-Theme Support

Extend beyond light/dark to any number of themes:

**1. Extend the themes array:**

```javascript
ThemeManager.themes = ['light', 'dark', 'sepia', 'high-contrast'];
```

**2. Add CSS for new themes:**

```css
.sepia {
  --bg: #f4ecd8;
  --text: #5c4b37;
}

.high-contrast {
  --bg: #000000;
  --text: #ffffff;
  --primary: #ffff00;
}
```

**3. Add buttons:**

```html
<button data-theme-value="light">Light</button>
<button data-theme-value="dark">Dark</button>
<button data-theme-value="sepia">Sepia</button>
<button data-theme-value="high-contrast">High Contrast</button>
<button data-theme-value="system">Auto</button>
```

---

## JavaScript API

### Properties

```javascript
ThemeManager.current; // Effective theme (e.g., "light", "dark") - never "system"
ThemeManager.theme; // User's choice (can be "system", "light", "dark", etc.)
ThemeManager.themes; // Array of available themes
ThemeManager.initialized; // Boolean indicating init state
```

### Methods

```javascript
// Set theme explicitly
ThemeManager.setTheme('dark');

// Set to follow system preference
ThemeManager.setTheme('system');

// Get current effective theme
ThemeManager.getTheme(); // "dark"

// Get user's choice
ThemeManager.getUserTheme(); // "system", "dark", "light", etc.

// Resolve any theme to effective value
ThemeManager.getEffectiveTheme('system'); // "light" or "dark"

// Cycle to next theme (skips "system")
ThemeManager.toggleTheme();

// Re-scan DOM for new buttons (useful for SPAs)
ThemeManager.refresh();

// Clean up all event listeners
ThemeManager.destroy();

// Re-initialize after destroy
ThemeManager.init();
```

### SPA Usage

For single-page applications where buttons may be added dynamically:

```javascript
// After adding new buttons to the DOM
ThemeManager.refresh();

// Before unmounting/cleanup
ThemeManager.destroy();

// Re-initialize on new page
ThemeManager.init();
```

---

## Events

Listen for theme changes with the `themechange` event:

```javascript
window.addEventListener('themechange', (e) => {
  console.log('Theme:', e.detail.theme); // Effective theme
  console.log('Previous:', e.detail.previous); // Previous effective theme
  console.log('User chose:', e.detail.userTheme); // User's choice
  console.log('Changed:', e.detail.effectiveChanged); // Did visual theme change?
});
```

### Event Detail Properties

| Property             | Type      | Description                             |
| -------------------- | --------- | --------------------------------------- |
| `theme`              | `string`  | Current effective theme                 |
| `previous`           | `string`  | Previous effective theme                |
| `userTheme`          | `string`  | User's choice (can be "system")         |
| `previousUserTheme`  | `string`  | Previous user's choice                  |
| `effectiveChanged`   | `boolean` | `true` if the visual appearance changed |

---

## FAQ

<Accordions>

<Accordion title="Why do I need two scripts?">
The anti-flash script must run synchronously in `<head>` before CSS loads to prevent theme flicker. The main script handles everything else and can load at the end of `<body>`. They're separate because inline `<head>` scripts should be minimal.
</Accordion>

<Accordion title="What's the difference between class and data-theme?">
The class on `<html>` (e.g., `dark`) is the **effective theme** – what's visually shown. The `data-theme` attribute is the **user's choice** – what they selected. When the user chooses "system", the class will be "light" or "dark" (based on OS), but `data-theme` will be "system".
</Accordion>

<Accordion title="Why doesn't the toggle button have an active state?">
The `data-theme-toggle` button is an action (cycle to next theme), not a state indicator. It doesn't represent any specific theme. Use `data-theme-value` buttons if you want active state styling.
</Accordion>

<Accordion title="Can I use this with server-side rendering?">
Yes. The anti-flash script reads from localStorage client-side, so there's a brief moment where the server-rendered theme might not match. For true SSR support, you'd need to read the theme preference from a cookie on the server. The library itself is client-side only.
</Accordion>

<Accordion title="What happens in private browsing mode?">
The library wraps localStorage access in try/catch. In private browsing modes that block localStorage, it falls back to system preference and won't persist choices across page loads.
</Accordion>

<Accordion title="How do I add more themes beyond light and dark?">
Set `ThemeManager.themes` to an array with your theme names, add corresponding CSS for each theme targeting the class (e.g., `.sepia`), and add buttons with `data-theme-value="X"` for each theme.
</Accordion>

</Accordions>

## License

AGPL-3.0
